var graphlib = require('graphlib');
var amdNameResolver = require('amd-name-resolver');
var NameSet = require('./name_set');
var ModuleNode = require('./module_node');

function ModuleGraph() {
  this.graph = new graphlib.Graph();
  this.set = new NameSet();
  this.eagerSet = new NameSet();
}

ModuleGraph.prototype.buildEdges = function normalize() {
  var nodes = this.graph.nodes();
  nodes.forEach(function(nodeLabel) {
    var node = this.graph.node(nodeLabel);
    node.deps.forEach(function(dep) {
      var newDepName = dep;
      var depNode = this.graph.node(dep);
      if (!depNode) {
        var depIndex = dep + '/index';
        var depIndexNode = this.graph.node(depIndex);
        if (depIndexNode) {
          // Found a module that actually exists at /index
          newDepName = depIndex;
        } else if (newDepName === 'exports') {
          newDepName = null;
        }
      }

      if (newDepName) {
        if (newDepName !== dep) {
          //We've renamed a moduleID and need to rename any depedency references
          for (var i = 0; i < node.deps.length; i++) {
            if (node.deps[i] === dep) {
              node.deps[i] = newDepName;
            }
          }
        }
        this.graph.setEdge(nodeLabel, newDepName);
      }
    }, this);
  }, this);
}

ModuleGraph.prototype.createEdge = function createEdge(v, w) {
  var vn = this.graph.node(v);
  var wn = this.graph.node(w);
  if (!vn) {
    v = v + '/index';
  }
  if (!wn) {
    w = w + '/index';
  }

  this.graph.setEdge(v, w);
}

ModuleGraph.prototype.add = function add(defineCallExpression) {
  var arguments = defineCallExpression.arguments;
  var exportsIndex;
  var name = arguments[0].value;
  var deps = arguments[1];
  var functionExpression = arguments[2];

  if (/\.umd$/.test(name)) {
    console.log('removing unused: '+name);
    return;
  }

  if (!functionExpression.body.body.length) {
    console.log('removing empty module: '+name);
    return;
  }

  var parentParts = name.split('/');

  var deps = deps.elements.map(function (literal, i) {
    var dep = literal.value;
    if (dep === 'exports') {
      exportsIndex = i;
    } else {
      var parts = dep.split('/');
      if (dep.indexOf('..') === 0 && parentParts.length === 1 && parts[1] !== parentParts[0]) {
        dep = dep.replace('../', '');
      }
      dep = amdNameResolver(dep, name);
    }
    return dep;
  }, this);

  var node = new ModuleNode(name, deps, functionExpression);

  this.graph.setNode(name, node);
  this.set.add(name);
};

ModuleGraph.prototype.node = function node(name) {
  return this.graph.node(name);
}

ModuleGraph.prototype.first = function first() {
  return this.graph.node(this.set.names[0]);
}

ModuleGraph.prototype.last = function last() {
  var names = this.set.names;
  return this.graph.node(names[names.length - 1]);
}

ModuleGraph.prototype.makeEager = function makeEager(name) {
  if (this.eagerSet.has(name)) {
    return;
  }
  var postorder = graphlib.alg.postorder(this.graph, name);
  for (var i=0; i<postorder.length; i++) {
    this.eagerSet.add(postorder[i]);
  }
};

module.exports = ModuleGraph;
