var empty = {
  deps: [],
  callback: function () {}
};
var names = Em._eager;
var exports = Em._e = new Array(names.length);
for (var i = 0; i < names.length; i++) {
  var name = names[i];
  exports[i] = seen[name] = { default: undefined };
  // use an empty entry for checks if a module exists
  registry[name] = empty;
}
