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
          if (username !== config.auth.username || password !== config.auth.password) {
            return done(null, false, { message: 'Incorrect credentials' })
          }

          return done(null, {
            username: username
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

  /*app.get('/login', function(req, res) {
    return res.render('auth/login');
  });*/

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));
}
