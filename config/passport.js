var User = require('./../src/models/user');
var userService = require('./../src/services/user');
var emitter = require('./../config/emitter');
var log = require('./../config/logger');
var config = require('./../config/index').get()
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var LinkedinStrategy = require('passport-linkedin').Strategy;
var GithubStrategy = require('passport-github').Strategy;

module.exports = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(id, done) {
    done(null, id)
  });

  /**
   * authentication method
   * it check user in mongodb
   * if found then check if password is correct
   * if not found then also check `in-memory` login / password
   */
  passport.use(new LocalStrategy(
    function(username, password, done) {
      User.findByUsername(username, function (err, user) {
        if (err) {
          return done(null, false, { message: err })
        }
        if (!user) {
          // login by inmemory credentials
          if (!config.auth.memory || config.auth.memory.enabled === false) {
            return done(null, false, { message: 'Incorrect credentials' })
          }
          if (username !== config.auth.memory.username || password !== config.auth.memory.password) {
            return done(null, false, { message: 'Incorrect credentials' })
          }

          return done(null, {
            username: username,
            is_admin: true
          })
        } else {
          user.authenticate(password, function(err, user) {
            if (err) {
              return done(null, false, { message: err })
            }
            if (!user) {
              return done(null, false, { message: 'Incorrect password' })
            }
            return done(null, user)
          })
        }
      })
    }
  ))

  if (config.auth && config.auth.facebook && config.auth.facebook.clientID && config.auth.facebook.clientSecret) {
    passport.use(new FacebookStrategy({
      clientID: config.auth.facebook.clientID,
      clientSecret: config.auth.facebook.clientSecret,
      callbackURL: config.auth.facebook.callbackURL,
      profileFields: config.auth.facebook.profileFields
    }, function(accessToken, refreshToken, profile, done) {
      process.nextTick(function() {
        userService.updateFacebookUser(accessToken, refreshToken, profile)
        .then(function(user) {
          done(null, user)
        })
        .catch(function(err) {
          done(err)
        })
      })
    }))
  }

  if (config.auth && config.auth.linkedin && config.auth.linkedin.clientID && config.auth.linkedin.clientSecret) {
    passport.use(new LinkedinStrategy({
      consumerKey: config.auth.linkedin.clientID,
      consumerSecret: config.auth.linkedin.clientSecret,
      callbackURL: config.auth.linkedin.callbackURL,
      profileFields: config.auth.linkedin.profileFields
    }, function(accessToken, refreshToken, profile, done) {
      process.nextTick(function() {
        userService.updateLinkedinUser(accessToken, refreshToken, profile)
        .then(function(user) {
          done(null, user)
        })
        .catch(function(err) {
          done(err)
        })
      })
    }))
  }

  if (config.auth && config.auth.github && config.auth.github.clientID && config.auth.github.clientSecret) {
    passport.use(new GithubStrategy({
      clientID: config.auth.github.clientID,
      clientSecret: config.auth.github.clientSecret,
      callbackURL: config.auth.github.callbackURL
    }, function(accessToken, refreshToken, profile, done) {
      process.nextTick(function() {
        userService.updateGithubUser(accessToken, refreshToken, profile)
        .then(function(user) {
          done(null, user)
        })
        .catch(function(err) {
          done(err)
        })
      })
    }))
  }

  app.get('/auth/github', function(req, res, next) {
    if (!config.auth || !config.auth.github || !config.auth.github.clientID || !config.auth.github.clientSecret) {
      return res.status(500).send('Github auth is not configured');
    }
    return next();
  }, passport.authenticate('github', {
    scope: config.auth.github.scope
  }));

  app.get('/auth/github/callback', passport.authenticate('github', {
    failureRedirect: '/login'
  }), function(req, res) {
    var url = '/'
    return res.redirect(url);
  });

  app.get('/auth/facebook', function(req, res, next) {
    if (!config.auth || !config.auth.facebook || !config.auth.facebook.clientID || !config.auth.facebook.clientSecret) {
      return res.status(500).send('Facebook Auth is not configured');
    }
    return next()
  }, passport.authenticate('facebook', {
    scope: config.auth.facebook.scope
  }));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login'
  }), function(req, res) {
    var url = '/'
    return res.redirect(url);
  });

  app.get('/auth/linkedin', function(req, res, next) {
    if (!config.auth || !config.auth.linkedin || !config.auth.linkedin.clientID || !config.auth.linkedin.clientSecret) {
      return res.status(500).send('Linkedin auth is not configured');
    }
    return next()
  }, passport.authenticate('linkedin', {
    scope: config.auth.linkedin.scope
  }));

  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
    failureRedirect: '/login'
  }), function(req, res) {
    var url = '/'
    return res.redirect(url);
  });



  app.get('/login', function(req, res) {
    return res.render('general/login');
  });

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

  app.get('/logout', function(req, res) {
    req.logout();
    return res.redirect('/');
  })


}
