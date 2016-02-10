var DefineRewriter = require('./lib/define-rewriter/src/index');
var merge = require('broccoli-merge-trees');
var removeFile = require('broccoli-file-remover');

module.exports = function(distNode, loaderNode) {
  var node = new DefineRewriter(merge([distNode, loaderNode]));
  return removeFile(node, {
    path: 'loader'
  });
}
