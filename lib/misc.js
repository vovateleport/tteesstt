'use strict';

var _ = require('underscore');

exports.err = createError;
exports.logPromise = logPromise;
exports.logAsync = logAsync;
exports.format = format;

function createError(message, inner){
  return {
    message: message,
    inner : inner
  };
}

function logPromise(promise, tag) {
  promise.done(function(data){
    console.log(tag, 'data:', JSON.stringify(data,null,2));
  }, function(err){
    console.log(tag, 'err:', JSON.stringify(err,null,2));
  });
}

function logAsync(err,data){
  console.log('err:', JSON.stringify(err,null,2), 'data:', JSON.stringify(data,null,2));
}

/**
 * format('ratata{0} baba{1}','BBBB','AAAA')=='ratataBBBB babaAAAA'
 */
function format(str, vals) {
  var args = _.flatten(Array.prototype.slice.call(arguments, 1));

  return str.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
      ;
  });
}
