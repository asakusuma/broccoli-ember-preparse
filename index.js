var DefineRewriter = require('./lib/define-rewriter/src/index');

module.exports = function(input, options) {
  return new DefineRewriter(input, options);
}

module.exports.DefineRewriter = DefineRewriter;
