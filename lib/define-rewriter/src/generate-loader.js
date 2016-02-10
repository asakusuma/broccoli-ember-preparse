var falafel = require('falafel');
var fs = require('fs');
var path = require('path');

// Given Ember's runtime loader, modify to support the define-rewriter
module.exports = function(loader) {
  var ext = fs.readFileSync(path.join(__dirname, '../templates/loader-ext.js'), 'utf8');

  return falafel(loader, function (node) {
    if (node.type === 'VariableDeclarator' && node.id && node.id.name === 'seen') {
      node.parent.update(node.parent.source() + '\n' + ext);
    }
  });
}
