var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Image = new Schema({
  // collection name. changing it may break your app
  name: String,
  thumb_url: String,
  medium_url: String,
  endpoints: [Schema.Types.Mixed],
  enabled: { type: Boolean, default: true },
  modified_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Image', Image);
