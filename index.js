var DefineRewriter = require('./lib/define-rewriter/src/index');

module.exports = function(node) {
  return new DefineRewriter(node);
}
