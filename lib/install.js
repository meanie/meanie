'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var npm = require('npm');
var path = require('path');
var jf = require('jsonfile');
var chalk = require('chalk');
var semver = require('semver');

/**
 * Meanie dependencies
 */
var copyFiles = require('./utility/copyFiles');

/**
 * Modules to install and modules we did install
 */
var installModules = [];
var installedModules = [];

/**
 * Get package name based on given module name
 */
function getPackageName(installModule) {
  return 'meanie-' + installModule;
}

/**
 * Get the sources path for given module install path
 */
function getSourcePath(installPath) {
  return installPath + '/src';
}

/**
 * Get the destination path
 */
function getDestinationPath(projectDir, manifest) {
  var destinationPath = projectDir;
  if (manifest && manifest.destination) {
    destinationPath = path.join(destinationPath, manifest.destination);
  }
  return destinationPath;
}

/**
 * Check if a module has already been installed
 */
function hasInstalled(module) {
  return installedModules.indexOf(module) === -1;
}

/**
 * Install dependencies
 */
function installDependencies(manifest, meanie, cb) {

  //No manifest or dependencies?
  if (!manifest || !manifest.dependencies || typeof manifest.dependencies !== 'object') {
    return cb(null);
  }

  //Get number of dependencies
  var toInstall = [];

  //Go over the dependencies
  for (var dependency in manifest.dependencies) {
    if (manifest.dependencies.hasOwnProperty(dependency)) {
      var requiredVersion = manifest.dependencies[dependency];

      //Check if we need to install it
      if (!meanie.config.hasModule(dependency, requiredVersion)) {
        console.log(
          'Module requires', chalk.magenta(dependency),
          'version', chalk.magenta(requiredVersion)
        );
        toInstall.push(dependency);
      }
    }
  }

  //Install the dependencies now
  if (toInstall.length) {
    install.call(meanie, toInstall, function(error) {
      if (error) {
        return cb(new Error('Failed to install dependencies'));
      }
      cb(null);
    });
  }
}

/**
 * Install a meanie module
 */
function doInstall(installModule, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Get self
  var self = this;

  //Log
  console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(installModule));
  if (self.config.hasModule(installModule)) {
    if (!self.force) {
      console.log('Already installed, please run `meanie update` if you wish to update.');
      return cb(null);
    }
    console.log('Already installed, but force installing anyway.');
  }

  //Load NPM
  npm.load(function(error, npm) {
    if (error) {
      return cb(error);
    }

    //Get package name
    var meaniePackage = getPackageName(installModule);

    //Install package
    npm.commands.install([meaniePackage], function(error, data) {

      //Failed to install
      if (error) {
        return cb(error);
      }

      //Actual data is first item in the array
      data = data[0];

      //Get install data
      var installVersion = data[0].split('@')[1];
      var installPath = data[1];
      var manifestPath = path.resolve(installPath + '/meanie.json');

      //Read meanie.json manifest
      var manifest;
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = jf.readFileSync(manifestPath);
        }
        catch (e) {
          return cb(new Error('Could not read module manifest file'));
        }
      }
      else {
        return cb(new Error('Could not find module manifest file'));
      }

      //Validate CLI version
      if (manifest && manifest.cliVersion) {
        if (semver.lt(self.env.cliVersion, manifest.cliVersion)) {
          if (!self.force) {
            return cb(new Error('This module needs Meanie CLI version ' + manifest.cliVersion));
          }
          console.warn(chalk.yellow(
            'Module needs Meanie CLI version ', manifest.cliVersion + ',',
            'but force installing anyway.'
          ));
        }
      }

      //Install dependencies
      installDependencies(manifest, self, function(error) {

        //Failed to install dependencies
        if (error) {
          return cb(error);
        }

        //Determine source and destination paths
        var sourcePath = getSourcePath(installPath);
        var destinationPath = getDestinationPath(self.projectDir, manifest);

        //Copy contents from install path to project dir
        copyFiles(sourcePath, destinationPath, function(error) {

          //Failed to copy
          if (error) {
            return cb(error);
          }

          //Add to config
          self.config.addModule(installModule, installVersion, function(error) {
            if (error) {
              console.warn(chalk.yellow('Could not update meaniefile'));
            }
          });

          //Module was installed successfully
          console.log(chalk.green(
            'Module', chalk.magenta(installModule), 'version',
            chalk.magenta(installVersion), 'installed successfully'
          ));
          if (manifest) {
            if (manifest.instructions) {
              console.log(chalk.grey(
                'Usage instructions: ', chalk.cyan(manifest.instructions)
              ));
            }
            if (manifest.postInstall) {
              console.log(chalk.grey(manifest.postInstall));
            }
          }
          installedModules.push(installModule);
          cb(null, [installModule, installVersion, installPath]);
        });
      });
    });
  });
}

/**
 * Install several modules in series
 */
function install(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Must have configuration file to install modules
  if (!this.config.exists()) {
    return cb(new Error(
      'No Meanie project detected in the current or parent directories.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }

  //Get modules to install
  installModules = args;
  if (!Array.isArray(installModules)) {
    installModules = [installModules];
  }

  //Nothing to do?
  if (installModules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  //Get module
  var installModule = installModules.shift();
  var self = this;

  //Run install
  doInstall.call(this, installModule, function(error) {

    //Module failed to install
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(installModule),
        chalk.red('failed to install:\n' + error.message)
      );
      return cb(new Error('Some modules failed to install'));
    }

    //Module installed! Go for the next one
    if (installModules.length > 0) {
      install.call(self, installModules, cb);
      return;
    }

    //Done installing
    cb(null);
  });
}

/**
 * Module export
 */
module.exports = install;
