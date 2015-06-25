'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var chalk = require('chalk');
var tildify = require('tildify');
var replaceInFile = require('replace-in-file');

/**
 * Meanie dependencies
 */
var coreModules = require('./def/coreModules');

/**
 * Create a new Meanie project
 */
function create(args, cb) {
  cb = cb || function() {};

  //Get self
  var meanie = this;

  //Check if project name given
  if (args[0]) {
    this.setProjectName(args[0]);
  }

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is creating a new project in',
    chalk.magenta(tildify(this.projectDir))
  );

  //Check if destination exists and has files
  if (fs.existsSync(this.projectDir)) {
    var files = fs.readdirSync(this.projectDir);
    if (files.length > 0) {
      if (files.length > 1 || files[0].indexOf('meaniefile') === -1) {
        if (this.force) {
          console.warn(chalk.yellow(
            'Destination directory is not empty, but force installing anyway.'
          ));
        }
        else {
          return cb(new Error('Destination directory is not empty!'));
        }
      }
    }
  }

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

    //Update package info
    meanie.readProjectPackage();
    if (meanie.projectName) {
      meanie.projectPackage.name = meanie.projectName.toLowerCase().replace(/\s/g, '-');
    }

    //Write again
    meanie.writeProjectPackage(function(error, data) {
      if (error) {
        return console.warn(chalk.yellow('Failed to update project package file!'));
      }
    });

    //Try to replace application name in env file
    if (meanie.projectName && meanie.projectDir) {
      replaceInFile([
        meanie.projectDir + '/env/all.js',
        meanie.projectDir + '/env/development.js'
      ], /My\sApplication/g, meanie.projectName, function(error) {
        if (error) {
          console.warn(chalk.yellow('Could not replace project name in env files'));
        }
        console.log(chalk.green('Meanie project created successfully'));
        console.log(chalk.grey('Run `npm install` to install all the project dependencies now'));
        cb(null);
      });
    }
  });
}

/**
 * Module export
 */
module.exports = create;
