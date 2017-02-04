var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemVisit = new Schema({
  item: String,
  item: { type: Schema.Types.ObjectId, ref: 'Item' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ItemVisit', ItemVisit);
