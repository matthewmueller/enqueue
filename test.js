function test(j) {
  console.log('start %s', j);
  setTimeout(function() {
    console.log('end %s', j);
  }, range(50, 100))
}

/**
 * Random Range
 */

function range(min, max) {
  var n = Math.random();
  return Math.round(n * max + (1 - n) * min);
}

for (var i = 0, len = 5; i < len; i++) {
  test(i);
}
