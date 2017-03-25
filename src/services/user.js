var User = require('../models/user.js');
var Promise = require('bluebird')
var emitter = require('./../../config/emitter');
var _ = require('lodash')

/**
 * todo - error handling
 */
exports.changePassword = function(data, password) {
  return new Promise(function(resolve, reject) {
    User.findOne(data, function(err, user) {
      user.setPassword(password, function(e, r) {
        user.save().then(function(r) {
          return resolve()
        })
      })
    })
  })
}

/**
 * todo - error handling
 */
exports.register = function(data) {
  return new Promise(function(resolve, reject) {
    User.register(new User({ email : data.email }), data.password, function(err, user) {
      if (err) {
        return reject(err)
      }
      return resolve(user)
    });
  })
}

/**
 * find users
 */
exports.find = function(data) {
  return User.find(data)
  .sort({ created_at: -1 })
}

/**
 * find last users
 */
exports.findLast = function(data) {
  return User.find(data)
  .sort({ created_at: -1 })
}

/**
 * github, facebook, google+, linkedin should be merged eventually
 */

exports.updateLinkedinUser = function(accessToken, refreshToken, profile) {
  var email
  if (profile.emails && _.isArray(profile.emails)) {
    email = profile.emails[0].value
  }

  var getUser = User.findOne({email: email})
  var isUserNew = false

  if (!email) {
    getUser = User.findOne({'linkedin.id': profile.id})
  }

  return getUser
  .then(function(user) {
    if (!user) {
      user = new User();
      isUserNew = true
    }

    var picture
    if (_.isArray(profile.photos) && profile.photos.length > 0) {
      picture = profile.photos[0].value
      user.picture = picture
    }

    if (profile._json.pictureUrl) {
      picture = profile._json.pictureUrl
      user.picture = picture
    }

    user.linkedin = {
      id: profile.id,
      json: profile._json,
      name: profile.displayName
    }

    user.name = profile.displayName;

    if (email) {
      user.email = email
      user.linkedin.email = email
    }

    // save the user
    return user.save()
    .then(function(result) {
      if (isUserNew) {
        emitter.emitAsync('user.registration_success', user)
      } else {
        emitter.emitAsync('user.login_success', user)
      }
    })
    .then(function(result) {
      return user
    })
    .catch(function(err) {
      //log.error(err)
      console.log(err)
      return Promise.reject(err)
    })
  })
}



exports.updateGithubUser = function(accessToken, refreshToken, profile) {
  var email
  if (profile.emails && _.isArray(profile.emails)) {
    email = profile.emails[0].value
  }

  var getUser = User.findOne({email: email})
  var isUserNew = false

  if (!email) {
    getUser = User.findOne({'github.id': profile.id})
  }

  return getUser
  .then(function(user) {
    if (!user) {
      user = new User();
      isUserNew = true
    }

    var picture
    if (_.isArray(profile.photos) && profile.photos.length > 0) {
      picture = profile.photos[0].value
      user.picture = picture
    }

    user.github = {
      id: profile.id,
      profileUrl: profile.profileUrl,
      gender: profile.gender,
      picture: picture,
      username: profile.username,
      json: profile._json,
      name: profile.displayName
    }

    user.name = profile.displayName;

    if (email) {
      user.email = email;
      user.github.email = email;
    }

    return user.save()
    .then(function(result) {
      if (isUserNew) {
        emitter.emitAsync('user.registration_success', user);
      } else {
        emitter.emitAsync('user.login_success', user);
      }
    })
    .then(function(result) {
      return user
    })
    .catch(function(err) {
      return Promise.reject(err)
    })
  })
}

exports.updateFacebookUser = function(accessToken, refreshToken, profile) {
  var email
  if (profile.emails && _.isArray(profile.emails)) {
    email = profile.emails[0].value
  }

  var getUser = User.findOne({email: email})
  var isUserNew = false

  if (!email) {
    getUser = User.findOne({'facebook.id': profile.id})
  }

  return getUser
  .then(function(user) {
    if (!user) {
      user = new User();
      isUserNew = true
    }

    var picture
    if (_.isArray(profile.photos) && profile.photos.length > 0) {
      picture = profile.photos[0].value
      user.picture = picture
    }

    user.facebook = {
      id: profile.id,
      profileUrl: profile.profileUrl,
      gender: profile.gender,
      picture: picture,
      birthday: profile.birthday,
      username: profile.username,
      //token: refreshToken,
      name: profile.displayName
    }

    if (email) {
      user.email = email
      user.facebook.email = email
    }

    user.name = profile.displayName;

    // save the user
    return user.save()
    .then(function(result) {
      if (isUserNew) {
        emitter.emitAsync('user.registration_success', user)
      } else {
        emitter.emitAsync('user.login_success', user)
      }
    })
    .then(function(result) {
      return user
    })
    .catch(function(err) {
      //log.error(err)
      console.log(err)
      return Promise.reject(err)
    })
  })
}
