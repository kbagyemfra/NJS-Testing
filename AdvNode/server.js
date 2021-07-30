'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

// You will need to set up the session settings now and initialize Passport. 
// Be sure to first create the variables 'session' and 'passport' 
// to require 'express-session' and 'passport' respectively.
const session = require('express-session');
const passport = require('passport');

const app = express();
// const ObjectID = require('mongodb').ObjectID;

// const LocalStrategy = require('passport-local');
// const bcrypt = require('bcrypt');

// Exporting the route and server file
const routes = require('./routes.js')
const auth = require('./auth.js');

const http = require('http').createServer(app)
const io = require('socket.io')(http)


// const { Socket } = require('dgram');
const cookieParser = require('cookie-parser');
const passportSocketIo = require("passport.socketio");

const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

app.set('view engine', 'pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUnintialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}))
app.use(passport.initialize())
app.use(passport.session())


// console.log(process.env.SESSION_SECRET)
// console.log(process.env.MONGO_URI)
// console.log(process.env.PORT)
// console.log(process.env.NODE_ENV)

// Now we will tell Socket.IO to use it and set the options
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
)

// Now we want to connect to our database 
// then start listening for requests. 
// The purpose of this is to not allow requests 
// before our database is connected or if there is a database error. 
// To accomplish this, you will want to encompass your serialization 
// and your app routes 


myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  // Module used for routes.js
  routes(app, myDataBase)

  // Module for auth.js
  auth(app, myDataBase)

  const currentUsers = 0;

  // Where we are listening for connections
  io.on('connection', (socket) => {

    // Within the connection listener
    ++currentUsers;
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    })

    socket.on('chat message', (message) => {
      io.emit('chat message', {
        name: socket.request.user.name, message
      })
    })

    console.log('A user has connected')

    socket.on('disconnect', () => {
      console.log('A User has Disconnected')
      --currentUsers
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: false
      })
    })
  })

}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' })
  })
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});

// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect('/')
// }

function onAuthorizeSuccess(data, accept) {
  console.log(' Successful connection to socket.io')

  accept(null, true)
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message)
  console.log('failed connection to socket.io: ', message)
  accept(null, false)
}