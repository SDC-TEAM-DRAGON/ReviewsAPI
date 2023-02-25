//basic setup
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const {getReviews, getReviewMeta, addReview, helpful, report} = require('./model/index.js');

mongoose.set('strictQuery', false);
//connect to db
async function connect () {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('db connected');
  } catch (err) {
    console.error('db connection failed: ' + err.message);
  }
}

app.use(express.json());

//routes
app.get('/reviews', async (req, res) => {
  try {
    res.status(200).json(await getReviews(req.query));
  } catch (err) {
    console.log(err.message);
    res.status(400).json({message: err.message});
  }
});

app.get('/reviews/meta', async (req, res) => {
  try {
    res.status(200).json(await getReviewMeta(req.query));
  } catch (err) {
    console.log(err.message);
    res.status(400).json({message: err.message});
  }
});



app.post('/reviews',  async (req, res) => {
  try {
    const newReview = await Review.create(req.body);
    res.status(200).json(req.body);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({message: err.message});
  }
});

app.put('/reviews/:review_id/helpful', (req, res) => {
  res.send('put helpful');
});

app.put('/reviews/:review_id/report', (req, res) => {
  res.send('put report');
});


connect()
  .then(() => {
    app.listen(3000, () => {
      console.log('server started')
    })
  })
  .catch(err => {
    console.log('connection failed');
  })