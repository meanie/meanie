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
var dasherize = require('./utility/dasherize');

/**
 * Get environment file contents
 */
function environmentFileContents(envName) {
  return '' +
    '\'use strict\';+\n\n' +
    '/**\n' +
    ' * Environment configuration (' + envName + ')\n' +
    ' */\n' +
    'module.exports = {\n' +
    '  //Your configuration here\n' +
    '};\n';
}

/**
 * Generate a new environment file
 */
function env(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Must have configuration file to install modules
  if (!this.config.exists()) {
    return cb(new Error(
      'No Meanie project detected in the current or parent directories.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }

  //Get self and environment name (defaults to local)
  var self = this;
	var envName = dasherize(args[0] || 'local');
  var envPath = this.projectDir + '/env/' + envName + '.js';

  //Log
  console.log(
    chalk.magenta('Meanie'), 'is creating environment configuration file',
		chalk.magenta(envName), 'in',
    chalk.magenta(tildify(envPath))
  );

  //Check if file already exists
  if (fs.existsSync(envPath)) {
    if (!self.force) {
      return cb(new Error('File already exists. Use `--force` if you want to overwrite.'));
    }
    console.warn(chalk.yellow(
      'File already exists, but force overwriting anyway.'
    ));
  }

  //Open file for writing
  fs.open(envPath, 'w', function(error, fd) {
    if (error) {
      return cb(error);
    }

    //Get contents and write to file
    var envContents = environmentFileContents(envName);
    fs.write(fd, envContents, function(error) {
      if (error) {
        return cb(error);
      }

      //Success
      console.log(chalk.green(
				'Environment file', chalk.magenta(envName + '.js'), 'created successfully'
			));
      cb(null);
    });
  });
}

/**
 * Module export
 */
module.exports = env;
