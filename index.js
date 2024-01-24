const express = require('express')
const path = require('path');
const hbs = require('hbs')
const flash = require('express-flash')
const session = require('express-session')
const router = require('./src/route')

const app = express()
const PORT = 5000

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src/views'))
app.use(flash())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
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
}))

app.use('/', router);

hbs.registerHelper("isReviewActive", (id, options) => {
    if(id == 1) {
        return options.fn(this)
    } else {
        return options.inverse(this)
    }
}) 

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});






