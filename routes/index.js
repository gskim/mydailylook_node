var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var connection = mysql.createConnection({
    host    :'localhost',
    port : 3306,
    user : 'root',
    password : '',
    database:'mydailylook'
});
connection.connect(function(err) {
    if (err) {
        console.error('mysql connection error');
        console.error(err);
        throw err;
    }
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/device',function(req,res){
    var device = {'userno':1,
                'device_id':'qweqweqqq',
                'access_token':'asdasdasdqq',
                'visit_time' : 'now()',
                'push_id' : 'asdqweasdqqq'
                };
    var query = connection.query('insert into devices set ?',device,function(err,result){
        if (err) {
            console.error(err);
            throw err;
        }
        console.log(query);
        res.status(200).send('success')
    });
  });
router.post('/devices',function(req,res){
  var query = connection.query('select * from devices',function(err,rows){
      console.log(rows);
      res.json(rows);
  });
  console.log(query);
});



module.exports = router;
