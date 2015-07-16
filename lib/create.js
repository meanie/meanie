'use strict';

/**
 * External dependencies
 */
var fs = require('fs-extra');
var chalk = require('chalk');
var tildify = require('tildify');
var replace = require('replace-in-file');

/**
 * Meanie dependencies
 */
var meanie = require('./meanie');
var dasherize = require('./utility/dasherize');
var coreModules = require('./def/coreModules');
var updatePackage = require('./utility/updatePackage');
var checkDirEmpty = require('./utility/checkDirEmpty');

/**
 * Helper to create .gitignore
 */
function createGitIgnore(dir, cb) {
  fs.copy(dir + '/.npmignore', dir + '/.gitignore', cb);
}

/**
 * Update packages
 */
function updatePackages(data, cb) {
  var packages = ['package.json', 'bower.json'];
  var failures = [];
  for (var p = 0; p < packages.length; p++) {
    try {
      updatePackage(meanie.project.dir + '/' + packages[p], data);
    }
    catch (error) {
      failures.push(packages[p]);
    }
  }
  if (failures.length) {
    return cb(new Error('Could not update package files: ' + failures.join(', ')));
  }
  cb(null);
}

/**
 * Update environment files
 */
function updateEnvFiles(cb) {

  //Must have project name
  if (!meanie.project.name) {
    return cb(null);
  }

  //Replace in files
  replace({
    files: [
      meanie.project.dir + '/env/all.js',
      meanie.project.dir + '/env/development.js'
    ],
    replace: /My\sApplication/g,
    with: meanie.project.name
  }, function(error) {
    if (error) {
      return cb(new Error('Could not replace project name in environment files.'));
    }
    cb(null);
  });
}

/**
 * Success handler
 */
function success(cb) {
  console.log(chalk.green('Meanie project created successfully'));
  console.log(chalk.grey('Run `npm install` to install all the project dependencies now'));
  cb(null);
}

/*****************************************************************************
 * Command function
 ***/

/**
 * Create a new Meanie project
 */
function create(args, cb) {
  cb = cb || function() {};

  //Check if project name given
  if (args[0]) {
    meanie.project.setName(args[0]);
  }

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is creating a new project in',
    chalk.magenta(tildify(meanie.project.dir))
  );

  //Check if destination exists and empty (allow meaniefile presence)
  checkDirEmpty(meanie.project.dir, true, function(error) {
    if (error) {
      if (!meanie.force) {
        return cb(error);
      }
      console.warn(chalk.yellow(
        'Destination directory is not empty, but force installing anyway.'
      ));
    }
  });

  //Create new meaniefile
  console.log(chalk.magenta('Meanie'), 'is creating a meaniefile');
  meanie.project.createConfig(function(error) {
    if (error) {
      return console.warn(chalk.yellow('Failed to create meaniefile!'));
    }
    console.log(chalk.green('Created meaniefile'));
  });

  //Install core modules
  meanie.commands.install(coreModules, function(error) {
    if (error) {
      console.error(chalk.red('Failed to create project:', error.message));
      return cb(new Error('Failed to create project'));
    }

    //Copy .npmignore file to .gitignore since it is excluded
    createGitIgnore(meanie.project.dir, function(error) {
      if (error) {
        console.warn(chalk.yellow(error.message));
      }
    });

    //Project name not given? Done
    if (meanie.project.name) {
      return success(cb);
    }

    //Update package info (failure is just a warning)
    updatePackages({
      name: dasherize(meanie.project.name)
    }, function(error) {
      if (error) {
        console.warn(chalk.yellow(error.message));
      }
    });

    //Update env files
    updateEnvFiles(function(error) {
      if (error) {
        console.warn(chalk.yellow(error.message));
      }

      //Project install went ok
      success(cb);
    });
  });
}

/**
 * Module export
 */
module.exports = create;
