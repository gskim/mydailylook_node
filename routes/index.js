var express = require('express');
var router = express.Router();
var config = require('../config.json');
var connection = require('../db.js');
var Promise = require('promise');
var transporter = require('../mail.js');

var mailOptions = {
    from: '"mydailylook" <mydailylook.args@gmail.com>', // sender address
    to: 'kiseon1987@gmail.com',
    subject: 'Hello ', // Subject line
    text: 'Hello world ', // plaintext body
    html: '<b>Hello world 🐴</b><a href="mydailylook.net" >aaa</a>' // html body
};
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

function sleep(ms){
  ts1 = new Date().getTime() + ms;
  do ts2 = new Date().getTime(); while (ts2<ts1);
}

function device(id){
  return new Promise(function(resolved , rejected){
    connection.query(' SELECT * FROM devices WHERE id = ? ' , id , function(err , result){
      if(err){
        rejected('aa');
      }else{
        resolved(result);
      }
    })
  })


}
function member(id){
  return new Promise(function(resolved , rejected){
    connection.query(' SELECT * FROM members WHERE id = ? ' , id , function(err , result){
      if(err){
        rejected('bb');
      }else{
        resolved(result);
      }
    })
  })

}
router.get('/a', function(req, res , next) {

  var code = 0;
  var email = '';
  var promise = device(1)
  .then(function(result){
    console.log(result);
    return member(result[0].id);
  })
  .then(function(result){
    console.log(result[0]);
    code = 1;
    email = result[0].email;

  })
  .catch(function(err){
    console.log('err : ' + err);
    code = 3;
    email = err;
  })
  .then(function(){
    res.json({
      code : code,
      email : email
    });
  })
});
router.get('/b' , function(req,res){
  connection.query('SELECT * from members where id = 1' , function(err , result , fields){
    console.log(result[0]);
    console.log(fields);
  });
  res.json({
    code : 1
  });
})



module.exports = router;
