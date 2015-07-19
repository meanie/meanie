'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var tildify = require('tildify');
var replace = require('replace-in-file');

/**
 * Meanie dependencies
 */
var meanie = require('../meanie');
var copyFiles = require('../utility/copyFiles');
var dasherize = require('../utility/dasherize');
var checkDirEmpty = require('../utility/checkDirEmpty');

/*****************************************************************************
 * Command function
 ***/

/**
 * Seed a new Meanie module
 */
function seed(args, cb) {
  cb = cb || function() {};

  //Get module name
  var moduleName = dasherize(args[0] || path.basename(meanie.env.cwd));

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is seeding module',
    chalk.magenta(moduleName), 'in',
    chalk.magenta(tildify(meanie.env.cwd))
  );

  //Check if destination exists and empty (disallow meanie file)
  checkDirEmpty(meanie.env.cwd, false, function(error) {
    if (error) {
      if (!meanie.force) {
        return cb(error);
      }
      console.warn(chalk.yellow(
        'Directory is not empty, but force seeding anyway.'
      ));
    }
  });

  //Set seed path
  var seedPath = meanie.cliPath + '/seed';
  if (!fs.existsSync(seedPath)) {
    return cb(new Error('Module seed directory not found:' + tildify(seedPath)));
  }

  //Copy contents from seed path to project dir
  copyFiles(seedPath, meanie.env.cwd, function(error) {

    //Failed to copy
    if (error) {
      return cb(error);
    }

    //Remove .gitkeep files
    try {
      fs.unlinkSync(meanie.env.cwd + '/src/.gitkeep');
      fs.unlinkSync(meanie.env.cwd + '/tests/.gitkeep');
    }
    catch (e) {
      console.warn(chalk.yellow('Could not remove .gitkeep files from `src` and `test` folders.'));
    }

    //Replace module name in files
    replace({
      files: [
        meanie.env.cwd + '/README.md',
        meanie.env.cwd + '/package.json',
        meanie.env.cwd + '/bower.json',
        meanie.env.cwd + '/index.js'
      ],
      replace: /xxxxx/g,
      with: moduleName
    }, function(error) {
      if (error) {
        console.warn(chalk.yellow('Could not replace module name in files.'));
      }

      //Module was seeded successfully
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
