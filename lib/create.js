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
var coreModules = require('./def/coreModules');
var updatePackage = require('./utility/updatePackage');

/**
 * Helper to check if destination directory is empty (meaniefile allowed)
 */
function checkDirEmpty(dir, cb) {

  //Check if directory exists
  if (!fs.existsSync(dir)) {
    return cb(null);
  }

  //Read files. If none found or only meanie file found, we can continue
  var files = fs.readdirSync(dir);
  if (files.length === 0 || (files.length === 1 && files[0].indexOf('meaniefile') === 0)) {
    return cb(null);
  }

  //Directory not empty
  return cb(new Error('Destination directory is not empty!'));
}

/**
 * Helper to create .gitignore
 */
function createGitIgnore(dir, cb) {
  fs.copy(dir + '/.npmignore', dir + '/.gitignore', cb);
}

/**
 * Update packages
 */
function updatePackages(projectDir, data, cb) {

  //Packages to update
  var packages = ['package.json', 'bower.json'];

  //Loop and update
  for (var p = 0; p < packages.length; p++) {
    try {
      updatePackage(projectDir + '/' + packages[p], data);
    }
    catch (error) {
      return cb(error);
    }
  }
}

/**
 * Update ENV files
 */
function updateEnvFiles(projectDir, projectName, cb) {

  //Must have project name and dir
  if (!projectName || !projectDir) {
    return cb(null);
  }

  //Replace in files
  replace({
    files: [
      projectDir + '/env/all.js',
      projectDir + '/env/development.js'
    ],
    replace: /My\sApplication/g,
    with: projectName
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

/**
 * Create a new Meanie project
 */
function create(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Get self
  var self = this;

  //Check if project name given
  if (args[0]) {
    this.setProjectName(args[0]);
  }

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is creating a new project in',
    chalk.magenta(tildify(this.projectDir))
  );

  //Check if destination exists and empty
  checkDirEmpty(this.projectDir, function(error) {
    if (error) {
      if (!self.force) {
        return cb(error);
      }
      console.warn(chalk.yellow(
        'Destination directory is not empty, but force installing anyway.'
      ));
    }
  });

  //Create new meaniefile
  console.log(chalk.magenta('Meanie'), 'is creating a meaniefile');
  this.config.create(function(error) {
    if (error) {
      return console.warn(chalk.yellow('Failed to create meaniefile!'));
    }
    console.log(chalk.green('Created meaniefile'));
  });

  //Install core modules
  this.commands.install(coreModules, function(error) {
    if (error) {
      console.error(chalk.red('Failed to create project:', error.message));
      return cb(new Error('Failed to create project'));
    }

    //Copy .npmignore file to .gitignore since it is excluded
    createGitIgnore(self.projectDir, function(error) {
      if (error) {
        console.warn(chalk.yellow(error.message));
      }
    });

    //Project name not given? Done
    if (self.projectName) {
      return success(cb);
    }

    //Update package info (failure is just a warning)
    updatePackages(self.projectDir, {
      name: self.projectName.toLowerCase().replace(/\s/g, '-')
    }, function(error) {
      if (error) {
        console.warn(chalk.yellow(error.message));
      }
    });

    //Update project name in env file
    updateEnvFiles(self.projectDir, self.projectName, function(error) {
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
