'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var jf = require('jsonfile');

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

  /**
   * Project properties
   */
  projectPackage: null,
  projectDir: '',
  projectName: '',

  /**
   * Determine project dir
   */
  determineProjectDir: function() {

    //Determine from env
    if (this.env) {
      if (this.env.configBase) {
        return this.setProjectDir(this.env.configBase);
      }
      if (this.env.cwd) {
        return this.setProjectDir(this.env.cwd);
      }
    }

    //Use process CWD
    var cwd = process.cwd();
    this.setProjectDir(cwd);
  },

  /**
   * Set project dir
   */
  setProjectDir: function(dir) {
    this.projectDir = path.resolve(dir);
  },

  /**
   * Set project name
   */
  setProjectName: function(name) {
    this.projectName = name;
  },

  /**
   * Read project package
   */
  readProjectPackage: function() {
    if (this.projectDir) {
      try {
        var projectPackage = fs.readFileSync(this.projectDir + '/package.json', 'utf8');
        if (projectPackage) {
          return this.projectPackage = JSON.parse(projectPackage);
        }
      }
      catch(e) {
        return null;
      }
    }
    return null;
  },

  /**
   * Write project package
   */
  writeProjectPackage: function(cb) {
    cb = cb || function() {};

    //Must have project dir and package data
    if (!this.projectDir || !this.projectPackage) {
      return cb(new Error('No project dir or no project package data'));
    }

    //Determine package file
    var packageFile = this.projectDir + '/package.json';

    //Write contents
    jf.spaces = 2;
    try {
      jf.writeFileSync(packageFile, this.projectPackage);
    }
    catch (e) {
      return cb(e);
    }
    cb(null, [packageFile, this.projectPackage]);
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
   * Load
   */
  load: function(env, argv, cb) {

    //Store environment
    this.env = env;

    //Determine project dir and read project package
    this.determineProjectDir();
    this.readProjectPackage();

    //Force flag
    if (argv.force) {
      this.force = true;
      console.warn(chalk.yellow(
        'Forcing', chalk.magenta('Meanie'), 'with --force flag.',
        'I hope you know what you\'re doing.'
      ));
    }

    //Determine command
    if (argv.v || argv.version) {
      this.command = 'version';
    }
    else if (this.resolveCommand(argv._[0])) {
      this.command = argv._.shift();
    }
    else {
      return cb(new Error('Unknown command:' + argv._[0]));
    }

    //Callback
    cb(null);
  },

  /**
   * Meanie config handling helpers
   */
  config: {

    /**
     * Get path to config file
     */
    filePath: function() {
      return meanie.projectDir + '/meaniefile.json';
    },

    /**
     * Check if config file exists
     */
    exists: function() {
      return !!meanie.env.configPath;
    },

    /**
     * Write config file
     */
    write: function(config, cb) {
      cb = cb || function() {};
      var configFile = this.filePath();
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
    read: function() {
      var configFile = this.filePath();
      return jf.readFileSync(configFile);
    },

    /**
     * Create config file in given project directory
     */
    create: function(cb) {
      this.write({
        name: meanie.projectName || '',
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
     * Add module to config file
     */
    addModule: function(module, version, cb) {
      var config = this.read();
      if (typeof config.modules !== 'object') {
        config.modules = {};
      }
      config.modules[module] = version;
      this.write(config, cb);
    },

    /**
     * Remove module from config file
     */
    removeModule: function(module, cb) {
      var config = this.read(projectDir);
      if (config.modules && typeof config.modules[module] !== 'undefined') {
        delete config.modules[module];
      }
      this.write(config, cb);
    }
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
