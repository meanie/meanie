'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');
var tildify = require('tildify');

/**
 * Meanie dependencies
 */
var meanie = require('../meanie');
var checkDirEmpty = require('../utility/check-dir-empty');
var cloneRepo = require('../utility/clone-repo');

/*****************************************************************************
 * Command function
 ***/

/**
 * Seed a Meanie project
 */
function seed(args, cb) {
  cb = cb || function() {};

  //Get module name and append seed if needed
  var moduleName = args[0];
  if (moduleName.substr(-5) !== '-seed') {
    moduleName += '-seed';
  }

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is seeding',
    chalk.magenta(moduleName), 'in',
    chalk.magenta(tildify(meanie.env.cwd))
  );

  //Check if destination exists and empty
  checkDirEmpty(meanie.env.cwd, function(error) {

    //Check if error
    if (error) {
      if (!meanie.force) {
        return cb(error);
      }
      console.warn(chalk.yellow(
        'Directory is not empty, but force seeding anyway.'
      ));
    }

    //Get repo name
    var repo = meanie.REPO_BASE + moduleName + '.git';
    cloneRepo(repo, meanie.env.cwd, function(error) {
      if (error) {
        return cb(error);
      }
      console.log(chalk.green(
        'Module', chalk.magenta(moduleName), 'seeded successfully'
      ));
      cb(null, [moduleName]);
    });
  });
}

/**
 * Module export
 */
module.exports = seed;
