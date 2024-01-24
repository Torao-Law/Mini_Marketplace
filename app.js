const express = require('express');
const hbs = require('hbs');
const flash = require('express-flash');
const session = require('express-session');
const app = express();

app.set('view engine', 'hbs');
app.use(flash());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: false,
    secret: 'secretValue'
}));

module.exports = app;
