'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');
var os = require('os');
var del = require('del');
var cpr = require('cpr');
var git = require('git-cli');
var chalk = require('chalk');
var tildify = require('tildify');

/*var RegistryClient = require('npm-registry-client');
var client = new RegistryClient();
var uri = "https://registry.npmjs.org/meanie-core";
var params = {timeout: 1000};*/

//client.get(uri, params, function (error, data, raw, res) {
  // error is an error if there was a problem.
  // data is the parsed data object
  // raw is the json string
  // res is the response from couch
//})

/*****************************************************************************
 * Helpers
 ***/

/**
 * Get temporary directory for given module
 */
function getTempDir(module) {

  //Prepare temporary directory
  var tmpDir = os.tmpDir() + 'meanie' + (module ? ('.' + module) : '');
  if (fs.existsSync(tmpDir)) {
    del.sync(tmpDir, {
      force: true
    });
  }

  //Create it
  fs.mkdirSync(tmpDir);
  if (!fs.existsSync(tmpDir)) {
    return '';
  }

  //Return it
  return tmpDir;
}

/**
 * Get repo URL for given module
 * TODO: read from npm registry
 */
function getRepoUrl(module) {
  return 'https://github.com/meanie/meanie-' + module;
}

/**
 * Clone module from repository
 */
function cloneFromRepo(module, cb) {

  //Get temporary directory
  var tmpDir = getTempDir(module);
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
}

/**
 * Copy module to cwd
 */
function copyToCwd(sourceDir, cb) {

  //Get cwd and log
  var cwd = process.cwd();
  console.log(' - Copying to', chalk.grey(tildify(cwd)));

  //Ignored files
  var ignore = ['node_modules', '.git'],
      sourceLength = sourceDir.length;

  //Copy
  cpr(sourceDir, cwd, {
    deleteFirst: false,
    overwrite: false,
    filter: function(file) {
      file = file.substr(sourceLength + 1);
      for (var i = 0; i < ignore.length; i++) {
        if (file.indexOf(ignore[i]) === 0) {
          return false;
        }
      }
      return true;
    }
  }, function(error) {
    if (error) {
      return cb(error);
    }
    cb(null);
  });
}

/**
 * Install several modules in series
 */
function installSeries(modules, cb) {

  //Nothing to do?
  if (!Array.isArray(modules) || modules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  //Get module
  var module = modules.shift();

  //Run install
  Meanie.install(module, function(error) {

    //Module failed to install
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(module),
        chalk.red('failed to install:', error.message)
      );
      return cb(new Error('Some modules failed to install'));
    }

    //Module installed! Go for the next one
    if (modules.length > 0) {
      installSeries(modules, cb);
    }
  });
}

/*****************************************************************************
 * Public API
 ***/

/**
 * Meanie CLI helper
 */
var Meanie = {

  /**
   * Create Meanie project (installs core modules)
   */
  create: function(cb) {
    cb = cb || function() {};

    //Log
    console.log(
      chalk.magenta('Meanie'), 'is creating a new project in',
      chalk.magenta(tildify(process.cwd()))
    );

    //Install core modules
    Meanie.install([
      'core', 'hond'
    ], function(error) {

      //Failure
      if (error) {
        console.error(
          chalk.red('Failed to create project:', error.message)
        );
        return cb(new Error('Failed to create project'));
      }

      //Success
      console.log(chalk.green('Meanie project created successfully'));
      console.log(chalk.grey('Run npm install to install dependencies'));
      cb(null);
    });
  },

  /**
   * Install a meanie module
   */
  install: function(module, cb) {
    cb = cb || function() {};

    //Array of modules given
    if (Array.isArray(module)) {
      return installSeries(module, cb);
    }

    //Log
    console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(module));

    //Clone
    cloneFromRepo(module, function(error, tmpDir) {

      //Failed to clone
      if (error) {
        return cb(error);
      }

      //Copy contents from temp dir to cwd
      copyToCwd(tmpDir, function(error) {

        //Failed to copy
        if (error) {
          return cb(error);
        }

        //Module was installed successfully
        console.log(chalk.green('Module'), chalk.magenta(module), chalk.green('installed'));
        cb(null, module);
      });
    });
  }
};

/**
 * Export module
 */
module.exports = Meanie;
