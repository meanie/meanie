'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var npm = require('npm');
var path = require('path');
var chalk = require('chalk');
var tildify = require('tildify');

/**
 * Meanie dependencies
 */
var meanieFile = require('./utility/meanieFile');
var cloneRepo = require('./utility/cloneRepo');
var copyFiles = require('./utility/copyFiles');

/**
 * Install a meanie module
 */
function install(argv, cb) {
  cb = cb || function() {};

  //Get self
  var self = this;

  //Must have configuration file to install modules
  if (!this.env.configPath) {
    return cb(new Error('No Meanie project detected in the current directory. To create a new project in the current directory, use `meanie create .`'))
  }

  //Get modules to install
  var meanieModule = argv;//TODO

  //Array of modules given
  if (Array.isArray(meanieModule)) {
    return installSeries(meanieModule, cb);
  }

  //Log
  console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(meanieModule));

  //Clone
  cloneFromRepo(meanieModule, function(error, tmpDir) {

    //Failed to clone
    if (error) {
      return cb(error);
    }

    //Copy contents from temp dir to project dir
    copyFiles(tmpDir, self.projectDir, function(error) {

      //Failed to copy
      if (error) {
        return cb(error);
      }

      //Add to config
      //TODO module version
      meanieFile.addModule(self.projectDir, meanieModule, '1.0.0');

      //Module was installed successfully
      console.log(
        chalk.green('Module'), chalk.magenta(meanieModule), chalk.green('installed')
      );
      cb(null, meanieModule);
    });
  });
}

/**
 * Install several modules in series
 */
function installSeries(meanieModules, cb) {

  //Nothing to do?
  if (!Array.isArray(meanieModules) || meanieModules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  //Get module
  var meanieModule = modules.shift(),
      noInstalled = 0;

  //Run install
  install(meanieModule, function(error) {

    //Module failed to install
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(meanieModule),
        chalk.red('failed to install:', error.message)
      );
      return cb(new Error('Some modules failed to install'));
    }

    //Module installed! Go for the next one
    noInstalled++;
    if (meanieModules.length > 0) {
      installSeries(meanieModules, cb);
      return;
    }

    //Done installing
    cb(null, noInstalled);
  });
}

/**
 * Module export
 */
module.exports = install;
