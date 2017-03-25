var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Review = new Schema({
  title: String,
  body: String,
  user: { type: Schema.Types.ObjectId, ref: 'Review' },
  // rating 1-5 or 1-10. it will depend on logic
  rating: { type: Number },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', Review);
