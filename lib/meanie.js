'use strict';

/**
 * External dependencies
 */
var path = require('path');
var chalk = require('chalk');
var jf = require('jsonfile');

/**
 * Meanie dependencies
 */
var pkg = require('../package');
var cmdList = require('./def/commandList');
var cmdAliases = require('./def/commandAliases');
var addToPackage = require('./utility/addToPackage');
var errorHandler = require('./utility/errorHandler');

/**
 * Determine project dir
 */
function determineProjectDir(meanie) {

  //Determine from env
  if (meanie.env) {
    if (meanie.env.configBase) {
      return path.resolve(meanie.env.configBase);
    }
    if (meanie.env.cwd) {
      return path.resolve(meanie.env.cwd);
    }
  }

  //Use process CWD
  var cwd = process.cwd();
  return path.resolve(cwd);
}

/**
 * Determine CLI path
 */
function determineCliPath(meanie) {
  if (meanie.env.modulePath) {
    return path.resolve(meanie.env.modulePath + '/../..');
  }
  else {
    return path.resolve(__dirname + '/..');
  }
}

/**
 * Command resolver
 */
function resolveCommand(cmd) {
  if (cmdAliases[cmd]) {
    cmd = cmdAliases[cmd];
  }
  if (cmdList.indexOf(cmd) !== -1) {
    return cmd;
  }
  return '';
}

/**
 * Process args
 */
function processArgs(meanie) {

  //Determine args
  var argv = process.argv.slice(2);
  var args = [];

  //Filter out modifiers
  for (var i = 0; i < argv.length; i++) {
    if (argv[i].length > 2 && argv[i].substr(0, 2) === '--') {
      if (argv[i] === '--force') {
        meanie.force = true;
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
}

/**
 * Meanie class
 */
var meanie = module.exports = {

  /**
   * Internal properties
   */
  force: false,
  pkg: pkg,
  env: null,
  cliPath: '',
  commands: {},

  /**
   * Load
   */
  load: function(env, cb) {

    //Store environment
    this.env = env;

    //Determine project dir and CLI path
    this.project.dir = determineProjectDir(this);
    this.cliPath = determineCliPath(this);

    //Process args
    var args = processArgs(this);

    //Command is the first argument
    if (args.length > 0) {
      var command = args.shift();
      if (resolveCommand(command)) {
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

/*****************************************************************************
 * Project data handling
 ***/

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
   * Read config file
   */
  readConfig: function() {
    var configFile = this.getConfigFilePath();
    var config;
    try {
      config = jf.readFileSync(configFile);
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid meaniefile');
      }
    }
    catch (e) {
      throw new Error('Could not read meaniefile');
    }
    return config;
  },

  /**
   * Write config file
   */
  writeConfig: function(config) {
    var configFile = this.getConfigFilePath();
    jf.spaces = 2;
    try {
      jf.writeFileSync(configFile, config);
    }
    catch (e) {
      throw new Error('Could not write to meaniefile');
    }
    return configFile;
  },

  /**
   * Create config file in given project directory
   */
  createConfig: function() {
    var configFile = this.writeConfig({
      cliVersion: meanie.pkg.version,
      modules: {}
    });
    meanie.env.configPath = configFile;
  },

  /**
   * Get all installed modules
   */
  getModules: function() {
    var config = this.readConfig();
    if (typeof config.modules !== 'object' || config.modules === null) {
      return {};
    }
    return config.modules;
  },

  /**
   * Check if config has a module, returns the version if true
   */
  hasModule: function(module) {
    var modules = this.getModules();
    if (!modules || modules[module]) {
      return false;
    }
    return modules[module];
  },

  /**
   * Add module to config file
   */
  addModule: function(module, version) {
    var config = this.readConfig();
    if (typeof config.modules !== 'object' || config.modules === null) {
      config.modules = {};
    }
    config.modules[module] = version;
    this.writeConfig(config);
  },

  /**
   * Remove module from config file
   */
  removeModule: function(module) {
    var config = this.readConfig();
    if (config.modules && typeof config.modules[module] !== 'undefined') {
      delete config.modules[module];
    }
    this.writeConfig(config);
  },

  /**
   * Get path to assets file
   */
  getAssetsFilePath: function() {
    return meanie.project.dir + '/assets.json';
  },

  /**
   * Read assets
   */
  readAssets: function() {
    var assetsFile = this.getAssetsFilePath();
    var assets;
    try {
      assets = jf.readFileSync(assetsFile);
      if (!assets || typeof assets !== 'object') {
        throw new Error('Invalid assets file');
      }
    }
    catch (e) {
      throw new Error('Could not read assets file');
    }
    return assets;
  },

  /**
   * Write assets
   */
  writeAssets: function(assets) {
    var assetsFile = this.getAssetsFilePath();
    jf.spaces = 2;
    try {
      jf.writeFileSync(assetsFile, assets);
    }
    catch (e) {
      throw new Error('Could not write to meaniefile');
    }
    return assetsFile;
  },

  /**
   * Add entry to assets
   */
  addToAssets: function(position, assetFile) {
    var file = this.getAssetsFilePath();
    addToPackage(file, position, assetFile);
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
      cmd = meanie.command = resolveCommand(cmd);

      //Check if present in cache
      if (cmdCache[cmd]) {
        return cmdCache[cmd];
      }

      //Load command function
      var cmdFunction = require(__dirname + '/commands/' + cmd);

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
