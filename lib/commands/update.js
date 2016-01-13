'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var installer = require('../installer');
var npmList = require('../utility/npm-list');
var parseModule = require('../utility/parse-module');
var modulesFromArgs = require('../utility/modules-from-args');

/**
 * Get installed meanie modules
 */
function getInstalledModules() {
  return npmList().then(function(data) {
    var list = [];
    for (var moduleName in data) {
      if (moduleName.indexOf('meanie-') === 0) {
        list.push(moduleName);
      }
    }
    if (list.length === 0) {
      throw new Error('There are no Meanie modules installed');
    }
    return list;
  });
}

/**
 * Filter modules to update
 */
function filterModules(modules, installedModules) {

  //Nothing specified?
  if (modules.length === 0) {
    return Promise.resolve(installedModules.map(parseModule));
  }

  //Filter on installed modules
  modules = modules
    .filter(function(moduleName) {
      return !!installedModules.find(function(installedModule) {
        return (installedModule.name === moduleName);
      });
    });

  //No modules left?
  if (!modules.length) {
    return Promise.reject(new Error('Module(s) not installed'));
  }

  //Return
  return Promise.resolve(modules);
}

/**
 * Update meanie modules
 */
function update(args, cb) {
  cb = cb || function() {};

  //Get modules to update
  var modules = modulesFromArgs(args);

  //Get installed modules
  getInstalledModules()
    .then(filterModules.bind(null, modules))
    .then(function(modules) {

      /**
       * Helper to update modules one by one
       */
      function updateNext() {

        //Done updating
        if (modules.length === 0) {
          return cb(null);
        }

        //Get module names
        var module = modules.shift();

        //Run install
        installer.install(module, function(error) {
          if (error) {
            console.error(
              chalk.red('Module'), chalk.magenta(module.nameShort),
              chalk.red('failed to update:\n' + error.message)
            );
          }
          updateNext();
        });
      }

      //Update now
      updateNext();
    })
    .catch(cb);
}

/**
 * Module export
 */
module.exports = update;
