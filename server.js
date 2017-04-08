const bodyParser = require('body-parser');
const express = require('express');
// I had taken out morgan.  I put it back in...
const morgan = require('morgan');
const mongoose = require('mongoose');



const {PORT, DATABASE_URL} = require('./config');
const {Blogpost} = require('./model');


const app = express();
app.use(bodyParser.json());
app.use(morgan('common'));

mongoose.Promise = global.Promise;


// Here's the basic endpoint
app.get('/posts', (req, res) => {
  Blogpost
    .find()
    .limit(10)
    .exec()
    // good idea to name them posts instead of blogposts
    .then(posts => {
      res.json(posts.map(post => post.apiRepr())
        );
      })
      .catch(
        err => {
          console.error(err);
          res.status(500).json({message: 'Internal server error'});
      });
});

app.get('/posts/:id', (req, res) => {
  Blogpost
    .findById(req.params.id)
    .exec()
    .then(post => res.json(post.apiRepr()))
    .catch(err => {
      console.error(err);
        res.status(500).json({message: 'Internal server error'})
    });
});

app.post('/posts', (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Blogpost
    .create({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author
    })
    .then(
      blogpost => res.status(201).json(blogpost.apiRepr())
    )
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});


app.put('/posts/:id', (req,res) => {
  // I still don't understand the line from the text that goes here.
  // This makes more sense to me.  We'll see if it works...
  if (req.params.id !== req.body.id) {
    const message = (
      `Request path id (${req.params.id}) and request body id `+
      `(${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'firstName', 'content', 'author'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Blogpost
    // First time I've seen the {new: true} before...
    .findByIdAndUpdate(req.params.id, {$set: toUpdate}, {new: true})
    .exec()
    .then(blogpost => res.status(201).json(blogpost.apiRepr()))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/posts/:id', (req, res) => {
  Blogpost
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => { res.status(204).json({message: 'Post sucessfully deleted'});
    })
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});


let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}


if (require.main === module) {
	runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
