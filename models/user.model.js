const mongoose = require('mongoose');
const plm = require('passport-local-mongoose')

// Define the schema for the user
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post' // Assuming you have a Post model
  }],
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: {
    type: String // This will store the filename of the uploaded profile picture
  },
  fullname: {
    type: String,
    required: true
  }
});

userSchema.plugin(plm)

// Create a User model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
