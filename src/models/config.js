var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = new Schema({
  // collection name. changing it may break your app
  name: String,
  // google analytics id
  ga_id: String,
  // comma delimited
  popular_queries: String,
  logo: { type: String, default: '/assets/images/logo.jpg' },
  title: { type: String, default: 'ItemsAPI starter' },
  recommendation_field: { type: String, default: 'tags' },
  fallback_image: { type: String, default: 'http://placehold.it/300x400' },
  step: { type: Number, default: 2 },
  is_sitemap: { type: Boolean, default: true },
  hints: { type: Boolean, default: true },
  is_installation: { type: Boolean, default: true },
  enabled: { type: Boolean, default: true },
  modified_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Config', Config);
