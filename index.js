const express = require('express')
const hbs = require('hbs')
const flash = require('express-flash')
const session = require('express-session')
const dbPool = require('./connection/index')
const midtransClient = require('midtrans-client')

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

        data.transactionId = transactionResult[0].id
        
        if(!!transactionResult.length) {
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
    const { name, address, shipping, totalAmount } = req.query;

    dbPool.query(`INSERT INTO history_buyer (buyer, address, id_shipping, id_transaction) VALUES ('${name}','${address}','${shipping}','${id}')`, (error, resultBuyer, fields) => {
        if (error) throw error

        dbPool.query(`UPDATE transactions SET sub_amount='${totalAmount}' WHERE id=${id}`, (error, transactionUpdate, fields) => {
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
                    "full_name": `${name}`,
                    "address": `${address}`
                }
            };
            
            snap.createTransaction(parameter)
                .then((transaction)=>{
                    // transaction token
                    let transactionToken = transaction;
                    // console.log('transactionToken:',transactionToken);

                    res.redirect(transaction.redirect_url);
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

