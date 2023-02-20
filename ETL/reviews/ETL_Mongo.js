// Import required packages
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Review, disconnect } = require('./Mongo_schema.js');
const { AsyncReader } = require('./AsyncReader.js');

// Zip column headers and row tuples into a JavaScript object(document in MongoDB)
function createDocument(keys, values) {
  const document = keys.reduce((obj, key, index) => {
    return { ...obj, [key]: values[index] };
  }, {});

  return { ...document, photos: [], char_values: [] };
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
async function ETL(batchSize = 5000) {
  // Create four asyncReaders
  const [reviews, photos, chars, charReviews] = fileNames.map(fileName => {
    return createReader('../../data/' + fileName);
  });

  // Take reviews column headers and overwrite "id" as "_id"
  const reviewsHeader = await reviews.next();
  reviewsHeader[0] = '_id';

  // Skip column headers for other tables
  await photos.next(); await chars.next(); await charReviews.next();

  const start = new Date();
  const batch = [];
  let productId = batchCount = 1;

  // Main loop, determinant is product_id
  mainLoop: while (true) {
    // Insert when batch is full(reaches batchSize)
    if (batch.length >= batchSize) {
      await Review.insertMany(batch);
      batch.length = 0;
      console.log(`Batch No.${batchCount++} Inserted...`);
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
      // There might be leftover in the batch
      await Review.insertMany(batch);
      break mainLoop;
    }

    // Make document inside this while loop, determinant is review_id
    while (true) {
      const peek = await reviews.peek();

      // When all reviews for the current product_id is read, we continue to the next one
      if (!peek || peek[1] != productId) {
        productId += 1;
        continue mainLoop;
      }

      // Create the Review Document
      const reviewsTuple = await reviews.next();
      const document = createDocument(reviewsHeader, reviewsTuple);

      // Insert char_keys
      document.char_keys = [ ...charKeys ];

      // Insert photos
      while (true) {
        const peek = await photos.peek();

        if (!peek || peek[1] != document._id) break;

        // Insert the photo urls corresponding to review_id
        const next = await photos.next();
        document.photos.push(next[2]);
      }

      // Insert char_values
      while (true) {
        const peek = await charReviews.peek();

        if (!peek || peek[2] != document._id) break;

        const next = await charReviews.next();
        document.char_values.push(next[3]);
      }

      // After all insertion finished, insert the document into the batch
      batch.push(document);
    }
  }

  // Return the total time used in seconds
  return Math.floor((new Date() - start)/1000);
}

// Run the ETL
ETL()
  .then(time => {
    disconnect();
    console.log(`Finished, used ${time} seconds`);
  })
  .catch(console.log);