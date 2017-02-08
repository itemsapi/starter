var User = require('./../src/models/user');
var userService = require('./../src/services/user');
var emitter = require('./../config/emitter');
var log = require('./../config/logger');
var config = require('./../config/index').get()
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());
  //passport.use(new LocalStrategy(User.authenticate()))
  //passport.serializeUser(User.serializeUser())
  //passport.deserializeUser(User.deserializeUser())

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

  app.get('/auth/facebook', function(req, res, next) {
    if (!config.auth || !config.auth.facebook || !config.auth.facebook.clientID || !config.auth.facebook.clientSecret) {
      return res.status(500).send('Facebook Auth is not configured');
    }
    //req.session.last_domain = req.protocol + '://' + req.get('Host')
    return next()
  }, passport.authenticate('facebook', { scope: config.auth.facebook.scope}))

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login'
  }), function(req, res) {
    var url = '/'
    return res.redirect(url);
  });

  /*app.get('/login', function(req, res) {
    return res.render('auth/login');
  });*/

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

  app.get('/logout', function(req, res) {
    req.logout();
    return res.redirect('/');
  })


}
