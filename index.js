/**
 * Module dependencies
 */

var sliced = require('sliced');
var noop = function(){};

/**
 * Export `enqueue`
 */

module.exports = enqueue;

/**
 * Initialize `enqueue`
 *
 * @param {Function} fn
 * @param {Object} options
 */

function enqueue(fn, options) {
  options = options || {};

  var concurrency = options.concurrency || 1;
  var timeout = options.timeout || false;
  var pending = 1;
  var jobs = [];

  return function() {
    var args = sliced(arguments);
    var last = args[args.length - 1];
    var end = 'function' == typeof last && last;
    var ctx = this;

    // remove "on end" function if there is one
    end = end ? args.pop() : noop;
    jobs.push([ctx, args.concat(once(done))]);
    return next();

    function next() {
      if (pending > concurrency) return;
      var job = jobs.shift();
      if (!job) return;

      var ctx = job[0];
      var args = job[1];
      var finish = args[args.length - 1];

      pending++;

      // support timeouts
      if (timeout) {
        setTimeout(function() {
          finish(new Error('job timed out'))
        }, timeout);
      }

      // call the fn
      return fn.apply(job[0], job[1]);
    }

    function done() {
      pending--;
      next();
      return end.apply(this, arguments);
    }
  }
}

/**
 * Once
 */

function once(fn) {
  var called = false;
  return function _once() {
    if (called) return noop();
    called = true;
    return fn.apply(this, arguments);
  }
}
