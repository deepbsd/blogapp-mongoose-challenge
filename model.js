// Call the mongoose wrapper
const mongoose = require('mongoose');

// Set up the blogpostSchema...
const blogpostSchema = mongoose.Schema ({
  title: {type: String, required: true},
  content: {type: String},
  author: {
    // Had to fix this too...
    firstName: String,
    lastName: String
  },
  // Had to fix this...
  created: {type: Date, default: Date.now}
});

// Need this for the authorName value... (Got it right!!!)
blogpostSchema.virtual('authorName').get(function(){
  return `${this.author.firstName} ${this.author.lastName}`.trim()
});

// This apiRepr method will be used a lot
blogpostSchema.methods.apiRepr = function(){
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    created: this.created
  };
}

// And here's what we'll make available to server.js
const Blogpost = mongoose.model('Blogpost', blogpostSchema);

module.exports = {Blogpost};
