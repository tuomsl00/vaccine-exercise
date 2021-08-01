const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const app = express();

const mysql = require('mysql2/promise');

dotenv.config();
console.log(process.env.HOST);
const connection = mysql.createPool({
  host     : process.env.HOST,
  user     : process.env.USER,
  password : process.env.PASSWORD,
  database : process.env.DATABASE
});

app.use(cors());

var corsOptions = {
    origin: process.env.ORIGIN,
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.get('/', (req, res) => {
    return res.status(200).send('Ok.');
});

app.get('/orders-count', async (req, res) => {
    let orders = 0;
    try {
        let db = await connection;
        result = await db.query('SELECT COUNT(id) FROM Orders');
        orders = result[0][0]["COUNT(id)"];
    } catch(error) {
          return res.status(400).send(error);
    }
    
    return res.status(200).send({orders: orders});
});

app.get('/orders-per-producer/:producer', async (req, res) => {
    let producer = req.params.producer;
    let orders = 0;
    try {
        let db = await connection;
        result = await db.query('SELECT COUNT(id) FROM Orders WHERE vaccine=\''+producer+'\'');
        orders = result[0][0]["COUNT(id)"];
    } catch(error) {
          return res.status(400).send(error);
    }
    
    return res.status(200).send({orders: orders});
});

app.get('/vaccines-count', async (req, res) => {
    let vaccinations = 0;
    try {
        let db = await connection;
        result = await db.query('SELECT SUM(injections) FROM Orders');
        vaccinations = result[0][0]["SUM(injections)"];
    } catch(error) {
          return res.status(400).send(error);
    }
    
    return res.status(200).send({vaccinations: vaccinations});
});

app.get('/orders-arrived-on-date/:date', async (req, res) => {

    console.log(req.params.date);

    let dateParam = parseInt(req.params.date);
    let date = new Date(dateParam);

    if (date == 'Invalid Date') {
        return res.status(400).send({error: "Invalid date."});
    }

    date = date.toISOString();

    let ordersArrived = 0;
    try {
        
        let db = await connection;
        result = await db.query('SELECT COUNT(arrived) FROM Orders WHERE DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') >= DATE(\''+date+'\') AND DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(\''+date+'\', \'%Y-%m-%d %H:%i:%s\')');
        ordersArrived = result[0][0]["COUNT(arrived)"];
        
    //   console.log('SELECT COUNT(arrived) FROM Orders WHERE DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') >= DATE(\''+date1.toISOString()+'\') AND DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(\''+date1.toISOString()+'\', \'%Y-%m-%d %H:%i:%s\')');
    } catch(error) {
          return res.status(400).send(error);
    }    

    return res.status(200).send({ordersArrived: ordersArrived});
});

app.get('/expired-bottles/:date', async (req, res) => {

    const dateParam = parseInt(req.params.date);
    const offset = 3600*24*30*1000;
    let date = new Date(dateParam-offset); 
    if (date == 'Invalid Date') {
        return res.status(400).send({error: "Invalid date."});
    }

    console.log(date);
    date =  date.toISOString();
    let expiredCount = 0;
    try {        
        let db = await connection;
        result = await db.query('SELECT COUNT(arrived) FROM Orders WHERE DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') >= DATE(\''+date+'\') AND DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(\''+date+'\', \'%Y-%m-%d %H:%i:%s\')');
//        console.log('SELECT COUNT(arrived) FROM Orders WHERE DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') >= DATE(\''+date+'\') AND DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(\''+date+'\', \'%Y-%m-%d %H:%i:%s\')');
        expiredCount = result[0][0]["COUNT(arrived)"];
    } catch(error) {
          return res.status(400).send(error);
    } 

    return res.status(200).send({expiredCount: expiredCount});
});

app.get('/vaccines-will-expire/:date', async (req, res) => {

    const dateParam = parseInt(req.params.date);
    let days = 0;
    if (typeof req.query.days !== 'undefined') {
        if (isNaN(req.query.days)) {
            return res.status(400).send("Query parameter 'days' must be a number.");
        }
        days = parseInt(req.query.days);
    }
    const offset = 3600*24*30*1000;
    const daysf = 3600*24*(days+1)*1000;
    let date1 = new Date(dateParam-offset); 
    let date2 = new Date(dateParam-offset+daysf); 
    if (date1 == 'Invalid Date' || date2 == 'Invalid Date') {
        return res.status(400).send({error: "Invalid date."});
    }

    date1 =  date1.toISOString();
    date2 =  date2.toISOString();

    let expiredCount = 0;
    try {
                
        let db = await connection;
        result = await db.query('SELECT SUM(injections) FROM Orders WHERE DATE_FORMAT(\''+date1+'\', \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') AND DATE(\''+date2+'\') > DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\')');
     
//    console.log('SELECT SUM(injections) FROM Orders WHERE DATE_FORMAT(\''+date1+'\', \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\') AND DATE(\''+date2+'\') > DATE_FORMAT(arrived, \'%Y-%m-%d %H:%i:%s\')');
        expiredCount = result[0][0]["SUM(injections)"];
        if (!expiredCount) expiredCount = 0;
    } catch(error) {
          return res.status(400).send(error);
    }

    return res.status(200).send({quantity: !expiredCount?0:expiredCount});
});

app.get('/vaccines-used/:date', async (req, res) => {

    let dateParam = parseInt(req.params.date);
    let date = new Date(dateParam); 
    if (date == 'Invalid Date') {
        return res.status(400).send({error: "Invalid date."});
    }
    
    date = date.toISOString();

    let used = 0;
    try {
        let db = await connection;
        result = await db.query('SELECT COUNT(vaccinationDate) FROM Vaccinations WHERE DATE(\''+date+'\') < DATE_FORMAT(vaccinationDate, \'%Y-%m-%d %H:%i:%s\') AND DATE_FORMAT(vaccinationDate, \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(\''+date+'\', \'%Y-%m-%d %H:%i:%s\')');
        used = result[0][0]["COUNT(vaccinationDate)"];
    } catch(error) {
          return res.status(400).send(error);
    }

    return res.status(200).send({used: used})

});

app.get('/vaccines-used-by-date/:date', async (req, res) => {

    let dateParam = parseInt(req.params.date);
    let date = new Date(dateParam); 
    if (date == 'Invalid Date') {
        return res.status(400).send({error: "Invalid date."});
    }
    
    date = date.toISOString();

    let used = 0;
    try {
        let db = await connection;
        result = await db.query('SELECT COUNT(vaccinationDate) FROM Vaccinations WHERE DATE_FORMAT(vaccinationDate, \'%Y-%m-%d %H:%i:%s\') < DATE_FORMAT(\''+date+'\', \'%Y-%m-%d %H:%i:%s\')');
        used = result[0][0]["COUNT(vaccinationDate)"];
    } catch(error) {
          return res.status(400).send(error);
    }

    return res.status(200).send({used: used})

});

app.get('/expired-before-usage/:date', async (req, res) => {

    let dateParam = parseInt(req.params.date);
    let date1 = new Date(dateParam);
    const offset = 3600*24*30*1000; // 30 days
    let date2 = new Date(dateParam-offset); 
    if (date1 == 'Invalid Date' || date2 == 'Invalid Date') {
        return res.status(400).send({error: "Invalid date."});
    }

    date1 = date1.toISOString();
    date2 = date2.toISOString();

    let quantity = 0;
    try {
        
        let db = await connection;
        result = await db.query(`SELECT (
            SELECT SUM(injections) FROM Orders
            WHERE TIMESTAMPDIFF(SECOND, Orders.arrived, '`+date1+`') >= 3600*24*30
        ) - (
            SELECT count(Orders.arrived) FROM Orders
            JOIN Vaccinations ON Vaccinations.sourceBottle = Orders.id
            WHERE DATE_FORMAT(Orders.arrived, '%Y-%m-%d %H:%i:%s') < DATE_FORMAT('`+date2+`', '%Y-%m-%d %H:%i:%s')
        ) AS result`);
        quantity = result[0][0]["result"];
        
    } catch(error) {
          return res.status(400).send(error);
    }


    return res.status(200).send({quantity: quantity})

});

let port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('The application is listening on port '+port+'!');
});

module.exports = app;
