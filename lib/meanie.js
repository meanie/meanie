'use strict';

/**
 * External dependencies
 */
var path = require('path');
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var pkg = require('../package.json');
var cmdList = require('./def/command-list');
var cmdAliases = require('./def/command-aliases');
var errorHandler = require('./utility/error-handler');

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
   * Constants
   */
  REPO_BASE: 'https://github.com/meanie/',

  /**
   * Internal properties
   */
  force: false,
  pkg: pkg,
  env: null,
  commands: {},

  /**
   * Load
   */
  load: function(env, cb) {

    //Set vars
    this.env = env;
    this.projectDir = determineProjectDir(this);

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
