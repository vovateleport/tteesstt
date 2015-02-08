'use strict';

var express = require('express');
var app = express();
var morgan = require('morgan')
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('json-middleware').middleware());
app.use(morgan('dev'));

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

var translate = require('./lib/translate');
app.post('/translate', translate.translate);
app.get('/sample', translate.getSample);

var server = app.listen(9988, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Demo1 app listening at http://%s:%s', host, port);
});