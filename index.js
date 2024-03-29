const express = require('express')
const hbs = require('hbs')
const flash = require('express-flash')
const session = require('express-session')
const dbPool = require('./connection/index')
const midtransClient = require('midtrans-client')
const nodemailer = require('nodemailer')

const app = express()
const PORT = 5000

app.set('view engine', 'hbs');
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

app.get('/', (req, res) => {
    let data = {};

    dbPool.query("SELECT * FROM reviews", (error, result, fields) => {
        if (error) throw error;

        data.reviews = result;

        dbPool.query("SELECT * FROM transactions WHERE status = 'pending'", (error, transactionResult, fields) => {
            if(!!transactionResult.length) {
                dbPool.query(`SELECT * FROM charts WHERE id_transaction = ${transactionResult[0].id}`, (error, chartResult, fields) => {
                    data.chartLength = chartResult.length
                    res.render('index', { data }); 
                })
            } else {
                res.render('index', { data });
            }
        })        
    });
});


app.get('/transaction', (req, res) => {
    const data = {}
    dbPool.query("SELECT * FROM transactions WHERE status = 'pending'", (error, transactionResult, fields) => {
        if (error) throw error;

        
        if(!!transactionResult.length) {
            data.transactionId = transactionResult[0].id
            dbPool.query(`SELECT charts.id, qty, charts.price, products.title AS title, products.image AS image FROM charts LEFT JOIN products ON charts.id_product = products.id WHERE id_transaction = ${transactionResult[0].id}`, (error, chartResult, fields) => {
                if (error) throw error;

                const plainObjects = chartResult.map(rowDataPacket => ({ 
                    ...rowDataPacket,
                    sub_amount: rowDataPacket.price * rowDataPacket.qty
                }));
                
                data.chart = plainObjects
                data.chartLength = chartResult.length
                data.total_amount = plainObjects.reduce((accumulator, currentValue) => accumulator + currentValue.sub_amount, 0);

                dbPool.query("SELECT * FROM shipping", (error, shippingResult, fields) => {
                    if (error) throw error;
                    
                    data.listShipping = shippingResult.map(data => ({ ...data }))

                    res.render('transaction', { data }); 
                })
            })
        } else {
            res.render('transaction')
        }
    })  
})


app.get('/products', (req, res) => {
    let data = {};

    dbPool.query("SELECT * FROM products;", (error, result, fields) => {
        if (error) throw error;

        data.products = result;

        dbPool.query("SELECT * FROM transactions WHERE status = 'pending'", (error, transactionResult, fields) => {
            if(!!transactionResult.length) {
                dbPool.query(`SELECT * FROM charts WHERE id_transaction = ${transactionResult[0].id}`, (error, chartResult, fields) => {
                    data.chartLength = chartResult.length
                    res.render('products', { data })
                })
            } else {
                res.render('products', { data })
            }
        })        
    });
})


app.post("/add-cart/:id", (req, res) => {
    const { id } = req.params;

    dbPool.query(`SELECT * FROM products WHERE id=${id}`, (error, result, fields) => {
        if (error) throw error;

        const productData = {
            idProduct: result[0].id,
            qty: 1,
            price: result[0].price
        };

        dbPool.query("SELECT * FROM transactions WHERE status = 'pending'", (error, transactionResult, fields) => {
            if (error) throw error;

            if (transactionResult.length === 0) {
                dbPool.query("INSERT INTO transactions (status) VALUES ('pending')", (error, insertResult, fields) => {
                    if (error) throw error;

                    const transactionId = insertResult.insertId;

                    dbPool.query(`INSERT INTO charts (id_product, qty, price, id_transaction) VALUES (${productData.idProduct},${productData.qty},${productData.price},${transactionId})`, (error, insertChartResult, fields) => {
                        if (error) throw error;

                        req.flash('success', `Product ${result[0].title} successfully added`)
                        res.redirect('/products');
                    });
                });
            } else {
                    dbPool.query(`SELECT * FROM charts WHERE id_product=${productData.idProduct} AND id_transaction=${transactionResult[0].id}`, (error, chartResult, fields) => {
                    if (error) throw error;

                    if (chartResult.length === 0) {
                        const queryInsert = `INSERT INTO charts (id_product, qty, price, id_transaction) VALUES (${productData.idProduct},${productData.qty},${productData.price},${transactionResult[0].id})`;

                        dbPool.query(queryInsert, (error, insertChartResult, fields) => {
                            if (error) throw error;

                            req.flash('success', `Product ${result[0].title} successfully added`);
                            res.redirect('/products');
                        });
                    } else {
                        const existingQty = chartResult[0].qty;
                        const updatedQty = existingQty + productData.qty;

                        dbPool.query(`UPDATE charts SET qty=${updatedQty} WHERE id=${chartResult[0].id}`, (error, updateResult, fields) => {
                            if (error) throw error;

                            req.flash('success', `Product ${result[0].title} quantity updated`);
                            res.redirect('/products');
                        });
                    }
                });
            }
        });
    });
});

