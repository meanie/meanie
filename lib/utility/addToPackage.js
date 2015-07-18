'use strict';

/**
 * Module dependencies
 */
var jf = require('jsonfile');
var path = require('path');

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
 * Check if dotted path is valid
 */
function isValidDottedPath(path) {
  return (
    path && path !== 'hasOwnProperty' && /^(\.[a-zA-Z_$@][0-9a-zA-Z_$@]*)+$/.test('.' + path)
  );
}

/**
 * Update project package
 */
module.exports = function addToPackage(file, position, key, value) {

  //Check if only a value given. If so, we expect an array.
  var expectsArray = false;
  if (typeof value === 'undefined') {
    expectsArray = true;
    value = key;
  }

  //No value?
  if (typeof value === 'undefined') {
    throw new Error('No value specified');
  }

  //Check if valid dotted path
  if (!isValidDottedPath(position)) {
    throw new Error('Invalid dotted path:' + position);
  }

  //Read package details
  var pkg;
  try {
    pkg = readPackage(file);
  }
  catch (e) {
    throw new Error('Package file ' + path.basename(file) + ' does not exist or could not be read');
  }

  //Get reference to package key
  var keys = position.split('.');
  var ref = pkg;

  //Traverse object till the key is found or create if needed
  for (var i = 0; i < keys.length && ref !== undefined; i++) {
    var k = keys[i];
    if (ref) {
      if (!ref[k] || typeof ref[k] !== 'object') {
        if ((i + 1) < keys.length) {
          ref[k] = {};
        }
        else {
          ref[k] = expectsArray ? [] : {};
        }
      }
      ref = ref[k];
    }
  }

  //Double check reference type
  if (typeof ref !== 'object') {
    throw new Error('Found ' + typeof ref + ' at ' + position);
  }
  if (expectsArray && !Array.isArray(ref)) {
    throw new Error('Expected an array but found an object at ' + position);
  }
  if (!expectsArray && Array.isArray(ref)) {
    throw new Error('Expected an object but found an array at ' + position);
  }

  //Add entry
  if (expectsArray) {
    ref.push(value);
  }
  else {
    ref[key] = value;
  }

  //Write again
  try {
    writePackage(file, pkg);
  }
  catch (e) {
    throw new Error('Failed to update package file ' + path.basename(file));
  }
};
