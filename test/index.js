/**
 * Module Dependencies
 */

var enqueue = require('..');
var assert = require('assert');

/**
 * Tests
 */

describe('enqueue', function() {

  describe('async', function() {

    it('should process jobs in order', function(done) {
      var calls = [];

      var fn = enqueue(function(i, cb) {
        setTimeout(function() {
          calls.push(i);
          cb();
        }, range(50, 100));
      });

      var pending = 5;
      for (var i = 0; i < 5; i++) {
        fn(i, function() {
          if (!--pending) {
            assert.deepEqual(calls, [0, 1, 2, 3, 4]);
            done();
          }
        });
      }
    });

    it('should work without callbacks', function(done) {
      var calls = [];

      var fn = enqueue(function(id, cb) {
        calls.push(id);
        cb();
      });

      fn(1);
      fn(2);
      fn(3, function () {
        assert(1 == calls[0]);
        assert(2 == calls[1]);
        assert(3 == calls[2]);
        done();
      });

    })

    it('should support concurrency', function(done) {
      var calls = [];

      var fn = enqueue(function(ms, i, cb) {
        setTimeout(function() {
          calls.push(i);
          cb();
        }, ms);
      }, { concurrency: 2 });

      fn(100, 'one', function() {
        assert(2 == calls.length);
      })

      fn(50, 'two', function() {
        assert(1 == calls.length);
      })

      fn(75, 'three', function() {
        assert(3 == calls.length);
        assert('two' == calls[0]);
        assert('one' == calls[1]);
        assert('three' == calls[2]);
        done();
      })
    })

    it('should transparently fn values', function(done) {
      var fn = enqueue(function(ms, i, cb) {
        setTimeout(function() {
          cb(i, ms);
        }, ms);
      }, { concurrency: 2 });

      fn(100, 'one', function(i, ms) {
        assert('one' == i);
        assert(100 == ms);
      });

      fn(50, 'two', function(i, ms) {
        assert('two' == i);
        assert(50 == ms);
      });

      fn(75, 'three', function(i, ms) {
        assert('three' == i);
        assert(75 == ms);
        done();
      });
    })

    it('should preserve context', function(done) {
      var fn = enqueue(function(ms, expected, cb) {
        var ctx = this;
        setTimeout(function() {
          assert(ctx.ctx == expected);
          cb();
        }, ms)
      }, { concurrency: 2 });

      fn.call({ ctx: 'a', }, 100, 'a', function(){});
      fn.call({ ctx: 'b', }, 50, 'b', function(){});
      fn.call({ ctx: 'c', }, 100, 'c', done);
    })
  })

  it('should support a timeout', function(done) {
    this.timeout(3000);
    var called = 0;
    var d = new Date();

    var fn = enqueue(function(id, cb) {
      // wait...
    }, { concurrency: 2, timeout: 200 });

    fn(1, function(err) {
      assert(err);
      var delta = (new Date()) - d;
      eom(delta, 200);
      called++;
    });

    fn(2, function(err) {
      assert(2 == ++called);
      assert(err);
      var delta = (new Date()) - d;
      eom(delta, 200);
    });

    fn(3, function(err) {
      assert(err);
      assert(3 == ++called);
      var delta = (new Date()) - d;
      eom(delta, 400);
      done();
    });
  })

  it('should support limits', function(done) {
    var called = [];

    var fn = enqueue(function(id, cb) {
      setTimeout(function() {
        called.push(id);
        cb();
      }, 200);
    }, { limit: 2 });

    fn(1);
    fn(2);
    var err = fn(3);
    assert(err);

    setTimeout(function() {
      fn(4, function() {
        assert.deepEqual(called, [1, 2, 4]);
        done();
      })
    }, 300);
  });

  it('should support limits with concurrency', function(done) {
    var called = [];

    var fn = enqueue(function(id, cb) {
      setTimeout(function() {
        called.push(id);
        cb();
      }, 200);
    }, { limit: 2, concurrency: 3 });

    fn(1);
    fn(2);
    var err = fn(3);
    assert(err);

    setTimeout(function() {
      fn(4, function() {
        assert.deepEqual(called, [1, 2, 4]);
        done();
      })
    }, 300);
  });

  describe('sync', function() {

    it('should work with sync functions', function() {
      var fn = enqueue(function(msg) {
        return msg + '!';
      })

      assert('hi!' == fn('hi'));
    })

    it('should have the proper context', function() {
      var fn = enqueue(function(expected) {
        assert(this.ctx == expected);
      });

      fn.call({ ctx: 'a', }, 'a');
      fn.call({ ctx: 'b', }, 'b');
      fn.call({ ctx: 'c', }, 'c');
    })
  })

})

/**
 * Random Range
 */

function range(min, max) {
  var n = Math.random();
  return Math.round(n * max + (1 - n) * min);
}

/**
 * Margin of error
 */

function eom(actual, expected) {
  var percentage = Math.abs(actual/expected - 1);
  assert(percentage < .1, percentage + '% > 10%');
}
