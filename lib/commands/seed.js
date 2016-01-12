'use strict';

/**
 * External dependencies
 */
var del = require('del');
var path = require('path');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var tildify = require('tildify');

/**
 * Meanie dependencies
 */
var meanie = require('../meanie');
var checkDirEmpty = require('../utility/check-dir-empty');
var cloneRepo = require('../utility/clone-repo');

/**
 * Get destination
 */
function getDestination(args) {
  return new Promise(function(resolve, reject) {

    //Get destination and check if subfolder argument given
    var destination = meanie.env.cwd;
    if (!args[1]) {
      return resolve(destination);
    }

    //Create subfolder
    destination = path.join(destination, args[1]);
    mkdirp(destination, function(error) {
      if (error) {
        reject(error);
      }
      resolve(destination);
    });
  });
}

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

  //Get destination
  getDestination(args).then(function(destination) {

    //Log
    console.log(
      chalk.magenta('Meanie'), 'is seeding',
      chalk.magenta(moduleName), 'in',
      chalk.magenta(tildify(destination))
    );

    //Check if destination exists and empty
    checkDirEmpty(destination, function(error) {

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
      cloneRepo(repo, destination, function(error) {

        //Check for error
        if (error) {
          return cb(error);
        }

        //Delete the .git directory
        var gitFolder = path.join(destination, '.git');
        del(gitFolder).catch(function() {
          console.warn(chalk.yellow('Could not delete the .git folder after cloning'));
        }).then(function() {
          console.log(chalk.green(
            'Module', chalk.magenta(moduleName), 'seeded successfully'
          ));
          cb(null, [moduleName]);
        });
      });
    });
  }).catch(cb);
}

/**
 * Module export
 */
module.exports = seed;
