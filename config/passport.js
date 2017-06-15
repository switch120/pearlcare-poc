// Importing Passport, strategies, and config
const passport = require('passport'),
    User = require('../models/user'),
    config = require('./main'),
    auth = require("../controllers/authentication"),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt,
    LocalStrategy = require('passport-local'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const localOptions = { usernameField: 'email' };

// Setting up local login strategy
const localLogin = new LocalStrategy(localOptions, function(email, password, done) {

    User.findOne({ email: email }, function(err, user) {
        if(err) { return done(err); }
        if(!user) { return done(null, false, { error: 'Your login details could not be verified. Please try again.' }); }

        user.comparePassword(password, function(err, isMatch) {
            if (err) { return done(err); }
            if (!isMatch) { return done(null, false, { error: "Your login details could not be verified. Please try again." }); }

            return done(null, user);
        });
    });
});

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: '/auth/google/callback',
    passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
    if (req.user) {
        User.findOne({ google: profile.id }, (err, existingUser) => {
            if (err) { return done(err); }
            if (existingUser) {
                req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
                done(err);
            } else {
                User.findById(req.user.id, (err, user) => {
                    if (err) { return done(err); }
                    user.google = profile.id;
                    user.tokens.push({ kind: 'google', accessToken });
                    user.profile.name = user.profile.name || profile.displayName;
                    user.profile.gender = user.profile.gender || profile._json.gender;
                    user.profile.picture = user.profile.picture || profile._json.image.url;
                    user.save((err) => {
                        req.flash('info', { msg: 'Google account has been linked.' });
                        done(err, user);
                    });
                });
            }
        });
    } else {
        User.findOne({ google: profile.id }, (err, existingUser) => {
            if (err) { return done(err); }
            if (existingUser) {
                return done(null, existingUser);
            }
            User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
                if (err) { return done(err); }
                if (existingEmailUser) {
                    req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
                    done(err);
                } else {
                    const user = new User();
                    user.email = profile.emails[0].value;
                    user.oauth.google = profile.id;
                    // does this token need to be saved with JWT?
                    // user.tokens.push({ kind: 'google', accessToken });
                    user.profile.name = profile.displayName;
                    user.profile.gender = profile._json.gender;
                    user.profile.picture = profile._json.image.url;
                    user.save((err) => {
                        done(err, user);
                    });
                }
            });
        });
    }
}));

const jwtOptions = {
    // Telling Passport to check authorization headers for JWT
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    // Telling Passport where to find the secret
    secretOrKey: config.secret
};

// Setting up JWT login strategy
const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {

    User.findById(payload.userID, function(err, user) {
        if (err) { return done(err, false); }

        if (user) {
            done(null, user);
        } else {
            done(null, false);
        }
    });
});

passport.use(jwtLogin);
passport.use(localLogin);