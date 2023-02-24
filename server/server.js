const express = require('express');
const mongoose = require('mongoose');
const app = express();

const uri = 'mongodb://127.0.0.1:27017/SDC';

async function connect () {
  try {
    await mongoose.connect(uri);
    console.log('db connected');
  } catch (err) {
    console.error(err.message);
  }
}
connect();








app.listen(3000, () => {
  console.log('server started')
})