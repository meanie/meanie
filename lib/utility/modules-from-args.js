'use strict';

/**
 * Dependencies
 */
var parseModule = require('./parse-module');

/**
 * Get modules from args
 */
module.exports = function modulesFromArgs(args) {
  var modules = Array.isArray(args) ? args : [args];
  return modules.map(parseModule);
};
