var Plugin = require('broccoli-caching-writer');
var path = require('path');
var stew = require('broccoli-stew');
var walkSync = require('walk-sync');
var fs = require('fs');

EmberPreparse.prototype = Object.create(Plugin.prototype);
EmberPreparse.prototype.constructor = EmberPreparse;
function EmberPreparse(inputNodes, options) {
  options = options || {};
  Plugin.call(this, inputNodes, {});
  this.options = options;
}

EmberPreparse.prototype.build = function() {
  console.log(this.inputPaths);

  var srcDir = this.inputPaths[0];
  var destDir = this.outputPath;
  var paths = walkSync(srcDir);
  paths.forEach(function(target) {
    var outPath = path.join(destDir, target);
    var inPath = path.join(srcDir, target);
    var content = fs.readFileSync(inPath, 'utf8');

    fs.writeFileSync(outPath, 'swag' + content);
  });
};

module.exports = function(node) {
  node = stew.debug(node, {
    name: 'preparse'
  });
  return new EmberPreparse([node]);
}
