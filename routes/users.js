var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var connection = mysql.createConnection({
    host    :'localhost',
    port : 3306,
    user : 'root',
    password : 'rltjs500529',
    database:'mydailylook'
});
connection.connect(function(err) {
    if (err) {
        console.error('mysql connection error');
        console.error(err);
        throw err;
    }
});

/* GET users listing. */
router.get('/', function(req, res) {
  console.log("users");
  res.send('respond with a resource');
});

router.get('/a', function(req, res) {
  var query = connection.query('select * from devices',function(err,rows){
      console.log(rows);
      res.json(rows);
  });
});
router.get('/b', function(req, res) {
  var resultObj = new Object();
  resultObj['code'] = 1;
  var query = connection.query('select * from devices',function(err,rows){
      if (err) {
        console.log(err);

      }
      console.log(rows);
      resultObj['data'] = rows;
      res.send(resultObj);

  });
});

module.exports = router;
