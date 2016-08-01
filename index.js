var DefineRewriter = require('./lib/define-rewriter/src/index');
var merge = require('broccoli-merge-trees');
var removeFile = require('broccoli-file-remover');

module.exports = function(distNode, loaderNode, options) {
  var input = merge([distNode, loaderNode])
  var node = new DefineRewriter(input, options);
  return removeFile(node, {
    path: 'loader'
  });
}

module.exports.DefineRewriter = DefineRewriter;
