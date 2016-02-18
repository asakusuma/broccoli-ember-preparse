var fs = require('fs');
var path = require('path');

module.exports = function(loader) {
  return return fs.readFileSync(path.join(__dirname, '../templates/loader.js'), 'utf8');
}
