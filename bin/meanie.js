#!/usr/bin/env node
'use strict';

/**
 * Module dependencies
 */
var chalk = require('chalk');
var semver = require('semver');
var Liftoff = require('liftoff');
var tildify = require('tildify');
var v8flags = require('v8flags');
var argv = require('minimist')(process.argv.slice(2));

//Set env var for initial cwd before anything touches it
process.env.INITIAL_CWD = process.cwd();

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

//Launch CLI
cli.launch({}, cliLogic);

/**
 * CLI logic
 */
function cliLogic(env) {

  //Output version
  if (argv.v || argv.version) {
    console.log(
      chalk.magenta('Meanie'), 'global version', chalk.magenta(cliPackage.version)
    );
    if (env.modulePackage && typeof env.modulePackage.version !== 'undefined') {
      console.log(
        chalk.magenta('Meanie'), 'local version', chalk.magenta(env.modulePackage.version)
      );
    }
    process.exit(0);
  }

  //Find local meanie
  if (!env.modulePath) {
    console.log(
      chalk.red('Local meanie not found in'), tildify(env.cwd)
    );
    console.log(chalk.red('Try running: npm install meanie'));
    process.exit(1);
  }

  //Check for version difference between cli and local installation
  if (semver.gt(cliPackage.version, env.modulePackage.version)) {
    console.log(chalk.red('Meanie version mismatch:'));
    console.log(chalk.red('Global version is', cliPackage.version));
    console.log(chalk.red('Local version is', env.modulePackage.version));
  }

  //Chdir if needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log(
      'Working directory changed to', chalk.magenta(tildify(env.cwd))
    );
  }

  //Get meanie instance
  var Meanie = require(env.modulePath);

  //For quick development, override with global meanie
  Meanie = require('../index');

  //Create new Meanie project in current directory
  if (hasParam('create')) {

    //Get destination to install to
    var destination = getParamsAfter('create');

    //Must specify a destination explicitly
    if (destination.length === 0) {
      console.error(chalk.red('Please specify a destination directory, or simply type `meanie create .` to create a project in the current directory.'));
      return;
    }

    //Create project
    process.nextTick(function() {
      Meanie.create(destination[0]);
    });
  }

  //Install Meanie plugins in current directory
  else if (hasParam('install')) {
    var toInstall = getParamsAfter('install');
    process.nextTick(function() {
      Meanie.install(toInstall, process.env.INITIAL_CWD);
    });
  }
}
