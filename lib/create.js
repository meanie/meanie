'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var chalk = require('chalk');
var tildify = require('tildify');

/**
 * Meanie dependencies
 */
var coreModules = require('./def/coreModules');

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

    //Update package info (failure is just a warning)
    self.updateProjectPackage(function(error) {
      if (error) {
        console.warn(chalk.yellow(error.message));
      }
    });

    //Update project name in env file
    self.updateEnvFiles(function(error) {
      if (error) {
        console.warn(chalk.yellow(error.message));
      }

      //Project install went ok
      console.log(chalk.green('Meanie project created successfully'));
      console.log(chalk.grey('Run `npm install` to install all the project dependencies now'));
      cb(null);
    });
  });
}

/**
 * Module export
 */
module.exports = create;
