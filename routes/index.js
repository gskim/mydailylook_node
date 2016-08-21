var express = require('express');
var router = express.Router();
var mysql = require('mysql');

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
/* GET home page. */
router.get('/', function(req, res, next) {
  transporter.sendMail(mailOptions , function(error , info){
    if (error){
      console.log(error);
    }else{
      console.log(info);
    }
  });
  res.render('index', { title: 'mydailylook' });
});





module.exports = router;
