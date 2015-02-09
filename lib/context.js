'use strict';

var redis = require('redis');
var inherit = require('inherit');
var vow = require('vow');
var misc = require('./misc');
var config = require('config');
var configRedis = config.get('redis')||{};

var Context = inherit({
  __constructor: function () {
    this._redisClient = null;
  },

  getRedisClient: function () {
    if (this._redisClient)
      return vow.resolve(this._redisClient);

    var defer = vow.defer();
    var r = this._createRedisClient();

    var t=this;
    r.on('ready', function () {
      t._redisClient = r;
      defer.resolve(r);
    });
    r.on('error', function (err) {
      defer.reject(misc.err('Redis connect fail', err));
    });

    return defer.promise();
  },

  _createRedisClient: function() {
    return redis.createClient(configRedis.port || 6379, configRedis.host || '127.0.0.1');
  },

  redis_mset: function(array){
    return this.getRedisClient()
      .then(function(rc){
        var d = vow.defer();
        //console.log('redis_mset_length', array.length);
        rc.mset(array, function(err,result){
          if (err)
            d.reject(misc.err('redis.mset fail', err));
          else
            d.resolve(result);
        });
        return d.promise();
      });
  },

  redis_mget: function(keys){
    return this.getRedisClient()
      .then(function(rc){
        var d = vow.defer();
        //console.log('redis_mget_length', keys.length);
        rc.mget(keys, function(err,result){
          if (err)
            d.reject(misc.err('redis.mget fail', err));
          else
            d.resolve(result);
        });
        return d.promise();
      });
  },

  redis_get: function(key){
    return this.getRedisClient()
      .then(function(rc){
        var d = vow.defer();
        //console.log('redis_get_key', key);
        rc.get(key, function(err,result){
          if (err)
            d.reject(misc.err('redis.get fail', err));
          else
            d.resolve(result);
        });
        return d.promise();
      });
  }
});

module.exports = new Context();
