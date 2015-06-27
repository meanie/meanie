'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var chalk = require('chalk');
var tildify = require('tildify');

/**
 * Meanie dependencies
 */
var copyFiles = require('./utility/copyFiles');

/**
 * Helper to check if destination directory is empty
 */
function checkDirEmpty(dir, cb) {

  //Check if directory exists
  if (!fs.existsSync(dir)) {
    return cb(null);
  }

  //Read files. If none found, we can continue
  var files = fs.readdirSync(dir);
  if (files.length === 0) {
    return cb(null);
  }

  //Directory not empty
  return cb(new Error('Destination directory is not empty!'));
}

/**
 * Seed a new Meanie module
 */
function seed(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Get self
  var self = this;

  //Check if module name and title given
  if (args.length < 2) {
    return cb(new Error(
			'Must specify module name and title as parameters, e.g.:\n' +
			'meanie seed module-name "Module Title"'
		));
  }

	//Get module name and title
	var moduleName = args[0];
	var moduleTitle = args[1];

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is seeding module',
		chalk.magenta(moduleTitle),
		'(' + chalk.magenta(moduleName) + ')',
		'in',
    chalk.magenta(tildify(this.env.cwd))
  );

  //Check if destination exists and empty
  checkDirEmpty(this.env.cwd, function(error) {
    if (error) {
      if (!self.force) {
        return cb(error);
      }
      console.warn(chalk.yellow(
        'Destination directory is not empty, but force seeding anyway.'
      ));
    }
  });

	//Set seed path
	var seedPath = this.env.modulePath + '/seed';
	if (!fs.existsSync(seedPath)) {
    return cb(new Error('Module seed directory not found:' + tildify(seedPath)));
  }

	//Copy contents from seed path to project dir
	copyFiles(seedPath, this.env.cwd, function(error) {

		//Failed to copy
		if (error) {
			return cb(error);
		}

		//Module was seeded successfully
		console.log(chalk.green(
			'Module', chalk.magenta(moduleName), 'seeded successfully'
		));
		cb(null, [moduleName, moduleTitle]);
	});
}

/**
 * Module export
 */
module.exports = seed;
