const express = require('express');
const config = require('./config.js')
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const MySQLStore = require('express-mysql-session')(session);

function appConfig(app, connection){
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));
    app.use(express.static(__dirname + "./../public"));
    app.use(session({
        secret: config.session_secret,
        cookie: {
            path: '/',
            httpOnly: true
        },
        store: new MySQLStore({}, connection.promise()),
        resave: false,
        saveUninitialized: false
    }));
    require('./../controllers/auth.js').auth(connection);
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
}

module.exports.appConfig = appConfig;