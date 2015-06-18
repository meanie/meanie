'use strict';

/**
 * Module dependencies
 */
var chalk = require('chalk');

/**
 * Constructor
 */
function Meanie() {

}

/**
 * Install a meanie plugin
 */
Meanie.prototype.install = function(plugin) {

  //Array of plugins given
  if (Array.isArray(plugin)) {
    plugin.forEach(function(plugin) {
      this.install(plugin);
    }.bind(this));
    return;
  }

  //Log
  console.log(
    'Installing plugin',
    chalk.magenta(plugin)
  );
};

/**
 * Return new Meanie instance
 */
module.exports = new Meanie();
