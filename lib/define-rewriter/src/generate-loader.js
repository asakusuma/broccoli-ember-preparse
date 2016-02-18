var fs = require('fs');
var path = require('path');

/**
 In theory, the internal loader could be generated from the original ember
 loader. For now it's just hardcoded.

 @method generateLoader
 @param {String} loader - The contents of ember's loader file:
                          https://github.com/emberjs/ember.js/blob/master/packages/loader/lib/index.js
 @return {String} - The loader to be used for ember's internals
 */
module.exports = function generateLoader(loader) {
  return fs.readFileSync(path.join(__dirname, '../templates/loader.js'), 'utf8');
};
