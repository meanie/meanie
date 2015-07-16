'use strict';

/**
 * Module dependencies
 */
var jf = require('jsonfile');

/**
 * Read project package
 */
function readPackage(file) {
  return jf.readFileSync(file);
}

/**
 * Write project package
 */
function writePackage(file, pkg) {
  jf.spaces = 2;
  jf.writeFileSync(file, pkg);
}

/**
 * Update project package
 */
module.exports = function updatePackage(file, data) {

  //Read package details
  var pkg;
  try {
    pkg = readPackage();
  }
  catch (e) {
    throw new Error('Package file does not exist or could not be read.');
  }

  //Merge data
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      pkg[key] = data[key];
    }
  }

  //Write again
  try {
    writePackage(pkg);
  }
  catch (e) {
    throw new Error('Failed to update package file.');
  }
};
