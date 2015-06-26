'use strict';

/**
 * External dependencies
 */
var npm = require('npm');
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var copyFiles = require('./utility/copyFiles');

/**
 * Get package name based on given module name
 */
function getPackageName(installModule) {
  return 'meanie-' + installModule;
}

/**
 * Get the sources path for given module install path
 */
function getSourcePath(installPath) {
  return installPath + '/src';
}

/**
 * Install a meanie module
 */
function install(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Get self
  var self = this;

  //Must have configuration file to install modules
  if (!this.config.exists()) {
    return cb(new Error(
      'No Meanie project detected in the current directory.',
      'To create a new project in the current directory, use `meanie create ProjectName` first.'
    ));
  }

  //Get modules to install
  var installModule = args;

  //Array of modules given
  if (Array.isArray(installModule)) {
    return installSeries.call(this, installModule, cb);
  }

  //Log and load NPM
  console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(installModule));
  npm.load(function(error, npm) {
    if (error) {
      return cb(error);
    }

    //Get package name
    var meaniePackage = getPackageName(installModule);

    //Install package
    npm.commands.install([meaniePackage], function(error, data) {

      //Failed to install
      if (error) {
        return cb(error);
      }

      //Actual data is first item in the array
      data = data[0];

      //Get install data
      var installVersion = data[0].split('@')[1],
          installPath = data[1];

      //Are there sources to move over?
      //TODO check, and just loop files by hand
      var sourcePath = getSourcePath(installPath);

      //Copy contents from install path to project dir
      copyFiles(sourcePath, self.projectDir, function(error) {

        //Failed to copy
        if (error) {
          return cb(error);
        }

        //Add to config
        self.config.addModule(installModule, installVersion, function(error) {
          if (error) {
            console.warn(chalk.yellow('Could not update meaniefile'));
          }
        });

        //Module was installed successfully
        console.log(chalk.green(
          'Module', chalk.magenta(installModule), 'version',
          chalk.magenta(installVersion), 'installed successfully'
        ));
        cb(null, [installModule, installVersion, installPath]);
      });
    });
  });
}

/**
 * Install several modules in series
 */
function installSeries(installModules, cb) {

  //Nothing to do?
  if (!Array.isArray(installModules) || installModules.length === 0) {
    return cb(new Error('Invalid list of modules given'));
  }

  //Get module
  var installModule = installModules.shift(),
      noInstalled = 0, self = this;

  //Run install
  install.call(this, installModule, function(error) {

    //Module failed to install
    if (error) {
      console.error(
        chalk.red('Module'), chalk.magenta(installModule),
        chalk.red('failed to install:', error.message)
      );
      return cb(new Error('Some modules failed to install'));
    }

    //Module installed! Go for the next one
    noInstalled++;
    if (installModules.length > 0) {
      installSeries.call(self, installModules, cb);
      return;
    }

    //Done installing
    cb(null, noInstalled);
  });
}

/**
 * Module export
 */
module.exports = install;
