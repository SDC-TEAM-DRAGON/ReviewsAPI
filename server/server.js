//basic setup
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

//connect to db
async function connect () {
  try {
    await mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.DB_URI);
    console.log('db connected');
  } catch (err) {
    console.error(err.message);
  }
}
connect();

app.use


app.listen(3000, () => {
  console.log('server started')
})