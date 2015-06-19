'use strict';

/**
 * External dependencies
 */
var git = require('git-cli');
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var getTmpDir = require('./getTmpDir');
var getRepoUrl = require('./getRepoUrl');

/**
 * Clone module from repository
 */
module.exports = function cloneFromRepo(module, cb) {

  //Get temporary directory
  var tmpDir = getTmpDir(module);
  if (!tmpDir) {
    return cb(new Error('Could not create temporary directory'));
  }

  //Get repo URL and log
  var repoUrl = getRepoUrl(module);
  console.log(' - Cloning from', chalk.grey(repoUrl));

  //Clone
  git.Repository.clone(repoUrl, tmpDir, function(error, repo) {
    if (error) {
      if (error.message.indexOf('Repository not found') !== -1) {
        return cb(new Error('Repository not found'));
      }
      return cb(error);
    }
    cb(null, tmpDir, repo);
  });
};
