var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var moment = require('moment');
var authenticate = require("authenticate");
var connection = mysql.createConnection({
    host    :config.db_host,
    port : 3306,
    user : config.db_user,
    password : config.db_password,
    database: config.db_schema
});
connection.connect(function(err) {
    if (err) {
        console.error('mysql connection error');
        console.error(err);
        throw err;
    }
});
moment.locale('ko');
/* GET users listing. */
router.post('/join' , function(req , res) {
  
});



router.get('/a', function(req, res) {
  console.log("/aaa");
  var query = connection.query('select * from devices',function(err,rows){
      for (var i in rows) {
        if (rows.hasOwnProperty(i)) {
          rows[i].access_token = authenticate.serializeToken(config.client_id, rows[i].device_id ,config.extra_data);

          console.log( authenticate.deserializeToken( rows[i].access_token ) );
        }
      }

      res.json(rows);
  });
});
router.get('/b', function(req, res) {
  var resultObj = new Object();
  resultObj['code'] = 1;
  var query = connection.query('select * from devices',function(err,rows){
      if (err) {
        console.log(err);

      }else{
        console.log(rows);
        for (var i in rows) {
          if (rows.hasOwnProperty(i)) {
            console.log(i);
            console.log(rows[i].visit_time);
            rows[i].visit_time = moment(rows[i].visit_time).fromNow();
            console.log( moment(rows[i].visit_time).fromNow() );
          }
        }
        resultObj['data'] = rows;
        res.send(resultObj);
      }


  });
});

module.exports = router;
