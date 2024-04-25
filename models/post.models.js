const mongoose = require('mongoose');

// Define the schema for the post
const postSchema = new mongoose.Schema({
  imageText: {
    type: String,
    required: true
  },
  image:{
    type: String
  },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Array,
    default: []
  }
});

// Create a Post model based on the schema
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
