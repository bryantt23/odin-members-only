const createError = require('http-errors');
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const User = require('./models/user');
const Secret = require('./models/secret');

const mongoDb = process.env.MONGODB_URI;
mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));

passport.use(
  new LocalStrategy(async (name, password, done) => {
    try {
      const user = await User.findOne({ name: name });
      if (!user) {
        return done(null, false, { message: 'Incorrect name' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', async (req, res) => {
  const users = await User.find({}).populate('secrets');
  const secrets = users.reduce((acc, user) => {
    return acc.concat(user.secrets);
  }, []);

  res.render('index', { user: req.user, secrets });
});

app.use('/users', usersRouter);

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/sign-up', (req, res) => res.render('sign-up-form'));
app.post(
  '/sign-up',
  [
    body('confirm_password').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        // if err, do something
        // otherwise, store hashedPassword in DB
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword
        });
        const result = await user.save();
        res.redirect('/');
      });
    } catch (err) {
      return next(err);
    }
  }
);

app.post(
  '/log-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/'
  })
);

app.get('/add-secret', (req, res) => res.render('add-secret'));
app.post('/add-secret', async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  }

  if (!req.user) {
    return res.status(401).send('User not authenticated');
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    // Create a new secret document
    const newSecret = new Secret({
      superhero: req.body.superhero,
      secretIdentity: req.body.secretIdentity
    });

    // Save the new secret
    const savedSecret = await newSecret.save();

    // Add the secret's ObjectId to the user's secrets array
    req.user.secrets.push(savedSecret._id);

    // Save the updated user
    await req.user.save();

    res.redirect('/');
  } catch (err) {
    return next(err);
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

module.exports = app;

/*TODO
models

user
name
username is email
password
isAdmin

secret
superhero
secret identity
author

create models

sign up form...

add isAdmin to model
create a user called admin
continue with step 5...



*/
