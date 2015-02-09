'use strict';

var _ = require ('underscore');
var fs = require('fs');
var xml2js = require('xml2js');
var misc = require('../lib/misc');
var context = require('../lib/context');
var vow = require('vow');

var parser = new xml2js.Parser({
  normalizeTags :true,
  explicitArray: false});

exports.work = work;

/**
 * @returns {vow.promise}
 */
function getRaw() {
  var d = vow.defer();
  fs.readFile(__dirname + '/nld-eng.xml', function (err, data) {
    if (err)
      return d.reject(misc.err('Fail read file',err));

    parser.parseString(data, function (err, result) {
      if (err)
        return d.reject(misc.err('Fail xml parse', err));

      var entries = result.tei.text.body.entry;
      d.resolve(entries);
    });
  });

  return d.promise();
}

/**
 * @returns {vow.promise}
 */
function loadIntoRedis(data){
  console.log('loadIntoRedis.data.length=',data.length);
  return context.redis_mset(convertToMset(data));
}

function convertToMset(data){
  var rv = [];
  _.each(data, function(entry){
    var kvp = convertEntry(entry);
    rv.push(kvp.key);
    rv.push(kvp.value);
  });
  console.log('convertToMset.data.length=',rv.length);
  return rv;
}

/**
 * convert and remove duplicate
 * @param entry
 */
function convertEntry(entry){
  var key = entry.form.orth;
  var val0 = [];
  var all = {};
  var senses = _.isArray(entry.sense)? entry.sense: [entry.sense];
  _.each(senses, function(sense){
    var cits = _.isArray(sense.cit)? sense.cit : [sense.cit];
    var val1 = [];
    _.each(cits, function(cit){
      if (!all.hasOwnProperty('v_'+cit.quote)){
        all['v_'+cit.quote] = null;
        val1.push(cit.quote);
      }
    });
    if (val1.length)
      val0.push(val1);
  });
  return {
    key : key.toLowerCase(),
    value : JSON.stringify(val0)
  };
}

/**
 * @returns {vow.promise}
 */
function work(){
  return getRaw().then(function(entries){
    return loadIntoRedis(entries);
  });
}
