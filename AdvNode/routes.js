const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, myDataBase) {

    // Home Page Route 
    // Get Method
    app.route('/')
        .get((req, res) => {
            res.render(
                'pug', {
                title: 'Connected to Database',
                message: 'Please login',
                showLogin: true,
                showRegistration: true,
                showSocialAuth: true,
            });
        });

    // Login route
    app.route('/login')
        .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
            res.redirect('/profile')
        })

    // Logout route
    app.route('/logout')
        .get((req, res) => {
            req.logout()
            res.redirect('/')
        })

    // Profile route
    app.route('/profile')
        .get(ensureAuthenticated, (req, res) => {
            res.render('pug/profile',
                { username: req.user.username })
        })

    // Registration
    app.route('/register')
        .post((req, res, next) => {

            // saving a hash password
            const hash = bcrypt.hashSync(req.body.password, 12)
            myDataBase.findOne({ username: req.body.username },
                function (err, user) {
                    if (err) {
                        next(err)
                    } else if (user) {
                        res.redirect('/')
                    } else {
                        myDataBase.insertOne({
                            username: req.body.username,
                            password: hash,
                        },
                            (err, doc) => {
                                if (err) {
                                    res.redirect('/')
                                } else {
                                    // The inserted doc is held 
                                    // w/in the ops property of the doc
                                    next(null, doc.ops[0])
                                }
                            }
                        )
                    }

                })
        },
            passport.authenticate('local', { failureRedirect: '/' }),
            (req, res, next) => {
                res.redirect('/profile')
            }
        )

        // Authorization for github
        app.route('/auth/github')
        .get(passport.authenticate('github'))

        // Authorization callback
        app.route('/auth/github/callback')
        .get(passport.authenticate('github', { failureRedirect: '/' }),
         (req, res) => {
             req.session.user_id = req.user.id 
             res.redirect('/chat')
         })


         app.route('/chat')
         .get(ensureAuthenticated, (req, res) => {
             res.render('pug/chat', 
             { user: req.user })
         })

    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found')
    })
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/')
}