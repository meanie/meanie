'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var meanie = require('../meanie');
var installer = require('../installer');
var coreModules = require('../def/coreModules');

/**
 * Update meanie modules
 */
function update(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Must have configuration file to install modules
  if (!meanie.project.hasConfig()) {
    return cb(new Error(
      'No Meanie project detected in the current or parent directories.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }

  //Get modules list
  var projectModules = meanie.project.getModules();
  if (Object.keys(projectModules).length === 0) {
    return cb(new Error('There are no Meanie modules installed.'));
  }

  //Get modules to update
  var modules = args;
  if (modules && !Array.isArray(modules)) {
    modules = [modules];
  }

  //Nothing specified? Update all modules
  if (modules.length === 0) {
    modules = Object.keys(projectModules).filter(function(module) {
      return coreModules.indexOf(module) === -1;
    });
  }

  /**
   * Helper to update modules one by one
   */
  function updateNext() {

    //Done updating
    if (modules.length === 0) {
      return cb(null);
    }

    //Get module and log
    var module = modules.shift();
    console.log(chalk.magenta('Meanie'), 'is updating module', chalk.magenta(module));

    //Check if part of core
    if (coreModules.indexOf(module) > -1) {
      if (!meanie.force) {
        console.log(chalk.yellow(
          'Not updating core module as it would possibly overwrite modified files.\n' +
          'Use --force if you really want to update it.'
        ));
        return updateNext();
      }
      console.warn(chalk.yellow('Force updating core module.'));
    }

    //Run updater
    installer.update(module, function(error) {
      if (error) {
        console.error(
          chalk.red('Module'), chalk.magenta(module),
          chalk.red('failed to update:\n' + error.message)
        );
      }
      updateNext();
    });
  }

  //Update now
  updateNext();
}

/**
 * Module export
 */
module.exports = update;
