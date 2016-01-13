'use strict';

/**
 * External dependencies
 */
var npm = require('npm');
var path = require('path');
var chalk = require('chalk');
var semver = require('semver');

/**
 * Meanie dependencies
 */
var meanie = require('./meanie');
var npmList = require('./utility/npm-list');
var parseModule = require('./utility/parse-module');

/*****************************************************************************
 * Helpers
 ***/

/**
 * Check if installed, appends the module version
 */
function checkIfInstalled(module) {
  return npmList(module.name).then(function(data) {
    if (data && data.version) {
      module.version = data.version;
      return true;
    }
    return false;
  });
}

/**
 * Check if a dependency needs install
 */
function needsInstall(module, requiredVersion) {
  return checkIfInstalled(module).then(function(isInstalled) {

    //Get required version and check if we have it
    if (isInstalled) {
      if (semver.satisfies(module.version, requiredVersion)) {
        return null;
      }
    }

    //Needs install
    module.requiredVersion = requiredVersion;
    return module;
  });
}

/**
 * Determine package dependencies
 */
function determinePackageDependencies(packagePath) {
  var cfgPath = path.join(packagePath, 'package.json');
  var cfg = require(cfgPath);
  return cfg.peerDependencies || null;
}

/**
 * Success handler
 */
function success(module, version, wasUpdate, cb) {
  console.log(chalk.green(
    'Module', chalk.magenta(module.nameShort), 'version',
    chalk.magenta(version), wasUpdate ? 'updated' : 'installed', 'successfully'
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

  //Initialie promises
  var promises = [];

  //Go over the dependencies
  for (var dependency in packageDependencies) {
    if (dependency.indexOf('meanie-') === 0) {

      //Parse module
      var requiredVersion = packageDependencies[dependency];
      var module = parseModule(dependency);

      //Add promise
      promises.push(needsInstall(module, requiredVersion));
    }
  }

  //No promises?
  if (!promises.length) {
    return cb(null);
  }

  //Resolve all promises
  Promise.all(promises).then(function(modules) {

    //Filter modules and log
    modules = modules.filter(function(module) {
      return !!module;
    }).map(function(module) {
      console.log(
        'Module requires', chalk.magenta(module.nameShort),
        'version', chalk.magenta(module.requiredVersion)
      );
      return module;
    });

    //Nothing to do?
    if (!modules.length) {
      return cb(null);
    }

    //Install now
    meanie.commands.install(modules, function(error) {
      if (error) {
        return cb(new Error('Failed to install dependencies'));
      }
      cb(null);
    });
  });
}

/**
 * Install or update a meanie module
 */
function install(module, cb) {
  cb = cb || function() {};

  //Check if installed
  checkIfInstalled(module)
    .then(function(isUpdate) {

      //Log
      console.log(
        chalk.magenta('Meanie'), 'is',
        isUpdate ? 'updating' : 'installing',
        'module', chalk.magenta(module.nameShort)
      );

      //Load NPM
      npm.load({
        loglevel: 'silent',
        save: true
      }, function(error, npm) {
        if (error) {
          return cb(error);
        }

        //Check online version and get package info
        npm.commands.view([module.name], true, function(error, data) {
          if (error) {
            return cb(error);
          }

          //Get latest version and package info
          var latestVersion = Object.keys(data).shift();

          //Check with our version
          if (module.version) {
            console.log(
              'Latest version of', chalk.magenta(module.nameShort),
              'is', chalk.magenta(latestVersion)
            );
            if (semver.gte(module.version, latestVersion)) {
              console.log(chalk.green(
                'Module', chalk.magenta(module.nameShort), 'version',
                chalk.magenta(module.version), 'already up to date'
              ));
              return cb(null, true);
            }
          }

          //Install package using npm
          npm.commands.install([module.name], function(error, data) {

            //Error?
            if (error) {
              return cb(error);
            }

            //Actual data of installed module is last item in the array
            var packageData = data.pop();
            var packageVersion = packageData[0].split('@')[1];
            var packagePath = packageData[1];
            var packageDependencies = determinePackageDependencies(packagePath);

            //Check if we need to install package dependencies
            if (!isUpdate && packageDependencies) {
              return installDependencies(packageDependencies, function(error) {
                if (error) {
                  return cb(error);
                }
                success(module, packageVersion, isUpdate, cb);
              });
            }

            //Done
            success(module, packageVersion, isUpdate, cb);
          });
        });
      });
    }).catch(cb);
}

/*****************************************************************************
 * Installer interface
 ***/

/**
 * Module export
 */
module.exports = {
  install: function(module, cb) {
    install(module, cb);
  }
};
