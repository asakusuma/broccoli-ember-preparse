# broccoli-ember-preparse
Broccoli plugin that applies some compile time performance optimizations to an ember build.

Essentially a broccoli plugin version of [define-rewriter](https://github.com/chadhietala/define-rewriter).

Credit to [Chad Hietala](https://github.com/chadhietala) and [Kris Selden](https://github.com/krisselden) for the idea and the proof of concept.

## Usage

``` javascript
var preparse = require('broccoli-ember-preparse');
var Funnel = require('broccoli-funnel');

var bowerDist = new Funnel('bower_components/ember', {
  exclude: ['.bower.json']
});
var options = {};
var newDist = preparse(bowerDist, options);
```
