var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Item = new Schema({
  item_id: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  modified_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', Item);
