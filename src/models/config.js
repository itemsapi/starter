var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = new Schema({
  name: String,
  step: { type: Number, default: 2 },
  modified_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Config', Config);
