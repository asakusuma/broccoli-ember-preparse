function ModuleNode(name, deps, functionExpression) {
  this.name = name;
  this.deps = deps;
  this.functionExpression = functionExpression;
}

module.exports = ModuleNode;
