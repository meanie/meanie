'use strict';

/**
 * External dependencies
 */
var npm = require('npm');
var chalk = require('chalk');
var semver = require('semver');

/**
 * Meanie dependencies
 */
var meanie = require('./meanie');

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
 * Success handler
 */
function success(module, version, isUpdate, cb) {
  console.log(chalk.green(
    'Module', chalk.magenta(module), 'version',
    chalk.magenta(version), isUpdate ? 'updated' : 'installed', 'successfully'
  ));
  cb(null, [module, version]);
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
      var hasModuleVersion = hasModule(dependency) || '0.0.0';
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
  npm.load({
    //loglevel: 'silent'
  }, function(error, npm) {
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
        console.log(
          'Latest version of', chalk.magenta(module), 'is', chalk.magenta(latestVersion)
        );
        var existingVersion = hasModule(module) || '0.0.0';
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

        //Actual data of installed module is last item in the array
        var packageData = data.pop();
        var packageVersion = packageData[0].split('@')[1];
        var packagePath = packageData[1];
        var packageDependencies = determinePackageDependencies(packagePath);

        //No dependencies or update operation?
        if (!isUpdate && packageDependencies) {
          return installDependencies(packageDependencies, function(error) {
            if (error) {
              return cb(error);
            }
            success(module, packageVersion, packageInfo, isUpdate, cb);
          });
        }
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
