var superagent = require('superagent');
var enqueue = require('../');

// execute 2 at a time, with a tim
var options = {
  concurrency: 2,
  timeout: 3000
};

var fn = enqueue(function(url, done) {
  console.log('request: %s', url);
  setTimeout(function() {
    superagent.get(url, done);
  }, 1000);
}, options);


var urls = [
  'http://lapwinglabs.com',
  'http://gittask.com',
  'http://mat.io'
];

urls.forEach(function(url) {
  fn(url, status(url));
})

function status(url) {
  var start = new Date();
  return function(err, res) {
    if (err) console.error(err);
    else console.log('response: %s - status (%s) - %sms', url, res.status, (new Date()) - start);
  }
}
