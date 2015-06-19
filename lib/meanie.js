'use strict';

/**
 * Meanie dependencies
 */
var pkg = require('./package.json');
var cmdList = require('./def/commandList');
var cmdAliases = require('./def/commandAliases');

/**
 * Meanie class
 */
var Meanie = module.exports = {

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
    Meanie.projectDir = path.resolve(dir);
  },

  /**
   * Command resolver
   */
  resolveCommand: function(cmd) {
    if (cmdAliases[cmd]) {
      cmd = cmdAliases[cmd];
    }
    return cmd;
  }
};

/*****************************************************************************
 * Command loading
 ***/

//Add commands to meanie
var cmdCache = {};
cmdList.concat(cmdAliases).forEach(function addCommand(cmd) {
  Object.defineProperty(Meanie.do, cmd, {
    get: function() {

      //Resolve actual command and remember it
      cmd = Meanie.command = Meanie.resolveCommand(cmd);

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
          args.push(defaultCb)
        }

        //Call command function with given arguments
        cmdFunction.apply(Meanie, args);
      };
    }
  });
});

/*****************************************************************************
 * Helpers
 ***/

/**
 * Default callback
 */
function defaultCb(error, data) {
  if (error) {
    console.error(error.message);
  }
}
