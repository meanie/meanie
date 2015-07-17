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
var meanie = require('./meanie');
var copyFiles = require('./utility/copyFiles');

/**
 * Modules to install and modules we did install
 */
var installedModules = [];

/**
 * Get vendor path for a given package
 */
function getVendorPath(packageName, withFile) {
  return 'client/vendor/' + packageName + (withFile ? ('/' + packageName + '.js') : '');
}

/**
 * Get the destination path
 */
function getDestinationPath(manifest) {
  var destinationPath = meanie.project.dir;
  if (manifest.destination) {
    destinationPath = path.join(destinationPath, manifest.destination);
  }
  return destinationPath;
}

/**
 * Read module manifest
 */
function readManifest(installPath, cb) {

  //Get path and check if exists
  var manifestPath = path.resolve(installPath + '/meanie.json');
  if (!fs.existsSync(manifestPath)) {
    return cb(new Error('Could not find module manifest file'));
  }

  //Try to read
  var manifest;
  try {
    manifest = jf.readFileSync(manifestPath);
    if (!manifest || typeof manifest !== 'object') {
      return cb(new Error('Invalid module manifest file'));
    }
  }
  catch (e) {
    return cb(new Error('Could not read module manifest file'));
  }

  //Return manifest
  cb(null, manifest);
}

/**
 * Read assets
 */
function readAssets(cb) {

  //Check path
  var assetsPath = path.resolve(meanie.project.dir + '/assets.json');
  if (!fs.existsSync(assetsPath)) {
    return cb(new Error('Could not find projects assets file'));
  }

  //Read assets
  var assets;
  try {
    assets = jf.readFileSync(assetsPath);
    if (!assets || typeof assets !== 'object') {
      return cb(new Error('Invalid project assets file'));
    }
  }
  catch (e) {
    return cb(new Error('Could not read project assets file'));
  }

  //Success
  cb(null, assets);
}

/**
 * Write assets
 */
function writeAssets(assets, cb) {

  //Get path and write assets
  var assetsPath = path.resolve(meanie.project.dir + '/assets.json');
  try {
    jf.spaces = 2;
    jf.writeFileSync(assetsPath, assets);
  }
  catch (e) {
    return cb(new Error('Could not update project assets file'));
  }

  //Success
  cb(null);
}

/**
 * Add entry to vendor assets
 */
function addToVendorAssets(file, cb) {

  //Try to read assets
  readAssets(function(error, assets) {
    if (error) {
      return cb(error);
    }

    //Prepare data
    assets.client = assets.client || {};
    assets.client.js = assets.client.js || {};
    assets.client.js.vendor = assets.client.js.vendor || [];

    //Add to assets
    assets.client.js.vendor.push(file);

    //Write again
    writeAssets(assets, function(error) {
      if (error) {
        return cb(error);
      }
      cb(null);
    });
  });
}

/**
 * Install dependencies
 */
function installDependencies(manifest, cb) {

  //No dependencies?
  if (!manifest.dependencies || typeof manifest.dependencies !== 'object') {
    return cb(null);
  }

  //Get number of dependencies
  var toInstall = [];

  //Go over the dependencies
  for (var dependency in manifest.dependencies) {
    if (manifest.dependencies.hasOwnProperty(dependency)) {
      var requiredVersion = manifest.dependencies[dependency];

      //Check if we need to install it
      if (!meanie.project.hasModule(dependency, requiredVersion)) {
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
    meanie.commands.install(toInstall, function(error) {
      if (error) {
        return cb(new Error('Failed to install dependencies'));
      }
      cb(null);
    });
  }
}

/**
 * Success handler
 */
function success(module, version, manifest, cb) {
  console.log(chalk.green(
    'Module', chalk.magenta(module), 'version',
    chalk.magenta(version), 'installed successfully'
  ));
  if (manifest.instructions) {
    console.log(chalk.grey(
      'Usage instructions: ', chalk.cyan(manifest.instructions)
    ));
  }
  if (manifest.postInstall) {
    console.log(chalk.grey(manifest.postInstall));
  }
  installedModules.push(module);
  cb(null, [module, version, manifest]);
}

/*****************************************************************************
 * Single module installer
 ***/

/**
 * Install a meanie module
 */
function doInstall(module, cb) {
  cb = cb || function() {};

  //Log
  console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(module));
  if (meanie.project.hasModule(module)) {
    if (!meanie.force) {
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
    var npmPackage = meanie.getPackageName(module);

    //Install package using npm
    npm.commands.install([npmPackage], function(error, data) {
      if (error) {
        return cb(error);
      }

      //Actual data is first item in the array
      data = data[0];

      //Get install data
      var version = data[0].split('@')[1];
      var installPath = data[1];

      //Read meanie.json manifest
      readManifest(installPath, function(error, manifest) {
        if (error) {
          return cb(error);
        }

        //Validate CLI version
        if (manifest.cliVersion) {
          if (semver.lt(meanie.env.cliVersion, manifest.cliVersion)) {
            if (!meanie.force) {
              return cb(new Error(
                'This module requires Meanie CLI version ' + manifest.cliVersion
              ));
            }
            console.warn(chalk.yellow(
              'Module requires Meanie CLI version ', manifest.cliVersion + ',',
              'but force installing anyway.'
            ));
          }
        }

        //Prepare for file copying
        var sourcePath, destinationPath;

        //Vendor package?
        if (manifest.packageType === 'vendor') {
          sourcePath = installPath;
          destinationPath = meanie.project.dir + '/' + getVendorPath(npmPackage);
          console.log(chalk.grey('Vendor type package, installing to', getVendorPath(npmPackage)));
        }

        //Meanie package
        else {
          sourcePath = installPath + '/src';
          destinationPath = getDestinationPath(manifest);
        }

        //Copy files
        copyFiles(sourcePath, destinationPath, function(error) {

          //Failed to copy
          if (error) {
            return cb(error);
          }

          //Add to config
          meanie.project.addModule(module, version, function(error) {
            if (error) {
              console.warn(chalk.yellow('Could not update meaniefile'));
            }
          });

          //Add to assets if vendor type package
          if (manifest.packageType === 'vendor') {
            var filePath = getVendorPath(npmPackage, true);
            addToVendorAssets(filePath, function(error) {
              if (error) {
                console.warn(chalk.yellow(
                  'Could not add module to assets file. Add it manually @ `client.js.vendor`:',
                  '"' + getVendorPath(npmPackage, true) + '"'
                ));
              }
            });
          }

          //No dependencies?
          if (!manifest.dependencies) {
            return success(module, version, manifest, cb);
          }

          //Install dependencies
          installDependencies(manifest, function(error) {
            if (error) {
              return cb(error);
            }

            //Success
            success(module, version, manifest, cb);
          });
        });
      });
    });
  });
}

/*****************************************************************************
 * Command function
 ***/

/**
 * Install modules
 */
function install(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Must have configuration file to install modules
  if (!this.project.hasConfig()) {
    return cb(new Error(
      'No Meanie project detected in the current or parent directories.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }

  //Get modules to install
  var modules = args;
  if (modules && !Array.isArray(modules)) {
    modules = [modules];
  }

  //Nothing to do?
  if (modules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  //Get module
  var installModule = modules.shift();
  var self = this;

  //Run install
  doInstall.call(this, installModule, function(error) {

    //Module failed to install, display error but continue with next one
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(installModule),
        chalk.red('failed to install:\n' + error.message)
      );
    }

    //Module installed! Go for the next one
    if (modules.length > 0) {
      install.call(self, modules, cb);
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
