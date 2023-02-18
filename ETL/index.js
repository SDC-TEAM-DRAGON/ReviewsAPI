const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const dotenvPath = path.join(__dirname, '../.env');
require('dotenv').config({path: dotenvPath});

const loadData = `
  LOAD DATA LOCAL
  INFILE ?
  INTO TABLE ??
  FIELDS TERMINATED BY ','
  LINES TERMINATED BY '\n'
  IGNORE 1 LINES;
`;
const tableNames = ['characteristis'];

async function ETL () {
  //create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_DATABASE || 'sdc',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  const startTime = new Date();
  // create tables
  await connection.query(`
    DROP TABLE IF EXISTS reviews;
    CREATE TABLE reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT,
      rating TINYINT,
      date INT,
      summary TEXT,
      body TEXT,
      recommend BOOLEAN DEFAULT 0,
      reported BOOLEAN DEFAULT 0,
      reviewer_name TEXT,
      reviewer_email TEXT,
      response TEXT,
      helpfulness INT
  )`);

  await connection.query(`
    DROP TABLE IF EXISTS reviews_photos;
    CREATE TABLE reviews_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      review_id INT NOT NULL,
      url TEXT NOT NULL
    );
  `);

  await connection.query(`
    DROP TABLE IF EXISTS characteristics;
    CREATE TABLE characteristics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      name TEXT NOT NULL
    );
  `);

  await connection.query(`
    DROP TABLE IF EXISTS characteristic_reviews;
    CREATE TABLE characteristic_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      characteristic_id INT NOT NULL,
      review_id INT NOT NULL,
      value INT NOT NULL
    );
  `);

  // allow client to read file from localfile system
  await connection.query('SET GLOBAL local_infile=1');

  // parsing all csv file into readeables
  await Promise.all(tableNames.map(tableName => {
    const tablePath = path.join(__dirname, '../data/' + tableName + '.csv');
    return connection.query({
      sql: loadData,
      values: [tablePath, tableName],
      infileStreamFactory: () => fs.createReadStream(tablePath)
    });
  }));

  //dont allow to read file from localfile system after done reading
  await connection.query(`SET GLOBAL local_infile=0`);

  return Math.floor((new Date() - startTime) / 1000);
}

ETL()
  .then((time) => {
    console.log(`finished in ${time} seconds`)
    connection.end();
  })
  .catch(err => {
    console.log(err.message);
  })