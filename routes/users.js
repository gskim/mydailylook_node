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
router.post('/login' , function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  var loginType = req.body.loginType;
  var deviceId = req.body.deviceId;
  var access_token = randomString({length: 20}) + Date.now();
  var now = moment().format('YYYY-MM-DD HH:mm:ss');
  var code = 0;
  var nickname = 'unknown';
  console.log(deviceId);
  var query = connection.query(' SELECT id , nickname , password , email_yn , birth  FROM members WHERE email = ?  ' , email , function(err , result){
    if (err) {
      console.error(err);
      throw err;
    }
    if ( result.length > 0 ){
      //가입된 회원이 있음
      if ( result[0].password == password ){
        //비밀번호일치
        if ( result[0].email_yn == 'y' ){
          //이메일 인증한 회원
          if ( result[0].birth == '0000-00-00' ){
            //프로필 인증을 안한 회원
            code = 4;
          }else{
            // 프로필 인증까지 한 회원
            code = 1;
            nickname = result[0].nickname;
          }
        }else{
          //이메일 인증 안한 회원
          code = 5;
        }
      }else{
        //비밀번호 불일치
        code = 3;
      }
    }else{
      //가입된 회원이 없음
      code = 2;
    }
    if ( code == 4 || code == 1 || code == 5 ){
      var deviceData = {
        access_token : access_token
      };
      var deviceQuery = connection.query( ' UPDATE devices SET ? WHERE device_id = ? ' , [deviceData , deviceId] ,function(err , result){
        if(err){
          console.error(err);
          throw err;
        }

      })
    }


    var updateData = {
      login_time : now
    };
    var updateQuery = connection.query(' UPDATE members SET ? WHERE email = ?  ' , [updateData , email] , function(err , result){
      if (err){
        console.error(err);
        throw err;
      }
      res.json({
        code : code,
        nickname : nickname,
        accessToken : access_token
      });
    });
  });
});
router.post('/auto-login' , function(req , res){
  var accessToken = req.body.accessToken;
  var deviceId = req.body.deviceId;
  var code = 0;
  var nickname = 'unknown';
  console.log('deviceId : ' + deviceId);
  var access_token = randomString({length: 20}) + Date.now();
  var now = moment().format('YYYY-MM-DD HH:mm:ss');
      var memberQuery = connection.query( ' SELECT nickname , email_yn , birth FROM members WHERE id = ( SELECT userno FROM devices WHERE access_token = ? limit 1 ) '
       , accessToken
       , function(err , result2){
        if(err){
          console.error(err);
          throw err;
        }
        if (result2.length > 0){
        	console.log('length > 0  2');
          if( result2[0].email_yn == 'n' ){
            code = 5;
          }else{
            if(result2[0].birth == '0000-00-00' ){
              code = 4;
            }else{
              code = 1;
              nickname = result2[0].nickname;
            }
          }
        }else{
          code = 2;
        }
        var deviceData = {
		        access_token : access_token
		      };
      var deviceQuery = connection.query( ' UPDATE devices SET ? WHERE device_id = ? ' , [deviceData , deviceId] ,function(err , result){
        if(err){
          console.error(err);
          throw err;
        }

      });
      
    
    console.log('code : ' + code);
    console.log('nickname : ' + nickname);
    console.log('accesstoken : ' + accessToken );
    console.log('newaccesstoken : ' + access_token );
    res.json({
      code :code ,
      nickname : nickname,
      accessToken : access_token
    });
  });
	  

});




router.post('/join' , function(req , res) {
  var email = req.body.email;
  var password = req.body.password;
  var loginType = req.body.loginType;
  var deviceId = req.body.deviceId;
  var response = {};
  console.log('deviceId : ' + deviceId);
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
                      email_token : email_token,
                      nickname : deviceId
                    };
        var query = connection.query('INSERT INTO members SET ?', data, function(err, result) {
          if (err) throw err;
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
              html: '<b>클릭하시면 인증이 완료됩니다.</b> <a href="http://www.mydailylook.net:3000/user/auth?id='+email_token+'" > 인증하기 </a>' // html body
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
router.get('/auth' , function(req , res){
  var email_token = req.query.id;
  var query = connection.query(" SELECT id FROM members WHERE email_token =  ? " , email_token , function(err , result){
    if (err){
      console.error(err);
      throw err;
    }
    if ( result.length > 0 ){

      var updateQuery = connection.query(" UPDATE members SET email_yn = 'y' WHERE email_token = ? " , email_token , function(err , result){
        if(err){
          consloe.error(err);
          throw err;
        }else{
          res.render('authok', { title: 'mydailylook' });
        }
      });
    }else{
      res.render('authfail', { title: 'mydailylook' });
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

router.post('/profile' , function(req,res){
	var accessToken = req.body.accessToken;
	var type = req.body.type;
	var nickname = req.body.nickname;
	var birth = req.body.birth;
	var gender = req.body.gender;
	var height_max = req.body.height_max;
	var height_min = req.body.height_min;
	var weight_max = req.body.weight_max;
	var weight_min = req.body.weight_min;
	var foot_max = req.body.foot_max;
	var foot_min = req.body.foot_min;
	var height_permission = req.body.height_permission;
	var weight_permission = req.body.weight_permission;
	var foot_permission = req.body.foot_permission;
	console.log(accessToken);
	var description = req.body.description;
	var code = 2;
	console.log(type);
	var updateData = {
	        height_max : height_max,
	        height_min : height_min,
	        weight_max : weight_max,
	        weight_min : weight_min,
	        foot_max : foot_max,
	        foot_min : foot_min,
	        height_permission : height_permission,
	        weight_permission : weight_permission,
	        foot_permission : foot_permission
	      };
	console.log(updateData);
	if  ( type == 'new' ){
		updateData.nickname = nickname;
		updateData.birth = birth;
		updateData.gender = gender;
	}
	console.log(updateData);
	var query = connection.query(' UPDATE members SET ? WHERE id = ( SELECT userno FROM devices WHERE access_token = ? limit 1 ) ' , [updateData , accessToken] ,function(err , result){
		if(err){
			console.log(err)
			throw err;
		}else{
			code = 1;
		}
		res.json({
			code : code
		});
	});
});


module.exports = router;
