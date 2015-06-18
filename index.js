'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');
var os = require('os');
var jf = require('jsonfile');
var npm = require('npm');
var del = require('del');
var cpr = require('cpr');
var path = require('path');
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

/**
 * Read package
 */
var pkg = require('./package.json');

/*****************************************************************************
 * Helpers
 ***/

/**
 * Get path to config file
 */
function getConfigFilePath(projectDir) {
  return projectDir + '/meaniefile.json';
}

/**
 * Initialize config file
 */
function createConfigFile(projectDir) {

  //Get path to file
  var configFile = getConfigFilePath(projectDir);

  //Write config
  jf.spaces = 2;
  jf.writeFileSync(configFile, {
    version: pkg.version,
    modules: []
  });
}

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
 * Copy files helper
 */
function copyFiles(sourceDir, destinationDir, cb) {

  //Log
  destinationDir = path.resolve(destinationDir);
  console.log(' - Copying to', chalk.grey(tildify(destinationDir)));

  //Ignored files
  var ignore = ['node_modules', '.git'],
      sourceLength = sourceDir.length;

  //Copy
  cpr(sourceDir, destinationDir, {
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
function installSeries(modules, projectDir, cb) {

  //Nothing to do?
  if (!Array.isArray(modules) || modules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  //Get module
  var module = modules.shift(),
      noInstalled = 0;

  //Run install
  Meanie.install(module, projectDir, function(error) {

    //Module failed to install
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(module),
        chalk.red('failed to install:', error.message)
      );
      return cb(new Error('Some modules failed to install'));
    }

    //Module installed! Go for the next one
    noInstalled++;
    if (modules.length > 0) {
      installSeries(modules, projectDir, cb);
      return;
    }

    //Done installing
    cb(null, noInstalled);
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
  create: function(projectDir, cb) {
    cb = cb || function() {};

    //Resolve path and log
    projectDir = path.resolve(projectDir);
    console.log(
      chalk.magenta('Meanie'), 'is creating a new project in',
      chalk.magenta(tildify(projectDir))
    );

    //Check if destination exists and has files
    if (fs.existsSync(projectDir)) {
      var files = fs.readdirSync(projectDir);
      if (files.length > 0) {
        console.error(
          chalk.red('Destination directory'),
          chalk.magenta(tildify(projectDir)),
          chalk.red('is not empty!')
        );
        return cb(new Error('Destination directory not empty!'));
      }
    }

    //Create new config file
    createConfigFile(projectDir);

    //Install core modules
    Meanie.install([
      'core'
    ], projectDir, function(error) {

      //Failure
      if (error) {
        console.error(
          chalk.red('Failed to create project:', error.message)
        );
        return cb(new Error('Failed to create project'));
      }

      //Success
      console.log(chalk.green('Meanie project created successfully'));
      console.log(chalk.grey('Run `npm install` to install all the dependencies'));
      cb(null);
    });
  },

  /**
   * Install a meanie module
   */
  install: function(module, projectDir, cb) {
    cb = cb || function() {};

    //Resolve project dir
    projectDir = path.resolve(projectDir);

    //Array of modules given
    if (Array.isArray(module)) {
      return installSeries(module, projectDir, cb);
    }

    //Log
    console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(module));

    //Clone
    cloneFromRepo(module, function(error, tmpDir) {

      //Failed to clone
      if (error) {
        return cb(error);
      }

      //Copy contents from temp dir to project dir
      copyFiles(tmpDir, projectDir, function(error) {

        //Failed to copy
        if (error) {
          return cb(error);
        }

        //Add to config
        Meanie.config.addModule(projectDir, module);

        //Module was installed successfully
        console.log(chalk.green('Module'), chalk.magenta(module), chalk.green('installed'));
        cb(null, module);
      });
    });
  },

  /**
   * Configuration file management tools
   */
  config: {

    /**
     * Add module
     */
    addModule: function(projectDir, module) {

      //Get path to file
      var configFile = getConfigFilePath(projectDir);

      //Read
      var config = jf.readFileSync(configFile);
      if (!Array.isArray(config.modules)) {
        config.modules = [];
      }

      //Add if not there
      if (config.modules.indexOf(module) === -1) {
        config.modules.push(module);
        jf.spaces = 2;
        jf.writeFileSync(configFile, config);
      }
    }
  }
};

/**
 * Export module
 */
module.exports = Meanie;
