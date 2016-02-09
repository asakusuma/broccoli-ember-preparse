function NameSet() {
  this.map = Object.create(null);
  this.names = [];
}

NameSet.prototype.add = function add(name) {
  var index = this.map[name];
  if (index !== undefined) {
    return index;
  }
  index = this.names.length;
  this.map[name] = index;
  this.names[index] = name;
};

NameSet.prototype.has = function has(name) {
  return this.map[name] !== undefined;
}

module.exports = NameSet;
