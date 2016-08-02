'use strict';
/* jshint node:true */
var Filter = require('broccoli-caching-writer');
var RSVP = require('rsvp');
var processEmber = require('./process-ember');
var walkSync = require('walk-sync');
var fs = require('fs');
var path = require('path');

var DEFAULT_HTMLBARS_EAGER = [
  'ember/index',
  'ember-htmlbars/system/render-view',
  'ember-metal/streams/key-stream'
];
var DEFAULT_GLIMMER_EAGER = [
  'glimmer-reference/index',
  'ember-glimmer/components/checkbox',
  'ember-glimmer/components/link-to',
  'ember-glimmer/components/text_area',
  'ember-glimmer/components/text_field',
  'ember-glimmer/renderer',
  'ember-glimmer/make-bound-helper',
  'ember-glimmer/setup-registry',
  'ember-glimmer/views/outlet',
  'ember-glimmer/templates/outlet',
  'ember-glimmer/templates/component',
  'ember-glimmer/dom',
  'ember/index'
];

function defaultFilter(node) {
  if (isUMDModule(node)) {
    console.log('removing UMD module:', node.name);
    return true;
  }

  if (isTSLINTModule(node)) {
    console.log('removing TSLINT module:', node.name);
    return true;
  }

  if (isEmptyModule(node)) {
    console.log('removing empty module:', node.name);
    return true;
  }

  return false;
}

function isUMDModule(node) {
  var name = node.name;
  var l = name.length;
  return l > 4 && name.charCodeAt(l - 4) === 46 &&
         name.indexOf('umd', l - 3) !== -1;
}

function isEmptyModule(node) {
  if (node.functionExpression.body.body.length === 0 &&
      node.deps.length === 1 &&
      node.deps[0] === 'exports') {
    return true
  }
  return false;
}

function isTSLINTModule(node) {
  var name = node.name;
  var l = name.length;
  return l > 7 && name.charCodeAt(l - 7) === 46 &&
         name.indexOf('tslint', l - 6) !== -1;
}

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
  console.log('DefineRewriter', options)
  if (options && options.eagerLoad) {
    if (Array.isArray(options.eagerLoad)) {
      this.eagerLoad = options.eagerLoad;
    } else {
      this.eagerLoad = [ options.eagerLoad ];
    }
  } else {
    if (options && options.glimmer) {
      this.eagerLoad = DEFAULT_GLIMMER_EAGER;
    } else {
      this.eagerLoad = DEFAULT_HTMLBARS_EAGER;
    }
  }
  if (options && options.filter) {
    this.moduleFilter = options.filter;
  } else {
    this.moduleFilter = defaultFilter;
  }
  Filter.call(this, Array.isArray(inputNode) ? inputNode : [ inputNode ], options);
}

DefineRewriter.prototype = Object.create(Filter.prototype);
DefineRewriter.prototype.constructor = DefineRewriter;

var EMBER_PATHS = {
  'ember.prod.js': true,
  'ember.debug.js': true
};

DefineRewriter.prototype.processString = function(string, relativePath) {
  if (EMBER_PATHS[relativePath]) {
    // If given
    return processEmber(string, relativePath, this.eagerLoad, this.moduleFilter);
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
