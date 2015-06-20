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
 * Create a new Meanie project
 */
function create(args, cb) {
  cb = cb || function() {};

  //Set project dir
  this.setProjectDir(args[0] || '.');

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
        return cb(new Error('Destination directory is not empty!'));
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
      console.error(
        chalk.red('Failed to create project:', error.message)
      );
      return cb(new Error('Failed to create project'));
    }
    console.log(chalk.green('Meanie project created successfully'));
    console.log(chalk.grey('Run `npm install` to install all the dependencies'));
    cb(null);
  });
}

/**
 * Module export
 */
module.exports = create;
