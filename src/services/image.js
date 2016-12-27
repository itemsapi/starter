var _ = require('lodash')
var mongoose = require('./../../config/mongoose')
var config = require('./../../config/index').get()
var Image = require('./../models/image')
var client = require('../clients/s3')
var Promise = require('bluebird')
var image_downloader = require('image-downloader');

/**
 * upload image and save result to mongodb
 */
exports.upload = function(filename) {
  if (!filename) {
    return Promise.reject(new Error('Filename is missing'))
  }
  if (config.images && config.images.filesystem === 's3') {
    return exports.uploadS3(filename)
    .then(function(res) {
      var params = {
        endpoints: res
      }

      if (res.length >= 1) {
        params.thumb_url = res[0].url
      }
      if (res.length >= 2) {
        params.medium_url = res[1].url
      }
      var image = new Image(params)
      return image.save()
    })
  } else {
    return Promise.reject(new Error('Uploading images not configured'))
  }
}

/**
 * upload image to aws s3
 */
exports.uploadS3 = function(filename) {
  return new Promise(function(resolve, reject) {
    client.upload(filename, {}, function(err, versions, meta) {
      if (err) {
        return reject(err)
      }

      return resolve(_.map(versions, function(val) {
        return _.pick(val, ['quality', 'width', 'height', 'url'])
      }))

      versions.forEach(function(image) {
        return resolve(image.url)
        console.log(image.width, image.height, image.url);
      });
    })
  })
}

/**
 * upload image to cloudinary
 * in progress
 */
exports.uploadCloudinary = function(filename) {
  options = options || {}

  var data = {
    width: options.width,
    height: options.height
  }

  return new Promise(function(resolve, reject) {
    cloudinary.uploader.upload(image, function(result) {
      result.final_url = result.secure_url

      if (result.error) {
        return reject(result.error.message)
      }
      return resolve(result)
    }, data)
  })
}

/**
 * get images
 */
exports.find = function(data) {
  return Image.find(data)
  .sort({ created_at: -1 })
}

/**
 * remove image
 */
exports.delete = function(id) {
  return Image.find({
    _id: id
  }).remove()
}

/**
 * image download
 */
exports.download = function(url, dest) {
  return new Promise(function(resolve, reject) {
    image_downloader({
      url: url,
      dest: dest,
      done: function(err, filename, image) {
        if (err) {
          return reject(err)
        }
        return resolve(filename)
      }
    })
  })
}
