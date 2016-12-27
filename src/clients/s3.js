var Upload = require('s3-uploader');
var config = require('./../../config/index').get()

var client

if (config.images) {
  client = new Upload('itemsapi-starter-test', {
    aws: config.images.settings,
    cleanup: {
      versions: true,
      original: true
    },
    resize: {
      quality: 90
    },
    versions: [{
      maxWidth: 150,
      //aspect: '4:3',
      format: 'jpg',
      suffix: '-mini'
    }, {
      maxWidth: 400,
      //aspect: '4:3',
      format: 'jpg',
      suffix: '-medium'
    }]
  })
}

module.exports = client
