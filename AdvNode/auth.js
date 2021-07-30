const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;
const GitHubStrategy = require('passport-github').Strategy;
// require('dotenv').config();


module.exports = function (app, myDataBase) {


  // Serialization
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // DeSerialization
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
    done(null, doc);
    });
  });

  // Below is defining the process to use when 
  // we try to authenticate someone locally. 

  passport.use(new LocalStrategy(
    function (username, password, done) {

      // First, it tries to find a user in our database with the username entered
      myDataBase.findOne(
        { username: username },
        function (err, user) {
          // console.log('User' + username + ' attempted to log in.')
          // If theres an error 
          if (err) { return done(err) }
          // If there is no user
          if (!user) { return done(null, false) }
          // If the password does not match
          if (!bcrypt.compareSync(password, user.password)) { return done(null, false) }

          // If all passes it returns a user
          return done(null, user)
        })
    }
  ))

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/github/callback'
  },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile)

      // Database Logic
      myDataBase.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, new: true },
        (err, doc) => {
          return cb(null, doc.value)
        }
      )
    })
  )

}
