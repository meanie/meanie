'use strict';

/**
 * Helper to dasherize strings
 */
module.exports = function dasherize(str) {
	return str.replace(/(\s*\-*\b\w|[A-Z]|_[a-z])/g, function($1) {
    $1 = $1.replace('_', '-').trim().toLowerCase();
    return ($1[0] === '-' ? '' : '-') + $1;
  }).slice(1);
};
