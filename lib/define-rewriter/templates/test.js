var falafel = require('falafel');
var fs = require('fs');
var path = require('path');
var babylon = require('babylon');
var unparse = require('escodegen').generate;

//var ext = fs.readFileSync(path.join(__dirname, 'loader-ext.js'), 'utf8');
var test = fs.readFileSync(path.join(__dirname, 'debug.js'), 'utf8');

/*
function forEachNode(node, visit) {
  if (node && typeof node === 'object') {
    var result = visit(node);
    if (!result) {
      var keys = Object.keys(node);
      for (var i=0; i < keys.length; i++) {
        forEachNode(node[keys[i]], visit);
      }
    }
  }
}


var root = babylon.parse(test);

forEachNode(root, function(node) {
  if (node.type && node.type === 'ExpressionStatement') {
    console.log(unparse(node));
    return true;
  }
});
*/

function findParent(node, cb, limit) {
  limit = typeof limit === 'number' ? limit : 999;
  if (node.parent && limit > 0) {
    if (cb(node.parent)) {
      return node.parent;
    } else {
      return findParent(node.parent, cb, limit - 1);
    }
  }
}

function findDepth(node) {
  if (!node) {
    return 0;
  }
  return findDepth(node.parent) + 1;
}

var nodes = [];

falafel(test, function (node) {
  if (node.type === 'ExpressionStatement' &&
    node.expression &&
    node.expression.callee &&
    node.expression.callee.type === 'FunctionExpression' &&
    findDepth(node) < 4
  ) {
    console.log(node);
  }
});

/*
falafel(loader, function (node) {
  if (node.type === 'VariableDeclarator' && node.id && node.id.name === 'seen') {
    node.parent.update(node.parent.source() + '\n' + ext);
  }
});
*/
