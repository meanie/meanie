
/**
 * Module dependencies
 */
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
 * Get temporary directory for given module
 * TODO: read from npm registry
 */
module.exports = function getRepoUrl(module) {
  return 'https://github.com/meanie/meanie-' + module;
};
