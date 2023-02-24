// Import required packages
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { connect, connection } = require('mongoose');
const { Review, ReviewMeta } = require('./Mongo_schema.js');
const { AsyncReader } = require('./AsyncReader.js');

// Zip column headers and row tuples into a JavaScript object(document in MongoDB)
function createDocument(keys, values) {
  return document = keys.reduce((obj, key, index) => {
    return { ...obj, [key]: values[index] };
  }, {});
}

// Create an AsyncReader from relative path to actual CSV files
function createReader(relativePath) {
  const absolutePath = path.join(__dirname, relativePath);
  const stream = fs.createReadStream(absolutePath);

  return new AsyncReader(readline.createInterface({ input: stream })[Symbol.asyncIterator]());
}

// CSV file names
const fileNames = [
  'reviews.csv',
  'reviews_photos.csv',
  'characteristics.csv',
  'characteristic_reviews.csv'
];

// Main function for ETL process, insert by batch
async function ETL(database = 'SDC', batchSize = 5000) {
  await connect('mongodb://127.0.0.1:27017/' + database);

  // Drop the reviews and reviewmetas collection if exists
  const collections = (await connection.db.listCollections().toArray()).map(x => x.name);
  if (collections.includes('reviews')) {
    await connection.db.dropCollection('reviews');
  }
  if (collections.includes('reviewmetas')) {
    await connection.db.dropCollection('reviewmetas');
  }
  console.log('Collection Review and ReviewMeta has been dropped...');

  // Create four asyncReaders
  const [reviews, photos, chars, charReviews] = fileNames.map(fileName => {
    return createReader('../../../data/' + fileName);
  });

  // Take reviews header and delete id, because we don't need auto_increment review id
  const reviewsHeader = await reviews.next();
  reviewsHeader.shift();

  // Skip column headers for other tables
  await photos.next(); await chars.next(); await charReviews.next();

  const start = new Date();
  let reviewBatch = [];
  let reviewBatchCount = 1;
  let reviewMetaBatch = [];
  let reviewMetaBatchCount = 1;
  let productId = 1;

  // Main loop, determinant is product_id
  mainLoop: while (true) {
    // Insert when review batch is full
    if (reviewBatch.length >= batchSize) {
      await Review.insertMany(reviewBatch);
      reviewBatch = [];
      console.log(`Review Batch No.${reviewBatchCount++} Inserted...`);
    }

    // Insert when review meta batch is full
    if (reviewMetaBatch.length >= batchSize) {
      await ReviewMeta.insertMany(reviewMetaBatch);
      reviewMetaBatch = [];
      console.log(`Review Meta batch No.${reviewMetaBatchCount++} Inserted...`);
    }

    // Get characteristics keys for current product_id;
    const charKeys = [];
    while (true) {
      const peek = await chars.peek();

      // If went past last row or the current product_id then stop looping
      if (!peek || peek[1] != productId) break;

      const next = await chars.next();
      charKeys.push(next[2]);
    }

    // Every product should have charKeys unless it reach past the last product
    if (!charKeys.length) {
      // There might be leftover in the batches
      await Review.insertMany(reviewBatch);
      await ReviewMeta.insertMany(reviewMetaBatch);
      console.log('Leftover Batches Inserted...');
      break mainLoop;
    }

    // Create meta document for the current product_id
    const metaDocument = {
      _id: productId,
      reviewCount: 0,
      ratings: new Map,
      recommend: {
        "true": 0,
        "false": 0
      },
      charSums: new Map(charKeys.map(key => [key, 0]))
    };

    // Make review documents inside this while loop, determinant is review_id
    // Meanwhile, updating review meta documents
    while (true) {
      const peek = await reviews.peek();

      // When all reviews for the current product_id is read, we continue to the next one
      if (!peek || peek[1] != productId) {
        productId += 1;
        // Also insert the review meta document to batch
        reviewMetaBatch.push(metaDocument);
        continue mainLoop;
      }

      // Create the Review Document
      const reviewsTuple = await reviews.next();
      const reviewId = reviewsTuple.shift();
      const document = createDocument(reviewsHeader, reviewsTuple);
      document.photos = [];

      // Insert photos
      while (true) {
        const peek = await photos.peek();

        if (!peek || peek[1] != reviewId) break;

        // Insert the photo urls corresponding to review_id
        const next = await photos.next();
        document.photos.push(next[2]);
      }

      const charValues = [];
      // Get charValues
      while (true) {
        const peek = await charReviews.peek();

        if (!peek || peek[2] != reviewId) break;

        const next = await charReviews.next();
        charValues.push(Number(next[3]));
      }

      // Create and insert chars key-value pairs
      document.chars = createDocument(charKeys, charValues);

      // Updating review meta document Count
      metaDocument.reviewCount += 1;

      // Updating review meta document ratings
      const ratingKey = String(document.rating);
      const ratingVal = metaDocument.ratings.get(ratingKey);
      if (ratingVal === undefined) metaDocument.ratings.set(ratingKey, 1);
      else metaDocument.ratings.set(ratingKey, ratingVal + 1);

      // Updating review meta document recommend
      if (document.recommend) metaDocument.recommend['true'] += 1;
      else metaDocument.recommend['false'] += 1;

      // Updating review meta document chars
      for (const char in document.chars) {
        const value = metaDocument.charSums.get(char);
        if (value === undefined) metaDocument.charSums.set(char, document.chars[char]);
        else metaDocument.charSums.set(char, document.chars[char] + value);
      }

      // After all insertion finished, insert the document into the batch
      reviewBatch.push(document);
    }
  }

  const end = new Date();
  await connection.close();
  // Return the total time used in minutes
  return ((end - start)/60_000).toFixed(2);
}

// Run the ETL
ETL()
  .then(time => {
    connection.close();
    console.log(`Finished, used ${time} minutes`);
  })
  .catch(console.log);