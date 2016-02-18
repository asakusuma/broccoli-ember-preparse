var falafel = require('falafel');
var fs = require('fs');
var path = require('path');
var babylon = require('babylon');

function findDepth(node) {
  if (!node) {
    return 0;
  }
  return findDepth(node.parent) + 1;
}

// Given Ember's runtime loader, modify to support the define-rewriter
module.exports = function(loader) {
  var dynamic = false;

  if (dynamic) {
    var ext = fs.readFileSync(path.join(__dirname, '../templates/loader-ext.js'), 'utf8');

    var loaderDef = null;

    falafel(loader, function (node) {
      if (!loaderDef &&
        node.type === 'ExpressionStatement' &&
        node.expression &&
        node.expression.callee &&
        node.expression.callee.type === 'FunctionExpression' &&
        findDepth(node) < 3
      ) {
        loaderDef = node.source();
      }
    });

    return falafel(loaderDef, function (node) {
      if (node.type === 'VariableDeclarator' && node.id && node.id.name === 'seen') {
        node.parent.update(node.parent.source() + '\n' + ext);
      }
    });
  } else {
    console.log('Static loader');
    return fs.readFileSync(path.join(__dirname, '../templates/loader.js'), 'utf8');
  }
}



/*
Notes:

Modify ember loader without setting global require.

Kill:
requirejs = require = requireModule = function(name) {
      return internalRequire(name, null);
    }





*/
