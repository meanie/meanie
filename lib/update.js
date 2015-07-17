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
 * Success handler
 */
function success(module, version, manifest, cb) {
  console.log(chalk.green(
    'Module', chalk.magenta(module), 'version',
    chalk.magenta(version), 'updated successfully'
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

/**
 * Update a single meanie module
 */
function doUpdate(module, cb) {
  cb = cb || function() {};

  //Can't update boilerplate unless forced, because it would overwrite too much
  if (module === 'boilerplate') {
    if (!meanie.force) {
      return cb(new Error('Not updating boilerplate module, use --force to update it.'));
    }
    console.warn(chalk.yellow('Force updating boilerplate module'));
  }

  //Log
  console.log(chalk.magenta('Meanie'), 'is updating module', chalk.magenta(module));

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

          //No dependencies?
          if (!manifest.dependencies) {
            return success(module, version, manifest, cb);
          }

          //Install any missing dependencies
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
 * Update meanie modules
 */
function update(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Must have configuration file to install modules
  if (!meanie.project.hasConfig()) {
    return cb(new Error(
      'No Meanie project detected in the current or parent directories.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }

  //Get modules list
  var projectModules = meanie.project.getModules();
  if (Object.keys(projectModules).length === 0) {
    return cb(new Error('There are no Meanie modules installed to update.'));
  }

  //Get modules to update
  var modules = args;
  if (modules && !Array.isArray(modules)) {
    modules = [modules];
  }

  //Nothing specified? Update all modules
  if (modules.length === 0) {
    modules = Object.keys(projectModules);
  }

  //Get module
  var module = modules.shift();
  var self = this;

  //Run install
  doUpdate.call(this, module, function(error) {

    //Module failed to update, continue with next one
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(module),
        chalk.red('failed to update:\n' + error.message)
      );
    }

    //Module updated! Go for the next one
    if (modules.length > 0) {
      update.call(self, modules, cb);
      return;
    }

    //Done updating
    cb(null);
  });
}

/**
 * Module export
 */
module.exports = update;
