const mongoose = require('mongoose');
const { Schema, model } = mongoose;

mongoose.set('strictQuery', false);
// This Mongo schema has no authentication, and index
// Because this allow for faster ETL, also we use express authentication
const reviewSchema = new Schema({
  product_id: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  date: {
    type: Date,
    default: new Date(),
  },
  summary: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 60,
  },
  body: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 1000,
  },
  recommend: {
    type: Boolean,
    required: true,
  },
  reported: {
    type: Boolean,
    default: false,
  },
  reviewer_name: {
    type: String,
    required: true,
    maxlength: 60,
  },
  reviewer_email: {
    type: String,
    required: true,
    maxlength: 60,
  },
  response: {
    type: String,
    default: null
  },
  helpfulness: {
    type: Number,
    default: 0,
    min: 0,
  },
  photos: {
    type: [String],
    validate: {
      validator: (photos) => {
        return photos.length <= 5;
      },
      message: 'can only upload 5'
    },
  },
  chars: {
    type: Map,
    of: {
      type: Number,
      min: 1,
      max: 5,
    }
  }
});


// Store the meta information for reviews collection, providing faster READ operation for API
const reviewMetaSchema = new Schema({
  _id: {
    type: Number,
    required: true,
  },
  reviewCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  ratings: {
    type: Map,
    of: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    }
  },
  recommend: {
    "true":{
      type: Number,
      default: 0,
      min: 0,
    },
    "false": {
      type: Number,
      default: 0,
      min: 0,
    }
  },
  charSums: {
    type: Map,
    of: {
      type: Number,
      default: 0,
      min: 0,
    } }
});

const Review = model('Review', reviewSchema);
const ReviewMeta = model('ReviewMeta', reviewMetaSchema);

module.exports = { Review, ReviewMeta };