(function() {
  'use strict';
  var seen = {};
  var registry = {};
  var empty = {
    deps: [],
    callback: function () {}
  };
  // eager load
  var names = Em._eager;
  var exports = Em._e = new Array(names.length);
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    exports[i] = seen[name] = { default: undefined };
    // use an empty entry for checks if a module exists
    registry[name] = empty;
  }

  var loader = {
    registry: registry,
    seen: seen,
    define: function define(name, deps, callback) {
      loader._define(name, deps, callback);
    },
    _define: function define(name, deps, callback) {
      if (this.registry[name]) {
        return;
      }
      this.registry[name] = {
        deps: deps,
        callback: callback
      };
    },
    require: function (name) {
      return loader._require(name, undefined);
    },
    _require: function require(_name, referrerName) {
      var exports = this.seen[_name];
      if (exports !== undefined) {
        return exports;
      }

      var name = _name;
      var mod = this.registry[_name];
      if (!mod) {
        name = _name + '/index';
        exports = this.seen[name];
        if (exports !== undefined) {
          return exports;
        }
        mod = registry[name];
      }

      if (mod === undefined) {
        if (referrerName) {
          throw new Error('Could not find module ' + _name + ' required by: ' + referrerName);
        } else {
          throw new Error('Could not find module ' + _name);
        }
      }

      this.seen[name] = exports = { default: undefined };

      var deps = mod.deps;
      var reified = new Array(deps.length);
      for (var i = 0; i < reified.length; i++) {
        if (deps[i] === 'exports') {
          reified[i] = exports;
        } else if (deps[i] === 'require'){
          reified[i] = this.require;
        } else {
          reified[i] = this._require(deps[i], name);
        }
      }

      mod.callback.apply(undefined, reified);

      return exports;
    }
  };

  loader.require['default'] = loader.require;
  loader.require.has = function(name) {
    var registry = loader.registry;
    return !!registry[name] || !!registry[name + '/index'];
  };

  Em.__loader = loader;
})();
