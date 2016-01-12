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
var filesCount = require('../utility/files-count');
var npmInstall = require('../utility/npm-install');
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

/**
 * Log the seed command
 */
function logSeedCommand(moduleName, destination) {
  console.log(
    chalk.magenta('Meanie'), 'is seeding',
    chalk.magenta(moduleName), 'in',
    chalk.magenta(tildify(destination))
  );
  return destination;
}

/**
 * Check if directory empty
 */
function checkDirEmpty(destination) {
  return filesCount(destination).then(function(count) {
    if (count > 0) {
      if (!meanie.force) {
        throw new Error('Directory is not empty!');
      }
      console.warn(chalk.yellow(
        'Directory is not empty, but force seeding anyway.'
      ));
    }
    return destination;
  });
}

/**
 * Remove git folder
 */
function removeGitFolder(destination) {
  var gitFolder = path.join(destination, '.git');
  return del(gitFolder).then(function() {
    return destination;
  }).catch(function() {
    console.warn(chalk.yellow('Could not delete the .git folder after cloning'));
    return destination;
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

  //Determine repo name
  var repo = meanie.REPO_BASE + moduleName + '.git';

  //Get destination
  getDestination(args)
    .then(logSeedCommand.bind(null, moduleName))
    .then(checkDirEmpty)
    .then(cloneRepo.bind(null, repo))
    .then(removeGitFolder)
    .then(npmInstall)
    .then(function(destination) {
      console.log(chalk.green(
        'Meanie seeded', chalk.magenta(moduleName), 'successfully in',
        chalk.magenta(tildify(destination))
      ));
      cb(null, [moduleName]);
    })
    .catch(cb);
}

/**
 * Module export
 */
module.exports = seed;
