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

/**
 * Install modules
 */
function install(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Must have configuration file to install modules
  if (!this.project.hasConfig()) {
    return cb(new Error(
      'No Meanie project detected in the current or parent directories.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }

  //Get modules to install
  var modules = args;
  if (modules && !Array.isArray(modules)) {
    modules = [modules];
  }

  //Nothing to do?
  if (modules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  /**
   * Helper to update modules one by one
   */
  function installNext() {

    //Done installing
    if (modules.length === 0) {
      return cb(null);
    }

    //Get module and check if already installed
    var module = modules.shift().replace('meanie-', '');
    if (meanie.project.hasModule(module)) {
      return meanie.commands.update(module, function() {
        installNext();
      });
    }

    //Run install
    console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(module));
    installer.install(module, function(error) {
      if (error) {
        console.error(
          chalk.red('Module'), chalk.magenta(module),
          chalk.red('failed to install:\n' + error.message)
        );
      }
      installNext();
    });
  }

  //Install now
  installNext();
}

/**
 * Module export
 */
module.exports = install;
