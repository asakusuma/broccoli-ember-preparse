var babylon = require('babylon');
var traverse = require('babel-traverse').default;
var ModuleGraph = require('./module_graph');
var fs = require('fs');
var path = require('path');
var generateLoader = require('./generate-loader');

function generateProcessEmber(string, relativePath, eagerLoadList) {
  return function processEmber(loader) {

    var ast = babylon.parse(string);

    var blockStatementPath;
    var first = -1;
    var count =  0;
    var graph = new ModuleGraph();

    var visitor = {
      CallExpression: function(path) {
        var callExpression = path.node;
        if (callExpression.callee.name !== 'enifed' ||
            callExpression.arguments.length !== 3 ||
            callExpression.arguments[0].type !== 'StringLiteral' ||
            callExpression.arguments[1].type !== 'ArrayExpression' ||
            callExpression.arguments[2].type !== 'FunctionExpression') {
          return;
        }
        var statementPath = path.parentPath;
        if (blockStatementPath === undefined) {
          blockStatementPath = statementPath.parentPath;
        } else {
          if (blockStatementPath !== statementPath.parentPath) {
            throw new Error('defines expected to be in the same block');
          }
        }
        if (first === -1) {
          first = statementPath.key;
        } else {
          if ((first+count) !== statementPath.key) {
            throw new Error('define statements expected to be contiguous '+(first+count)+' '+statementPath.key);
          }
        }

        count++;
        graph.add(callExpression);
      }
    };

    traverse(ast, visitor);

    graph.buildEdges();

    graph.createEdge('ember-metal/core',  'ember-metal/debug');

    if (relativePath.indexOf('ember.debug.js') > -1) {
      graph.createEdge('ember-metal', 'ember-debug');
    }

    eagerLoadList.forEach(graph.makeEager, graph);

    var lines = string.split(/\n/);
    function getLines(loc) {
      var start = loc.start.line-1;
      var end = loc.end.line;
      var src = lines.slice(start, end);
      if (loc.start.line === loc.end.line) {
        src[0] = src[0].slice(loc.start.column, loc.end.column);
      } else {
        src[0] = src[0].slice(loc.start.column);
        src[src.length-1] = src[src.length-1].slice(0, loc.end.column);
      }
      return src;
    }

    var buffer = [string.match(/\/\*![\s\S]+?\*\//)[0]];
    buffer.push('if (typeof Ember === \'undefined\') { Em = Ember = {}; }');
    buffer.push('Em.__global = this');
    buffer.push('Em._eager = ' + JSON.stringify(graph.eagerSet.names) + ';');
    buffer.push(generateLoader(loader));

    function pushLines(lines) {
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        line = line.replace(/mainContext/g, 'Em.__global');
        line = line.replace(/\s(require|requireModule)\(/g, 'Em.__loader.require.default(');
        buffer.push(line);
      }
    }

    graph.set.names.forEach(function (name) {
      var module = graph.node(name);
      if (!graph.eagerSet.has(name)) {
        var src = getLines(module.functionExpression.loc);
        src[0] = 'Em.__loader.define(' + JSON.stringify(name) + ', ' + JSON.stringify(module.deps) + ', ' + src[0];
        src[src.length - 1] += ');';
        pushLines(src);
      }
    });
    graph.eagerSet.names.forEach(function (name) {
      var module = graph.node(name);
      if (!module) {
        return;
      }
      var src = getLines(module.functionExpression.loc);
      src[0] = '('+ src[0];
      src[src.length - 1] += ')('+ module.deps.map(function (dep) {
        if (dep === 'require') {
          return 'Em.__loader.require';
        }
        var index = graph.eagerSet.map[dep === 'exports' ? name : dep];
        return 'Em._e['+index+']';
      }).join(',')+');';

      pushLines(src);
    });

    return buffer.join('\n');
  }
}

module.exports = function(string, relativePath, eagerLoadList, loaderPromise) {
  return loaderPromise.then(generateProcessEmber(string, relativePath, eagerLoadList));
}
