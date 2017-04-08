// Call the mongoose wrapper
const mongoose = require('mongoose');

// Set up the blogpostSchema...
const blogpostSchema = mongoose.Schema ({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {
    // Not sure if I have this right yet...
    firstName: {type: String, required: true},
    lastName: {type: String, required: true}
  },
  // And this might be wrong...
  created: Date
});

// Need this for the authorName value...
blogpostSchema.virtual('authorName').get(function(){
  return `${this.author.firstName} ${this.author.lastName}`.trim()
});

// This apiRepr method will be used a lot
blogpostSchema.methods.apiRepr = function(){
  return {
    id: this.id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    created: this.created
  };
}

// And here's what we'll make available to server.js
const Blogpost = mongoose.model('Blogpost', blogpostSchema);
