var redis = require('redis');
var config = require('./index').get();
var Promise = require('bluebird')
var client = redis.createClient(config.redis);
Promise.promisifyAll(redis.RedisClient.prototype);

module.exports = client

