'use strict';

/**
 * Helper to parse a module
 */
module.exports = function parseModule(moduleName) {
  if (typeof moduleName === 'object') {
    return moduleName;
  }
  var moduleNameShort = moduleName.replace('meanie-', '');
  return {
    name: 'meanie-' + moduleNameShort,
    nameShort: moduleNameShort
  };
};
