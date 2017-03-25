var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
  username: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  password: String,
  picture: String,
  enabled: {
    type: Boolean,
    default: true
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  google: { type: Schema.Types.Mixed },
  facebook: { type: Schema.Types.Mixed },
  github: { type: Schema.Types.Mixed },
  linkedin: { type: Schema.Types.Mixed },
  twitter: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

User.plugin(passportLocalMongoose, {
  usernameField: 'email',
  iterations: 0
});

module.exports = mongoose.model('User', User);
