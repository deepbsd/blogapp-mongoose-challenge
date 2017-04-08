const bodyParser = require('body-parser');
const express = require('express');




const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


const {PORT, DATABASE_URL} = require('./config');
const {Blogpost} = require('./model');


const app = express();
app.use(bodyParser.json());


// Here's the basic endpoint
app.get('/posts', (req, res) => {
  Blogpost
    .find()
    .limit(10)
    .exec()
    .then(blogposts => {
      res.json({
        blogposts: blogposts.map(
          (blogpost) => blogpost.apiRepr())
        });
      })
      .catch(
        err => {
          console.error(err);
          res.status(500).json({message: 'Internal server error'});
      });
});

app.get('/posts/:id', (req, res) => {
  Blogpost
    .findById(req.paramas.id)
    .exec()
    .then(blogpost => res.json(blogpost.apiRepr()))
    .catch(err => {
      console.error(err);
        res.status(500).json({message: 'Internal server error'})
    });
});

app.post('/posts', (req, res) => {
  const requiredFields = ['title', 'firstName', 'lastName', 'content'];
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
      firstName: req.body.author.firstName,
      lastName: req.body.author.lastName,
      content: req.body.content
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
  if (req.params.id !== req.body.id) {
    const message = (
      `Request path id (${req.params.id}) and request body id `+
      `(${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'firstName', 'lastName', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Blogpost
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .exec()
    .then(blogpost => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/posts/:id', (req, res) => {
  Blogpost
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(restaurant => res.status(204).end())
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