app.get('/checkout/:id', (req, res) => {
    const { id } = req.params
    const { name, buyer_mail, address, shipping, totalAmount } = req.query;

    console.log(shipping)

    dbPool.query(`INSERT INTO history_buyer (buyer, address, id_shipping, id_transaction) VALUES ('${name}','${address}','${shipping}','${id}')`, (error, resultBuyer, fields) => {
        if (error) throw error

        dbPool.query(`UPDATE transactions SET sub_amount='${totalAmount}' WHERE id=${id}`, (error, transactionUpdate, fields) => {
            if (error) throw error

            dbPool.query(`SELECT charts.id, qty, charts.price, products.title AS title, products.image AS image FROM charts LEFT JOIN products ON charts.id_product = products.id WHERE id_transaction = ${id}`, (error, findCharts, fields) => {
                if (error) throw error            
                  
                let snap = new midtransClient.Snap({
                    isProduction: false,
                    serverKey: "SB-Mid-server-AZrC2CaRU0L3R3vvYEMaf30h"
                })

                let parameter = {
                    "transaction_details": {
                        "order_id": `${id}`,
                        "gross_amount": totalAmount
                    },
                    "credit_card":{
                        "secure" : true
                    },
                    "customer_details": {
                        "first_name": `${name}`,
                        "email": `${buyer_mail}`,
                        "address": `${address}`,
                    }
                };


                snap.createTransaction(parameter)
                .then((transaction) => {
                    dbPool.query(`UPDATE transactions SET status='SUCCESS' WHERE id=${id}`, (error, transactionStatus, fields) => {
                        if (error) throw error
                      
                        const obj = findCharts.map(row => {
                            return {
                                title: row.title,
                                qty: row.qty,
                                price: row.price,
                                image: row.image,
                                sub_amount: row.qty * row.price
                            }
                        })

                        const findSubAmount = obj.reduce((prev, current) => prev + current.sub_amount, 0)
                        const data = {
                            chart: obj,
                            totalAmount: findSubAmount
                        }

                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'dandisyahrullah.12@gmail.com',
                                pass: 'xtko xvxy uaiv etdr'
                            }
                        });                        
                          
                        const listItems = data.chart.map((detail) => `
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex my-3 align-items-center">
                                    <div style="height: 6rem;">
                                        <img src="${detail.image}" class="card-img-top"  style="height: 100%;" alt="img-product">
                                    </div>
                                    <div class="ms-3">
                                        <p class="m-0 fw-bold fs-5 text-success">${detail.title}</p>
                                        <p class="m-0 text-danger fw-light">Rp.${detail.price}</p>
                                        <p class="m-0">QTY : ${detail.qty}</p>
                                        <p class="fw-bold text-danger">Rp. ${detail.sub_amount}</p>
                                    </div>
                                </div>
                            </div>`
                        );
        
                        const mailOptions = {
                            from: 'dandisyahrullah.12@gmail.com',
                            to: buyer_mail,
                            subject: 'Payment Successful',
                            html: `
                                <!DOCTYPE html>
                                <html lang="en">
                                <head>
                                <meta charset="UTF-8" />
                                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                <title>Document</title>
                                <style>
                                    h1 {
                                    color: brown;
                                    }
                                </style>
                                </head>
                                <body>
                                <h2>Product payment :</h2>
    
                                <p>Thank you for shopping, your item will be processed soon. your receipt number ${id}</p>
                                ${listItems.join('')}
                                <hr />
                                <p>Rp. ${data.totalAmount}</p>
                                </body>
                                </html>
                            `,
                        };
                        
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                                
                                res.redirect(transaction.redirect_url);
                            }
                        })
                    })             
                })
            })
        })
    })
});


app.post('/notifications', (req, res) => {
    const notificationsData = req.body

    console.log(notificationsData)
    res.json({ received: true })
})

app.get('/delete-chart/:id', (req, res) => {
    const { id } = req.params

    dbPool.query(`DELETE FROM charts WHERE id = ${id}`, (error, chartResult, fields) => {
        req.flash('success', `Product success delete`);
        res.redirect('/transaction')
    })
})

hbs.registerHelper("isReviewActive", (id, options) => {
    if(id == 1) {
        return options.fn(this)
    } else {
        return options.inverse(this)
    }
}) 

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})

