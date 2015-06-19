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
var meanieFile = require('./utility/meanieFile');
var coreModules = require('./def/coreModules');

/**
 * Create a new Meanie project
 */
function create(args, cb) {
  cb = cb || function() {};

  //Get self and destination to install to
  var self = this,
      destination = args[0];

  //Must specify a destination explicitly
  if (!destination) {
    return cb(new Error('Please specify a destination directory, or use `meanie create .` to create a project in the current directory.'));
  }

  //Set project dir
  this.setProjectDir(destination);

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
  meanieFile.create(this.projectDir, this.pkg, function(error, configPath) {
    if (error) {
      return console.warn(chalk.yellow('Failed to create meaniefile!'));
    }
    console.log(chalk.green('Created meaniefile'));
    self.env.configPath = configPath;
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
