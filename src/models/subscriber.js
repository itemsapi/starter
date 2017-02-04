var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Subscriber = new Schema({
  email: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v);
      },
      message: '{VALUE} is not a valid email!'
    }
  },
  name: { type: String },
  source: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Subscriber', Subscriber);
