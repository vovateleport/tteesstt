'use strict';

var express = require('express');
var app = express();

app.get('/yo', function (req, res) {
  res.send('Hello World!')
});

app.use(express.static('www', {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['html', 'css', 'js'],
  //index: true,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}));

var server = app.listen(9988, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Demo1 app listening at http://%s:%s', host, port);
});