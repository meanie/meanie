#!/usr/bin/env node
'use strict';

/**
 * Module dependencies
 */
var chalk = require('chalk');
var semver = require('semver');
var tildify = require('tildify');
var Liftoff = require('liftoff');
var v8flags = require('v8flags');
var argv = require('minimist')(process.argv.slice(2));

/**
 * Helper to check if we have a param in the arguments list
 */
function hasParam(command) {
  if (argv._.indexOf(command) !== -1) {
    return true;
  }
  return false;
}

/**
 * Helper to get parameters after command
 */
function getParamsAfter(command) {
  var indexOf = argv._.indexOf(command);
  if (indexOf === -1) {
    return [];
  }
  return argv._.slice(indexOf+1);
}

//Create cli instance
var cliPackage = require('../package');
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

//Launch CLI application
cli.launch({
  cwd: argv.cwd,
  configPath: argv.meanfile
}, cliLogic);

/**
 * CLI logic
 */
function cliLogic(env) {

  //Change working directory of process if needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log(
      'Working directory changed to', chalk.magenta(tildify(env.cwd))
    );
  }

  //Output version
  if (argv.v || argv.version) {
    console.log(
      chalk.magenta('Meanie'), 'CLI version', chalk.magenta(cliPackage.version)
    );
    if (env.modulePackage && typeof env.modulePackage.version !== 'undefined') {
      console.log(
        chalk.magenta('Meanie'), 'local version', chalk.magenta(env.modulePackage.version)
      );
    }
    process.exit(0);
  }

  //Initialize meanie instance var
  var Meanie;

  //Check if local version present
  if (env.modulePath) {

    //Log and check for version difference between cli and local installation
    console.log(chalk.yellow('Local meanie found at'), chalk.magenta(tildify(env.modulePath)));
    if (env.modulePackage && typeof env.modulePackage.version !== 'undefined') {
      if (semver.gt(cliPackage.version, env.modulePackage.version)) {
        console.log(chalk.yellow('Warning: Meanie version mismatch'));
        console.log(chalk.yellow('CLI version is', cliPackage.version));
        console.log(chalk.yellow('Local version is', env.modulePackage.version));
      }
    }
    m
    //Use local meanie package
    Meanie = require(env.modulePath);
  }

  //No local meanie, use CLI bundled package
  else {
    Meanie = require('../index');
  }

  //Loop available commands
  for (var command in MeanieCLI) {
    if (MeanieCLI.hasOwnProperty(command)) {
      if (hasParam(command)) {
        MeanieCLI[command].call(this, Meanie, env);
      }
    }
  }
}

/**
 * Meanie CLI class
 */
var MeanieCLI = {

  /**
   * Create new Meanie project
   */
  create: function(Meanie, env) {

    //Get destination to install to
    var destination = getParamsAfter('create');

    //Must specify a destination explicitly
    if (destination.length === 0) {
      console.error(
        chalk.red('Please specify a destination directory, or use `meanie create .` to create a project in the current directory.')
      );
      process.exit(1);
    }

    //Create project
    process.nextTick(function() {
      Meanie.create(destination[0]);
    });
  },

  /**
   * Install a Meanie module
   */
  install: function(Meanie, env) {

    //Must have configuration file to install modules
    if (!env.configPath) {
      console.error(
        chalk.red('No Meanie project detected in the current directory. To create a new project in the current directory, use `meanie create .`')
      );
      process.exit(1);
    }

    //Get modules to install
    var toInstall = getParamsAfter('install');

    //Install the modules
    process.nextTick(function() {
      Meanie.install(toInstall, env.cwd);
    });
  }
};
