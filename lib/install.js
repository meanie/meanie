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
var Meanie = require('./meanie');
var MeanieFile = require('./utility/meaniefile');
var cloneRepo = require('./utility/cloneRepo');
var copyFiles = require('./utility/copyFiles');

/**
 * Install a meanie module
 */
function install(module, cb) {
  cb = cb || function() {};

  //Array of modules given
  if (Array.isArray(module)) {
    return installSeries(module, cb);
  }

  //Log
  console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(module));

  //Clone
  cloneFromRepo(module, function(error, tmpDir) {

    //Failed to clone
    if (error) {
      return cb(error);
    }

    //Copy contents from temp dir to project dir
    copyFiles(tmpDir, Meanie.projectDir, function(error) {

      //Failed to copy
      if (error) {
        return cb(error);
      }

      //Add to config
      //TODO module version
      MeanieFile.addModule(projectDir, module, '1.0.0');

      //Module was installed successfully
      console.log(chalk.green('Module'), chalk.magenta(module), chalk.green('installed'));
      cb(null, module);
    });
  });
}

/**
 * Install several modules in series
 */
function installSeries(modules, cb) {

  //Nothing to do?
  if (!Array.isArray(modules) || modules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  //Get module
  var module = modules.shift(),
      noInstalled = 0;

  //Run install
  install(module, function(error) {

    //Module failed to install
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(module),
        chalk.red('failed to install:', error.message)
      );
      return cb(new Error('Some modules failed to install'));
    }

    //Module installed! Go for the next one
    noInstalled++;
    if (modules.length > 0) {
      installSeries(modules, cb);
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
