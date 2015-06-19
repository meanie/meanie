'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var tildify = require('tildify');

/**
 * Meanie dependencies
 */
var Meanie = require('./meanie');
var MeanieFile = require('./utility/meaniefile');
var coreModules = require('./def/coreModules');

/**
 * Create a new Meanie project
 */
function create(projectDir, cb) {
  cb = cb || function() {};

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is creating a new project in',
    chalk.magenta(tildify(Meanie.projectDir))
  );

  //Check if destination exists and has files
  if (fs.existsSync(Meanie.projectDir)) {
    var files = fs.readdirSync(Meanie.projectDir);
    if (files.length > 0) {
      return cb(new Error('Destination directory is not empty!'));
    }
  }

  //Create new meaniefile
  console.log(chalk.magenta('Meanie'), 'is creating a meaniefile');
  MeanieFile.create(Meanie.projectDir, Meanie.pkg, function(error) {
    if (error) {
      return console.warn(chalk.yellow('Failed to create meaniefile!'));
    }
    console.log(chalk.green('Created meaniefile'));
  });

  //Install core modules
  Meanie.commands.install(coreModules, function(error) {
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
