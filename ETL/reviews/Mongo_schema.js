const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/SDC');

// This Mongo schema has no authentication, and index
// Because this allow for faster ETL, also we use express authentication
const reviewSchema = new mongoose.Schema({
  _id: Number,
  product_id: Number,
  rating: Number,
  date: Number,
  summary: String,
  body: String,
  recommend: Boolean,
  reported: Boolean,
  reviewer_name: String,
  reviewer_email: String,
  response: String,
  helpfulness: Number,
  photos: [ String ],
  char_keys: [ String ],
  char_values: [ Number ],
});

const Review = mongoose.model('Review', reviewSchema);

const disconnect = () => mongoose.connection.close();

module.exports = { Review, disconnect };