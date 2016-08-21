var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var moment = require('moment');
var authenticate = require("authenticate");
var randomString = require('random-string');
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
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service : 'Gmail',
  auth : {
    user : 'mydailylook.args@gmail.com',
    pass : 'k4903198'
  }
});

var mailOptions = {
    from: '"mydailylook" <mydailylook.args@gmail.com>', // sender address
    to: 'kiseon1987@gmail.com',
    subject: 'Hello ', // Subject line
    text: 'Hello world ', // plaintext body
    html: '<b>Hello world 🐴</b><a href="mydailylook.net" >aaa</a>' // html body
};


moment.locale('ko');
/* GET users listing. */
router.post('/join' , function(req , res) {
  var email = req.body.email;
  var password = req.body.password;
  var loginType = req.body.loginType;
  var deviceId = req.body.deviceId;
  var response = {};
  //var isDuplicated = duplicationCheck(email);
  //console.log(isDuplicated);
  var dupQuery = connection.query(' SELECT id FROM members WHERE email = ? ', email , function(err , result){
    if (err) {
      console.log(err);
      throw err;
    }

    if (result.length > 0) {
      //중복된 이메일
      response.code = 2;
      response.msg = '이미등록된 이메일입니다.';
      response.data = 'duplicate';
      res.json(response);
    } else{
      if (loginType == 'normal') {
        var now = moment().format('YYYY-MM-DD HH:mm:ss');
        var email_token = authenticate.serializeToken(config.client_id, email ,config.extra_data);
        var data  = {
                      email:email,
                      password: password,
                      regdate : now,
                      login_time : now,
                      login_type : loginType,
                      email_token : email_token
                    };
        var query = connection.query('INSERT INTO members SET ?', data, function(err, result) {
          if (err) throw err;
          console.log(query);
          console.log(result);
          var access_token = randomString({length: 20}) + Date.now();
          var updateData = {
            access_token : access_token,
            userno : result.insertId
          };
          var updateQuery = connection.query('UPDATE devices SET ? WHERE device_id = ? ' , [updateData , deviceId] , function(err , updateResult){
            if (err) throw err;
            transporter.sendMail({
              from: '"mydailylook" <mydailylook.args@gmail.com>', // sender address
              to: data.email,
              subject: '마이데일리룩 가입을 환영합니다. ', // Subject line
              text: '안녕하세요 ', // plaintext body
              html: '<b>클릭하시면 인증이 완료됩니다.</b> <a href="mydailylook.net" > 인증하기 </a>' + email_token // html body
            } , function(error , info){
              if (error){
                console.log(error);
              }else{
                console.log(info);
              }
            });
            res.json({
              code : 1,
              data : 'success',
              accessToken : access_token,
              msg : '가입성공'
            });
          });
        });
      };
    }
  });
});
function duplicationCheck(email) {
  var query = connection.query(' SELECT id FROM members WHERE email = ? ', email , function(err , result){
    if (err) {
      console.log(err);
      throw err;
    }
    console.log("query : " + query);
    console.log("dupl : " + result);
    console.log(result.length);
    return result.length;
  });
}


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
