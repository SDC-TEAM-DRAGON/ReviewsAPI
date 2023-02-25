const { Review, ReviewMeta } = require('./schema.js');

async function getReviews ({page = 1, count = 5, sort = "relevant", product_id}) {
  // define query method inputs
  const skip = (page - 1) * count;

  let sorting;
  if (sort == 'newest') {
    sorting = {date: - 1};
  } else if (sort === 'helpful') {
    sorting = {helpfulness: - 1 }
  } else if (sort === 'relevant') {
    sorting = {date: - 1, helpfulness: -1}
  }

  // find all matching data
  const reviews = await Review.find({product_id: +product_id})
  .skip(skip)
  .limit(+count)
  .sort(sorting);

  console.log(reviews)
  // store in an object and return the obj
  const reviewObj = {
    product: product_id,
    page: page,
    count: count,
    results: reviews.map((review) => {
      return {
        review_id: review._id,
        rating: review.rating,
        summary: review.summary,
        recommend: review.recommend,
        response: review.response,
        body: review.body,
        date: review.date,
        reviewer_name: review.reviewer_name,
        helpfulness: review.helpfulness,
        photos: review.photos.map(photo => {
          return {
            url: photo,
          }
        })
      }
    })
  }

  return reviewObj;
}

async function getReviewMeta ({product_id}) {
  const metaData = await ReviewMeta.findOne({_id: +product_id});
  let reviewCount = metaData.reviewCount;
  let charSums = Object.fromEntries(metaData.charSums);

  for (let key in charSums) {
    charSums[key] = charSums[key] / reviewCount;
  };

  let metaObj = {
    _id: metaData['_id'],
    ratings: metaData['ratings'],
    recommend: metaData['recommend'],
    characteristics: charSums,
  };

  return metaObj;
}


async function addReview ({ product_id, rating, summary, body, recommend, name, email, photos, characteristics}) {

  const newReview = new Review ({
    product_id,
    rating,
    summary,
    body,
    recommend,
    reviewer_name: name,
    reviewer_email: email,
    photos,
    chars: characteristics,
  });

  await newReview.save();

  let charObj = {};
  for (let key in characteristics) {
    charObj[`charSums.${key}`] = characteristics[key];
  }

  const updateMeta = await ReviewMeta.findByIdAndUpdate(product_id,
    {
      $inc: {reviewCount: 1,
             [`ratings.${rating}`]: 1,
             [`recommend.${recommend}`]: 1,
             ...charObj,
            }
    }
  )

}

async function helpful (review_id) {
  // review_id is _id
  const helpful = await Review.findByIdAndUpdate(review_id, {$inc: { helpfulness: 1 }});

}

async function report (review_id) {
  const helpful = await Review.findByIdAndUpdate(review_id, {reported: true});

}

module.exports = {getReviews, getReviewMeta, addReview, helpful, report};