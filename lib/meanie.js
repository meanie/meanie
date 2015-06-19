'use strict';

/**
 * Meanie dependencies
 */
var pkg = require('./package.json');
var cmdList = require('./def/commandList');
var cmdAliases = require('./def/commandAliases');
var errorHandler = require('./utility/errorHandler');

/**
 * Meanie class
 */
var meanie = module.exports = {

  /**
   * Properties
   */
  pkg: pkg,
  projectDir: '',
  commands: {},

  /**
   * Project dir setter
   */
  setProjectDir: function(dir) {
    meanie.projectDir = path.resolve(dir);
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
    meanie.env = env;

    //Set default project dir
    meanie.setProjectDir(env.cwd);
  }
};

/*****************************************************************************
 * Command loading
 ***/

var cmdCache = {};
cmdList.concat(cmdAliases).forEach(function addCommand(cmd) {
  Object.defineProperty(meanie.do, cmd, {
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
    }
  });
});
