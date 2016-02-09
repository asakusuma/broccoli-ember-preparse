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
      this.registry[name] = {
        deps: deps,
        callback: callback
      };
    },
    require: function (name) {
      return loader._require(name, undefined);
    },
    _require: function require(name, referrerName) {
      var exports = this.seen[name];
      if (exports !== undefined) {
        return exports;
      }

      exports = this.seen[name] = { default: undefined };

      var mod = this.registry[name];

      if (!mod) {
        name = name + '/index';
        mod = registry[name];
      }

      if (mod === undefined) {
        if (referrerName) {
          throw new Error('Could not find module ' + name + ' required by: ' + referrerName);
        } else {
          throw new Error('Could not find module ' + name);
        }
      }

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
    return !!loader.registry[name];
  };

  Em.__loader = loader;
})();
