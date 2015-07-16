'use strict';

/**
 * External dependencies
 */
var path = require('path');
var chalk = require('chalk');
var jf = require('jsonfile');
var semver = require('semver');

/**
 * Meanie dependencies
 */
var pkg = require('../package');
var cmdList = require('./def/commandList');
var cmdAliases = require('./def/commandAliases');
var errorHandler = require('./utility/errorHandler');

/**
 * Meanie class
 */
var meanie = module.exports = {

  /**
   * Internal properties
   */
  commands: {},
  force: false,
  pkg: pkg,
  cliPath: '',

  /**
   * Determine CLI path
   */
  determineCliPath: function() {
    if (this.env.modulePath) {
      this.cliPath = path.resolve(this.env.modulePath + '/../..');
    }
    else {
      this.cliPath = path.resolve(__dirname + '/..');
    }
  },

  /**
   * Determine project dir
   */
  determineProjectDir: function() {

    //Determine from env
    if (this.env) {
      if (this.env.configBase) {
        return this.project.setDir(this.env.configBase);
      }
      if (this.env.cwd) {
        return this.project.setDir(this.env.cwd);
      }
    }

    //Use process CWD
    var cwd = process.cwd();
    this.project.setDir(cwd);
  },

  /**
   * Command resolver
   */
  resolveCommand: function(cmd) {
    if (cmdAliases[cmd]) {
      cmd = cmdAliases[cmd];
    }
    if (cmdList.indexOf(cmd) !== -1) {
      return cmd;
    }
    return '';
  },

  /**
   * Process args
   */
  processArgs: function() {

    //Determine args
    var argv = process.argv.slice(2);
    var args = [];

    //Filter out modifiers
    for (var i = 0; i < argv.length; i++) {
      if (argv[i].length > 2 && argv[i].substr(0, 2) === '--') {
        if (argv[i] === '--force') {
          this.force = true;
          console.warn(chalk.yellow(
            'Forcing', chalk.magenta('Meanie'), 'with --force flag.',
            'I hope you know what you\'re doing.'
          ));
        }
      }
      else {
        args.push(argv[i]);
      }
    }

    //Return remaining arguments
    return args;
  },

  /**
   * Load
   */
  load: function(env, cb) {

    //Store environment
    this.env = env;

    //Determine project dir
    this.determineProjectDir();
    this.determineCliPath();

    //Process args
    var args = this.processArgs();

    //Command is the first argument
    if (args.length > 0) {
      var command = args.shift();
      if (this.resolveCommand(command)) {
        this.command = command;
      }
      else {
        return cb(new Error('Unknown command:' + command));
      }
    }

    //Callback
    cb(null, args);
  }
};

/**
 * Project data
 */
meanie.project = {

  /**
   * Basic vars
   */
  dir: '',
  name: '',

  /**
   * Set project dir
   */
  setDir: function(dir) {
    this.dir = path.resolve(dir);
  },

  /**
   * Set project name
   */
  setName: function(name) {
    this.name = name;
  },

  /**
   * Get path to config file
   */
  getConfigFilePath: function() {
    return meanie.project.dir + '/meaniefile.json';
  },

  /**
   * Check if config file exists
   */
  hasConfig: function() {
    return !!meanie.env.configPath;
  },

  /**
   * Write config file
   */
  writeConfig: function(config, cb) {
    cb = cb || function() {};
    var configFile = this.getConfigFilePath();
    jf.spaces = 2;
    try {
      jf.writeFileSync(configFile, config);
    }
    catch (e) {
      return cb(e);
    }
    cb(null, [configFile, config]);
  },

  /**
   * Read config file
   */
  readConfig: function() {
    var configFile = this.getConfigFilePath();
    return jf.readFileSync(configFile);
  },

  /**
   * Create config file in given project directory
   */
  createConfig: function(cb) {
    this.writeConfig({
      name: meanie.project.name || '',
      version: meanie.pkg.version,
      modules: {}
    }, function(error, data) {
      if (data) {
        meanie.env.configPath = data[0];
      }
      cb(error, data);
    });
  },

  /**
   * Check if config has a module
   */
  hasModule: function(module, version) {
    var config = this.readConfig();
    if (typeof config.modules !== 'object' || config.modules === null) {
      return false;
    }
    if (!config.modules[module]) {
      return false;
    }
    if (!version || semver.satisfies(config.modules[module], version)) {
      return true;
    }
    return false;
  },

  /**
   * Add module to config file
   */
  addModule: function(module, version, cb) {
    var config = this.readConfig();
    if (typeof config.modules !== 'object' || config.modules === null) {
      config.modules = {};
    }
    config.modules[module] = version;
    this.writeConfig(config, cb);
  },

  /**
   * Remove module from config file
   */
  removeModule: function(module, cb) {
    var config = this.readConfig();
    if (config.modules && typeof config.modules[module] !== 'undefined') {
      delete config.modules[module];
    }
    this.writeConfig(config, cb);
  }
};

/*****************************************************************************
 * Command loading
 ***/

var cmdCache = {};
cmdList.concat(Object.keys(cmdAliases)).forEach(function addCommand(cmd) {
  Object.defineProperty(meanie.commands, cmd, {
    get: function() {

      //Resolve actual command and remember it
      cmd = meanie.command = meanie.resolveCommand(cmd);

      //Check if present in cache
      if (cmdCache[cmd]) {
        return cmdCache[cmd];
      }

      //Load command function
      var cmdFunction = require(__dirname + '/' + cmd);

      //Save in cache
      cmdCache[cmd] = function() {

        //Get arguments and make sure there's a callback given
        var args = Array.prototype.slice.call(arguments, 0);
        if (typeof args[args.length - 1] !== 'function') {
          args.push(errorHandler);
        }

        //Call command function with given arguments
        cmdFunction.apply(meanie, args);
      };

      //Map keys
      Object.keys(cmdFunction).forEach(function(key) {
        cmdCache[cmd][key] = cmd[key];
      });

      //Return
      return cmdCache[cmd];
    }
  });
});
