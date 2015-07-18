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
 * Read module manifest
 */
function readManifest(modulePath, packageName, cb) {

  //Get path and check if exists
  var manifestPath = path.resolve(modulePath + '/meanie.json');
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

  //Determine source and destination
  if (manifest.packageType === 'vendor') {
    manifest.source = modulePath;
    manifest.destination = path.join(meanie.project.dir, getVendorDir(packageName));
  }
  else {
    manifest.source = path.join(modulePath, 'src');
    manifest.destination = path.join(meanie.project.dir, manifest.destination || '');
  }

  //Return manifest
  cb(null, manifest);
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

      //Get required version and check if we have it
      var requiredVersion = manifest.dependencies[dependency];
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

    //Check version
    npm.commands.view([packageName], true, function(error, data) {
      if (error) {
        return cb(error);
      }

      //Get latest version and check with our version if we're trying to update
      if (isUpdate) {
        var latestVersion = Object.keys(data).shift();
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
        var version = data[0].split('@')[1];
        var modulePath = data[1];

        //Read meanie.json module manifest
        readManifest(modulePath, packageName, function(error, manifest) {
          if (error) {
            return cb(error);
          }

          //Validate CLI version
          if (manifest.cliVersion) {
            if (semver.satisfies(meanie.env.cliVersion, manifest.cliVersion)) {
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

          //Copy files
          copyFiles(manifest.source, manifest.destination, function(error) {

            //Failed to copy
            if (error) {
              return cb(error);
            }

            //Add to meaniefile
            try {
              meanie.project.addModule(module, version);
            }
            catch (e) {
              console.warn(chalk.yellow('Could not update meaniefile'));
            }

            //Add to assets and bower dependencies if vendor type package
            if (manifest.packageType === 'vendor') {
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
                addBowerDep(packageName, version);
              }
              catch (e) {
                console.warn(chalk.yellow(
                  'Could not add module to Bower dependencies. Add it manually',
                  'if needed: "' + packageName + '": "^' + version + '"'
                ));
              }
            }

            //No dependencies or update operation?
            if (!manifest.dependencies || isUpdate) {
              return success(module, version, manifest, isUpdate, cb);
            }

            //Install dependencies
            installDependencies(manifest, function(error) {
              if (error) {
                return cb(error);
              }

              //Success
              success(module, version, manifest, isUpdate, cb);
            });
          });
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
