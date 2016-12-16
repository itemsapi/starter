'use strict';

exports.makeSuite = function addSuite(name, tests) {

  process.env.NODE_ENV = 'test';
  var config = require('./../../config/index').get();

  var itemsapi  = require(__dirname + '/../../server');
  var server = itemsapi.get('express');

  exports.server = server

  describe(name, function describe() {
    before(function before(done) {
      var PORT = process.env.PORT || 4500;
      server = server.listen(PORT, function() {
        done();
      });
    });

    tests();

    after(function after(done) {
      server.close(function(res) {
        done()
      })
    })
  })
};
