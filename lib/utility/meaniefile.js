'use strict';

/**
 * Module dependencies
 */
var jf = require('jsonfile');

/**
 * Meaniefile helper utility
 */
var MeanieFile = {

  /**
   * Get path to config file based on given project directory
   */
  path: function(projectDir) {
    return projectDir + '/meaniefile.json';
  },

  /**
   * Write config file
   */
  write: function(projectDir, config, cb) {
    var configFile = MeanieFile.path(projectDir);
    jf.spaces = 2;
    try {
      jf.writeFileSync(configFile, config);
    }
    catch (e) {
      return cb(e);
    }
    cb(null);
  },

  /**
   * Read config file
   */
  read: function(projectDir) {
    var configFile = MeanieFile.path(projectDir);
    return jf.readFileSync(configFile);
  },

  /**
   * Create config file in given project directory
   */
  create: function(projectDir, pkg, cb) {
    MeanieFile.write(projectDir, {
      version: pkg.version,
      modules: {}
    }, cb);
  },

  /**
   * Add module to config file
   */
  addModule: function(projectDir, module, version) {
    var config = MeanieFile.read(projectDir);
    if (typeof config.modules !== 'object') {
      config.modules = {};
    }
    config.modules[module] = version;
    MeanieFile.write(projectDir, config);
  },

  /**
   * Remove module from config file
   */
  removeModule: function(projectDir, module) {
    var config = MeanieFile.read(projectDir);
    if (config.modules && typeof config.modules[module] !== 'undefined') {
      delete config.modules[module];
    }
    MeanieFile.write(projectDir, config);
  }
};

/**
 * Module export
 */
module.exports = MeanieFile;
