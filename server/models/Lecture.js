const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: String,
  subject: String,
  faculty: String,
  type: String, // video | pdf | ppt
  url: String,
  date: Date,
  course: String
});

module.exports = mongoose.model('Lecture', lectureSchema);
