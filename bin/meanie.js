#!/usr/bin/env node

'use strict';
var chalk = require('chalk');
var semver = require('semver');
var Liftoff = require('liftoff');
var tildify = require('tildify');
var v8flags = require('v8flags');
var argv = require('minimist')(process.argv.slice(2));

//Set env var for initial cwd before anything touches it
process.env.INIT_CWD = process.cwd();

//Create cli instance
var cli = new Liftoff({
  name: 'meanie',
  v8flags: v8flags
});

//Exit with 0 or 1
var failed = false;
process.once('exit', function(code) {
  if (code === 0 && failed) {
    process.exit(1);
  }
});

//Parse arguments
var cliPackage = require('../package');
var versionFlag = argv.v || argv.version;

cli.on('require', function(name) {
  console.log('Requiring external module', chalk.magenta(name));
});

cli.on('requireFail', function(name) {
  console.log(chalk.red('Failed to load external module'), chalk.magenta(name));
});

cli.launch({
  cwd: argv.cwd
}, handleArguments);

//The actual logic
function handleArguments(env) {
  if (versionFlag && tasks.length === 0) {
    console.log('CLI version', cliPackage.version);
    if (env.modulePackage && typeof env.modulePackage.version !== 'undefined') {
      console.log('Local version', env.modulePackage.version);
    }
    process.exit(0);
  }

  if (!env.modulePath) {
    console.log(
      chalk.red('Local meanie not found in'),
      chalk.magenta(tildify(env.cwd))
    );
    console.log(chalk.red('Try running: npm install meanie'));
    process.exit(1);
  }

  //Check for semver difference between cli and local installation
  if (semver.gt(cliPackage.version, env.modulePackage.version)) {
    console.log(chalk.red('Warning: meanie version mismatch:'));
    console.log(chalk.red('Global meanie is', cliPackage.version));
    console.log(chalk.red('Local meanie is', env.modulePackage.version));
  }

  //Chdir if needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log(
      'Working directory changed to',
      chalk.magenta(tildify(env.cwd))
    );
  }

  var meanieInst = require(env.modulePath);
  process.nextTick(function() {

  });
}
