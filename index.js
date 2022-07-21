const express = require('express')
const hbs = require('hbs')

const app = express()
const PORT = 5000

const dbPool = require('./connection/index')
const { timeConverter } = require('./handle/timeConverter')
const { timeDistanceConverter } = require('./handle/timeDistanceConverter')

const isLogin = true

// set call hbs
app.set('view engine', 'hbs');

// set static folder in express
app.use(express.static('public'))

// set body parser
app.use(express.urlencoded({ extended: false }))

// endpoint get routing
app.get('/', (req, res) => {
    dbPool.connect((err, client, done) => {
        if (err) throw err
        let querySelect = 'SELECT * FROM tb_project37;'

        client.query(querySelect, (err, result) => {
            done()
            if (err) throw err
            let selectMapping = result.rows.map((item) => {
                return {
                    ...item,
                    distanceTime: timeDistanceConverter(item.startProject, item.endProject),
                    checkBoxs: item.checkTechProject
                }
            })

            res.render('index', { selectMapping })
        })
    })
})

app.get('/addProject', (req, res) => {
    if (!isLogin) {
        res.redirect('/')
    } else {
        res.render('addProject')
    }
})

app.get('/contact-me', (req, res) => {
    res.render('contact-me')
})

app.post('/addProject', (req, res) => {
    let getData = req.body

    // function manipulate array for checkbox selected
    function checkArray(arr) {
        if (!Array.isArray(arr)) {
            return arr = [arr]
        }
        return arr
    }

    dbPool.connect((err, client, done) => {
        if (err) throw err

        let insertData = `INSERT INTO public.tb_project37("titleProject", "bodyProject", "startProject", "endProject", "imgProject", "checkTechProject")
        VALUES ('${getData.titleProject}', '${getData.bodyProject}', '${getData.startProject}', '${getData.endProject}', 'SQL.png', ARRAY ['${checkArray(getData.checkboxs.join("', '"))}']);`

        client.query(insertData, (err, result) => {
            done()
            if (err) throw err

            res.redirect('/')
        })
    })
})

app.get('/detail-project/:id', (req, res) => {
    let id = req.params.id

    res.render('detail-project', { data: blogs[id] })
})

app.get('/edit-project/:id', (req, res) => {
    let id = req.params.id

    let toStringJS = (arr) => {
        return arr.toString(arr).split("-").reverse().join("-")
    }

    dbPool.connect((err, client, done) => {
        if (err) throw err
        let querySelect = `SELECT * FROM tb_project37 WHERE "idProject" = ${id};`

        client.query(querySelect, (err, result) => {
            done()
            if (err) throw err
            let selectMapping = result.rows.map((item) => {
                return {
                    ...item,
                    distanceTime: timeDistanceConverter(item.startProject, item.endProject),
                    checkBoxs: item.checkTechProject,
                    start_Project: toStringJS(timeConverter(item.startProject)),
                    end_Project: toStringJS(timeConverter(item.endProject))
                }
            })

            console.log(selectMapping);

            res.render('editProject', { data: selectMapping[0] })
        })
    })

})

app.post('/updateProject', (req, res) => {
    let data = req.body;

    dbPool.connect((err, client, done) => {
        if (err) throw err
        let queryUpdate = `UPDATE tb_project37
        SET "titleProject"='${data.titleProject}', "bodyProject"='${data.bodyProject}', "startProject"='${data.startProject}', "endProject"='${data.endProject}', "checkTechProject"= ARRAY ['${data.checkboxs.join("', '")}']
        WHERE "idProject"= '${data.idProject}';`
        client.query(queryUpdate, (err, result) => {
            done()
            if (err) throw err

            res.redirect('/')
        })
    })
})

// endpoint delete
app.get('/deleteProject/:index', (req, res) => {
    let id = req.params.index;

    dbPool.connect((err, client, done) => {
        if (err) throw err
        let queryDelete = `DELETE FROM tb_project37
        WHERE "idProject" = ${id};`

        client.query(queryDelete, (err, result) => {
            done()
            if (err) throw err

            res.redirect('/');
        })
    })
})

// hbs register show icon
hbs.registerHelper("icon", function (icon) {
    if (icon == "fa-brands fa-react") {
        return "React JS";
    } else if (icon == "fa-brands fa-node-js") {
        return "Node JS";
    } else if (icon == "fa-brands fa-vuejs") {
        return "Vue JS";
    } else if (icon == "fa-brands fa-angular") {
        return "Angular";
    }
});

hbs.registerHelper("isAngular", (isChecked) => {
    if (isChecked == "fa-brands fa-angular") {
        return "checked";
    }
})
hbs.registerHelper("isReact", (isChecked) => {
    if (isChecked == "fa-brands fa-react") {
        return "checked";
    }
})
hbs.registerHelper("isVue", (isChecked) => {
    if (isChecked == "fa-brands fa-vuejs") {
        return "checked";
    }
})
hbs.registerHelper("isNode", (isChecked) => {
    if (isChecked == "fa-brands fa-node-js") {
        return "checked";
    }
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})

