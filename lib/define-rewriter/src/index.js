'use strict';
/* jshint node:true */
var Filter = require('broccoli-caching-writer');
var RSVP = require('rsvp');
var processEmber = require('./process-ember');
var walkSync = require('walk-sync');
var fs = require('fs');
var path = require('path');

/**
 * NOTES
 * Need to register modules into requirejs._eak_seen with a shape that looks
 * like the follow:
 *
 * (name: string) = {
 *  deps: string[]
 *  callback: Function
 * }
 *
 * enifed
 */
function DefineRewriter(inputNode, options) {
  if (options && options.eagerLoad) {
    if (Array.isArray(options.eagerLoad)) {
      this.eagerLoad = options.eagerLoad;
    } else {
      this.eagerLoad = [ options.eagerLoad ];
    }
  } else {
    this.eagerLoad = ['ember/index', 'ember-htmlbars/system/render-view', 'ember-metal/streams/key-stream'];
  }
  this.loaderDeferred = RSVP.defer();
  inputNode = toString.call(inputNode) === '[object Array]' ? inputNode : [inputNode];
  Filter.call(this, inputNode, options);
}

DefineRewriter.prototype = Object.create(Filter.prototype);
DefineRewriter.prototype.constructor = DefineRewriter;

var EMBER_PATHS = {
  'ember.prod.js': true, 'ember.debug.js': true
};

DefineRewriter.prototype.processString = function(string, relativePath) {
  if (EMBER_PATHS[relativePath]) {
    // If given
    return this.loaderDeferred.promise.then(function(loader) {
      return processEmber(string, relativePath, this.eagerLoad, loader);
    }.bind(this));
  } else if (relativePath.indexOf('loader') > -1) {
    // If given file is the loader, read and save in deferred for use by preparse
    this.loaderDeferred.resolve(string);
  }
  return string;
};

DefineRewriter.prototype.build = function() {
  var root = this.inputPaths[0];
  var outRoot = this.outputPath;
  var entries = walkSync(root);
  return RSVP.all(entries.map(function(p) {
    var fullPath = path.join(root, p);
    var outPath = path.join(outRoot, p);
    var stats = fs.statSync(fullPath);
    if (stats.isFile()) {
      var contents = fs.readFileSync(fullPath, 'utf8');
      return RSVP.resolve(this.processString(contents, p)).then(function(output) {
        fs.writeFileSync(outPath, output);
      });
    } else if (stats.isDirectory()) {
      fs.mkdirSync(outPath);
      return RSVP.resolve();
    }
  }.bind(this)));
};

module.exports = DefineRewriter;
