'use strict';

/**
 * External dependencies
 */
var fs = require('fs');
var jf = require('jsonfile');
var chalk = require('chalk');
var tildify = require('tildify');
var replace = require('replace-in-file');

/**
 * Meanie dependencies
 */
var copyFiles = require('./utility/copyFiles');

/**
 * Helper to dasherize module names
 */
function dasherize(name) {
	return name.replace(/(\s*\-*\b\w|[A-Z]|_[a-z])/g, function($1) {
    $1 = $1.replace('_', '-').trim().toLowerCase();
    return ($1[0] === '-' ? '' : '-') + $1;
  }).slice(1);
}

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
  return cb(new Error('Directory is not empty!'));
}

/**
 * Seed a new Meanie module
 */
function seed(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Get self and module name
  var self = this;
	var moduleName = args[0];

  //Check if module name and title given
  if (!moduleName) {
    return cb(new Error(
			'Must specify module name as parameter, e.g. `meanie seed module-name`'
		));
  }

	//Dasherize
	moduleName = dasherize(moduleName);

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is seeding module',
		chalk.magenta(moduleName), 'in',
    chalk.magenta(tildify(this.env.cwd))
  );

  //Check if destination exists and empty
  checkDirEmpty(this.env.cwd, function(error) {
    if (error) {
      if (!self.force) {
        return cb(error);
      }
      console.warn(chalk.yellow(
        'Directory is not empty, but force seeding anyway.'
      ));
    }
  });

	//Set seed path
	var seedPath = this.cliPath + '/seed';
	if (!fs.existsSync(seedPath)) {
    return cb(new Error('Module seed directory not found:' + tildify(seedPath)));
  }

	//Copy contents from seed path to project dir
	copyFiles(seedPath, this.env.cwd, function(error) {

		//Failed to copy
		if (error) {
			return cb(error);
		}

		//Remove .gitkeep files
		try {
			fs.unlinkSync(self.env.cwd + '/src/.gitkeep');
			fs.unlinkSync(self.env.cwd + '/test/.gitkeep');
		}
		catch (e) {
			console.warn(chalk.yellow('Could not remove .gitkeep files from `src` and `test` folders.'));
		}

		//Create meanie.json
		try {
			jf.spaces = 2;
	    jf.writeFileSync(self.env.cwd + '/meanie.json', {
				cliVersion: self.pkg.version,
				instructions: 'https://github.com/meanie/' + moduleName + '#usage',
				postInstall: '',
				dependencies: {}
			});
		}
		catch (e) {
			console.warn(chalk.yellow('Could not create meanie.json module manifest.'));
		}

		//Replace module name in files
    replace({
      files: [
        self.env.cwd + '/README.md',
        self.env.cwd + '/package.json'
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
