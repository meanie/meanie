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
var addToPackage = require('./utility/addToPackage');

/*****************************************************************************
 * Helpers
 ***/

/**
 * Get npm package name based on given module name
 */
function getPackageName(module) {
  return 'meanie-' + module;
}

/**
 * Get vendor dir for a given package (relative)
 */
function getVendorDir(packageName, withFile) {
  return 'client/vendor/' + packageName + (withFile ? ('/release/' + packageName + '.js') : '');
}

/**
 * Add Bower dependency
 */
function addBowerDep(packageName, version) {
  var file = path.join(meanie.project.dir, 'bower.json');
  addToPackage(file, 'dependencies', packageName, '^' + version);
}

/**
 * Determine package type
 */
function determinePackageType(pkg, packagePath) {
  if (pkg.packageType) {
    return pkg.packageType;
  }
  var bowerPath = packagePath + '/bower.json';
  if (fs.existsSync(bowerPath)) {
    return 'front-end';
  }
  return 'full-stack';
}

/**
 * Determine package dependencies
 */
function determinePackageDependencies(packagePath) {
  var bowerPath = packagePath + '/bower.json';
  if (fs.existsSync(bowerPath)) {
    var bower = jf.readFileSync(bowerPath);
    return bower.dependencies || null;
  }
  return null;
}

/**
 * Success handler
 */
function success(module, version, manifest, isUpdate, cb) {
  console.log(chalk.green(
    'Module', chalk.magenta(module), 'version',
    chalk.magenta(version), isUpdate ? 'updated' : 'installed', 'successfully'
  ));
  if (manifest.instructions) {
    console.log(chalk.grey(
      'Usage instructions: ', chalk.cyan(manifest.instructions)
    ));
  }
  if (manifest.postInstall) {
    console.log(chalk.grey(manifest.postInstall));
  }
  cb(null, [module, version, manifest]);
}

/*****************************************************************************
 * Installers
 ***/

/**
 * Install dependencies
 */
function installDependencies(packageDependencies, cb) {

  //Get number of dependencies
  var toInstall = [];

  //Go over the dependencies
  for (var dependency in packageDependencies) {
    if (packageDependencies.hasOwnProperty(dependency)) {

      //For now, only care about installing meanie dependencies
      if (dependency.indexOf('meanie-') !== 0) {
        continue;
      }

      //Get required version and check if we have it
      var requiredVersion = packageDependencies[dependency];
      var hasModuleVersion = meanie.project.hasModule(dependency) || '0.0.0';
      if (semver.satisfies(hasModuleVersion, requiredVersion)) {
        continue;
      }

      //Add to install list
      toInstall.push(dependency);
      console.log(
        'Module requires', chalk.magenta(dependency),
        'version', chalk.magenta(requiredVersion)
      );
    }
  }

  //Install all the dependencies now
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
 * Install or update a meanie module
 */
function install(module, isUpdate, cb) {
  cb = cb || function() {};

  //Load NPM
  npm.load(function(error, npm) {
    if (error) {
      return cb(error);
    }

    //Get package name
    var packageName = getPackageName(module);

    //Check version and get package info
    npm.commands.view([packageName], true, function(error, data) {
      if (error) {
        return cb(error);
      }

      //Get latest version and package info
      var latestVersion = Object.keys(data).shift();
      var packageInfo = data[latestVersion];

      //Check with our version if we're trying to update
      if (isUpdate) {
        var existingVersion = meanie.project.hasModule(module) || '0.0.0';
        if (semver.gte(existingVersion, latestVersion)) {
          console.log(chalk.green(
            'Module', chalk.magenta(module), 'version',
            chalk.magenta(existingVersion), 'already up to date'
          ));
          return cb(null, true);
        }
      }

      //Install package using npm
      npm.commands.install([packageName], function(error, data) {
        if (error) {
          return cb(error);
        }

        //Actual data is first item in the array
        data = data[0];
        var packageVersion = data[0].split('@')[1];
        var packagePath = data[1];
        var packageType = determinePackageType(packageInfo, packagePath);
        var packageDependencies = determinePackageDependencies(packagePath);

        //Determine source and destination
        var source, destination;
        if (packageType === 'front-end') {
          source = packagePath;
          destination = path.join(meanie.project.dir, getVendorDir(packageName));
        }
        else {
          source = path.join(packagePath, 'src');
          destination = meanie.project.dir;
        }

        //Copy files
        copyFiles(source, destination, function(error) {

          //Failed to copy
          if (error) {
            return cb(error);
          }

          //Add to meaniefile
          try {
            meanie.project.addModule(module, packageVersion);
          }
          catch (e) {
            console.warn(chalk.yellow('Could not update meaniefile'));
          }

          //Add to assets and bower dependencies if vendor type package
          if (packageType === 'front-end') {
            var assetFile = getVendorDir(packageName, true);

            //Add to meanie file
            try {
              meanie.project.addToAssets('client.js.vendor', assetFile);
            }
            catch (e) {
              console.warn(chalk.yellow(
                'Could not add module to assets file. Add it manually to the',
                '`client.js.vendor` array: "' + assetFile + '"'
              ));
            }

            //Add to bower.json
            try {
              addBowerDep(packageName, packageVersion);
              console.log(chalk.grey('Added as a dependency to bower.json'));
            }
            catch (e) {
              console.warn(chalk.yellow(
                'Could not add module to Bower dependencies. Add it manually',
                'if needed: "' + packageName + '": "^' + packageVersion + '"'
              ));
            }

            //No dependencies or update operation?
            if (!isUpdate && packageDependencies) {
              return installDependencies(packageDependencies, function(error) {
                if (error) {
                  return cb(error);
                }
                success(module, packageVersion, packageInfo, isUpdate, cb);
              });
            }
          }

          //Success
          success(module, packageVersion, packageInfo, isUpdate, cb);
        });
      });
    });
  });
}

/*****************************************************************************
 * Installer interface
 ***/

/**
 * Module export
 */
module.exports = {
  install: function(module, cb) {
    install(module, false, cb);
  },
  update: function(module, cb) {
    install(module, true, cb);
  }
};
