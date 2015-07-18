'use strict';

/**
 * Helper to dasherize strings
 */
module.exports = function dasherize(str) {
  if (typeof str === 'number') {
    return String(str);
  }
  else if (typeof str !== 'string') {
    return '';
  }
  if ((str = String(str).trim()) === '') {
    return '';
  }
  return str.replace(/(\s*\-*\b\w|[A-Z]|_[a-z])/g, function($1) {
    $1 = $1.replace('_', '-').trim().toLowerCase();
    return ($1[0] === '-' ? '' : '-') + $1;
  }).slice(1);
};
