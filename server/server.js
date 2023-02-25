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
    await addReview(req.body);
    res.status(201).json({message: 'review posted'});
  } catch (err) {
    console.log(err.message);
    res.status(400).json({message: err.message});
  }
});

app.put('/reviews/:review_id/helpful', async (req, res) => {
  try {
    await helpful(req.params.review_id);
    res.status(204).json({message: 'helpful'});
  } catch (err) {
    console.log(err.message);
    res.status(400).json({message: err.message});
  }
});

app.put('/reviews/:review_id/report', async (req, res) => {
  try {
    await report(req.params.review_id);
    res.status(204).json({message: 'reported'});
  } catch (err) {
    console.log(err.message);
    res.status(400).json({message: err.message});
  }
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