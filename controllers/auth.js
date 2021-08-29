const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const config = require('../configs/config.js');
const bcrypt = require('bcryptjs');

function authWithStrategy (accessToken, refreshToken, profile, done, connection){
    connection.query(`SELECT * FROM users WHERE name='${profile._json.name}' AND passwordHash='${accessToken}'`, function(err, users){
        if (err) return done(err, false);
        if (users[0]) return done(null, users[0]);
        connection.query(`INSERT INTO users (name, passwordHash) VALUES ('${profile._json.name}', '${accessToken}')`, function(err, res){
            if (err) {
                console.log(err)
                return done(err, false);
            }
            console.log(res)
            connection.query(`SELECT * FROM users WHERE name='${profile._json.name}' AND passwordHash='${accessToken}'`, function(err, res){
                if (err) return done(err, false);
                if (!res) return done(null, false);
                done(null, res[0]);
            })
        })
    });
};

function auth (connection){
    passport.use(new LocalStrategy({
        usernameField: "email",
        passReqToCallback: true
    },
        function(request, email, password, done){
            connection.query(`SELECT * FROM users WHERE email='${email}'`, function(err, users){
                if (err) return done(err);
                if (!users.length || !bcrypt.compareSync(password, users[0].passwordHash)) return done(null, false, {message: "loginErr"});
                if (users[0].status) return done(null, false, {message: "statusFalse"});
                return done(null, users[0]);
            });
        }
    ));
    
    passport.use(new FacebookStrategy(config.facebookConfig, (accessToken, refreshToken, profile, done) => authWithStrategy(accessToken, refreshToken, profile, done, connection)));

    passport.use(new GoogleStrategy(config.googleConfig, (accessToken, refreshToken, profile, done) => authWithStrategy(accessToken, refreshToken, profile, done, connection)));

    passport.serializeUser(function(user, done){
        done(null, user.id)
    });

    passport.deserializeUser(function(id, done){
        connection.query(`SELECT * FROM users WHERE id=${id}`, function(err, results){
            if(!results[0]) return done(err, false, {message: "loginErr"});
            if (results[0].status) return done(err, false, {message: "statusFalse"});
            done(err, results[0])
        });
    });
};

module.exports.auth = auth;