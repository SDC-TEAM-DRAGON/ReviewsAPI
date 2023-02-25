require('dotenv').config();
const express = require('express');
const path = require('path');
const Reviews = require('./model/index.js');
const axios = require('axios');


const app = express();
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use(express.json());

app.get('/reviews', (req, res) => {
  Reviews.find()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(err => {
      console.log(err.message);
      res.sendStatus(404);
    })
})

app.get('/reviews/meta', (req, res) => {
  Reviews.find()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(err => {
      console.log(err.message);
      res.sendStatus(404);
    })
})



app.post('/reviews', (req, res) => {
  let newReview = new Reviews(req.body);
  newReview.save()
  .then(() => {
    console.log('POST request received');
    res.sendStatus(200);
  })
  .catch(err => {
    console.log(err);
    res.sendStatus(404);
  });
});

app.put('/reviews/:review_id/helpful', (req, res) => {
  const { review_id } = req.params;
  // Reviews.updateOne({word: req.body.word}, {definition: req.body.definition})
  .then(() => {
    console.log('update info received', req.body);
    res.sendStatus(200);
  })
  .catch(err => {
    console.log(err);
    res.sendStatus(404);
  });
});

app.put('/reviews/:review_id/report', (req, res) => {
  const { review_id } = req.params;
  // Reviews.updateOne({word: req.body.word}, {definition: req.body.definition})
  .then(() => {
    console.log('update info received', req.body);
    res.sendStatus(200);
  })
  .catch(err => {
    console.log(err);
    res.sendStatus(404);
  });
});

app.listen(process.env.PORT);
console.log(`Listening at http://localhost:${process.env.PORT}`);
