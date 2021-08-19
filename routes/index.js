var express = require('express');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://shubhamp:Kumar@123@cluster0.n5lab.mongodb.net/test?retryWrites=true&w=majority";
var router = express.Router();
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
var nightUpdate = require('../dailyUpdate.js')

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
    nightUpdate(client);
});

module.exports = router;