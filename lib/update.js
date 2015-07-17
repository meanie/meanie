'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');
var tildify = require('tildify');

/**
 * Meanie dependencies
 */
var meanie = require('./meanie');

/*****************************************************************************
 * Command function
 ***/

/**
 * Update meanie modules
 */
function update(args, cb) {
  cb = cb || function() {};

  //Must have configuration file to install modules
  if (!meanie.project.hasConfig()) {
    return cb(new Error(
      'No Meanie project detected in the current or parent directories.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }


}

/**
 * Module export
 */
module.exports = update;
