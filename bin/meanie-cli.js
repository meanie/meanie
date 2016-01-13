#!/usr/bin/env node
'use strict';

/**
 * Module dependencies
 */
var chalk = require('chalk');
var tildify = require('tildify');
var Liftoff = require('liftoff');
var v8flags = require('v8flags');

/**
 * Meanie dependencies
 */
var errorHandler = require('../lib/utility/error-handler');
var cliPackage = require('../package');

/**
 * Create cli instance
 */
var cli = new Liftoff({
  name: 'meanie',
  v8flags: v8flags
});

//Event listeners for CLI
cli.on('require', function(name) {
  console.log('Requiring external module', chalk.magenta(name));
});
cli.on('requireFail', function(name) {
  console.error(chalk.red('Failed to load external module', name));
});

/**
 * CLI logic
 */
function run(env) {

  //Append cli package
  env.cliPackage = cliPackage;
  env.cliVersion = cliPackage.version;

  //Change working directory of process if different from current
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log('Working directory changed to', chalk.magenta(tildify(env.cwd)));
  }

  //Load meanie
  var meanie = require('../lib/meanie');

  //Load
  meanie.load(env, function(error, args) {
    if (error) {
      return errorHandler(error);
    }
    process.nextTick(function() {
      meanie.commands[meanie.command](args, errorHandler);
    });
  });
}

/**
 * Launch CLI application
 */
cli.launch({}, run);
