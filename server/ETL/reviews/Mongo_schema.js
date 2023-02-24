const mongoose = require('mongoose');
const { Schema, model } = mongoose;

mongoose.set('strictQuery', false);
// This Mongo schema has no authentication, and index
// Because this allow for faster ETL, also we use express authentication
const reviewSchema = new Schema({
  product_id: Number,
  rating: Number,
  date: Date,
  summary: String,
  body: String,
  recommend: Boolean,
  reported: Boolean,
  reviewer_name: String,
  reviewer_email: String,
  response: String,
  helpfulness: Number,
  photos: [ String ],
  chars: { type: Map, of: Number }
});


// Store the meta information for reviews collection, providing faster READ operation for API
const reviewMetaSchema = new Schema({
  _id: Number, // product_id,
  reviewCount: Number,
  ratings: { type: Map, of: Number },
  recommend: {
    "true": Number,
    "false": Number
  },
  charSums: { type: Map, of: Number }
});

const Review = model('Review', reviewSchema);
const ReviewMeta = model('ReviewMeta', reviewMetaSchema);

module.exports = { Review, ReviewMeta };