var winston = require('winston')
var util = require('util');
//var LogstashUDP = require('winston-logstash-udp').LogstashUDP;

var env = process.env.NODE_ENV || 'development'
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    /*new(LogstashUDP)({
      port: 5000,
      appName: 'starter-' + env,
      host: 'x.x.x.x'
    })*/
  ]
});

module.exports = logger;
