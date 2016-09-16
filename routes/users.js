var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var connection = require('../db.js');
var Promise = require('promise');
var moment = require('moment');
var authenticate = require("authenticate");
var randomString = require('random-string');
var transporter = require('../mail.js');
moment.locale('ko');
function deviceUpdate(data , deviceId){
  return new Promise(function(resolved , rejected){
    connection.query( ' UPDATE devices SET ? WHERE device_id = ? ' , [data , deviceId] ,function(err , result){
      if (err) rejected(err);
      resolved(result);
    });
  });
}
function memberUpdate(data , email){
  return new Promise(function(resolved , rejected){
    connection.query(' UPDATE members SET ? WHERE email = ?  ' , [data , email] , function(err , result){
      if (err) rejected(err);
      resolved(result);
    });
  });
}
function userSelectFromId(id){
  return new Promise(function(resolved , rejected){
    connection.query( ' SELECT * FROM members WHERE id = ? ', id, function(err , result){
      if (err) rejected(err);
      resolved(result);
    })
  });
}
function memberInsert(data){
  return new Promise(function(resolved , rejected){
    connection.query('INSERT INTO members SET ?', data, function(err, result) {
      if(err) rejected(err);
      resolved(result);
    })
  });
}
function userSelectFromToken(accessToken , deviceId){
  return new Promise(function(resolved , rejected){
    connection.query(' SELECT * FROM devices WHERE access_token = ? AND device_id = ? ' , [ accessToken , deviceId ] , function(err , result){
      if (err) rejected(err);
      if( result.length > 0 ){
        connection.query(' SELECT * FROM members WHERE id = ? ' , result[0].userno , function(err , result){
          if (err) rejected(err);
          resolved(result[0]);
        })
      }else{
        resolved({
          id : 0
        })
      }
    })
  })
}
function emailSend(email , email_token){
  transporter.sendMail({
    from: '"mydailylook" <mydailylook.args@gmail.com>', // 발신자 표기
    to: email, // 수신자
    subject: '마이데일리룩 가입을 환영합니다. ', // 메일제목
    text: '안녕하세요 ', // 일반텍스트 본문
    html: '<b>클릭하시면 인증이 완료됩니다.</b> <a href="http://www.mydailylook.net:3000/user/auth?id='+email_token+'" > 인증하기 </a>' // 본문html
  } , function(error , info){
    if (error){
      console.error(error);
    }else{
      console.log(info);
    }
  });
}
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
  var promise = new Promise(function(resolved , rejected){
    connection.query(' SELECT id , nickname , password , email_yn , birth  FROM members WHERE email = ?  ' , email , function(err , result){
      if(err) rejected(err);
      resolved(result);
    });
  }).then(function(result){
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
      var data = {
        access_token : access_token,
        userno : result[0].id
      };
      return deviceUpdate(data , deviceId);
    }
  }).then(function(result){
    var data = {
      login_time : now
    };
    return memberUpdate(data , email)
  }).catch(function(err){
    console.log(err);
  }).then(function(){
    res.json({
      code : code,
      nickname : nickname,
      accessToken : access_token
    });
  });
});
router.post('/auto-login' , function(req , res){
  var accessToken = req.body.accessToken;
  var deviceId = req.body.deviceId;
  var code = 0;
  var nickname = 'unknown';
  var email = '';
  console.log('deviceId : ' + deviceId);
  var access_token = randomString({length: 20}) + Date.now();
  var now = moment().format('YYYY-MM-DD HH:mm:ss');
  var promise = new Promise(function(resolved , rejected){
    connection.query( ' SELECT userno FROM devices WHERE access_token = ? AND device_id = ? limit 1 ', [ accessToken , deviceId ] , function(err , result){
      if (err) rejected(err);
      console.log(result);
      resolved(result);
    });
  }).then(function(result){
    if ( result.length > 0 ){
      return userSelectFromId(result[0].userno);
    }else{
      code = 2;
    }
  }).then(function(result){
    if ( result[0].email_yn == 'n' ){
      code = 5
    }else{
      if(result[0].birth == '0000-00-00' ){
        code = 4;
      }else{
        code = 1;
        nickname = result[0].nickname;
      }
    }
    email = result[0].email;
    var data = {
      access_token : access_token,
      userno : result[0].id
    };
    return deviceUpdate(data , deviceId);
  }).then(function(result){
    var data = {
      login_time : now
    };
    return memberUpdate(data , email)
  }).catch(function(err){
    console.log(err);
  }).then(function(){
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
  var code = 0;
  var msg = '';
  var data = '';
  var access_token = randomString({length: 20}) + Date.now();
  var email_token = authenticate.serializeToken(config.client_id, email ,config.extra_data);
  var now = moment().format('YYYY-MM-DD HH:mm:ss');
  var promise = new Promise(function(resolved , rejected){
    connection.query(' SELECT id FROM members WHERE email = ? ', email , function(err , result){
      if ( err ) rejected(err);
      resolved(result);
    });
  }).then(function(result){
    if ( result.length > 0 ){
      code = 2;
      msg = '이미등록된 이메일입니다.';
      data = 'duplicate';
    }else{
      if ( loginType == 'normal' ){
        var data  = {
                      email:email,
                      password: password,
                      regdate : now,
                      login_time : now,
                      login_type : loginType,
                      email_token : email_token,
                      nickname : deviceId
                    };
        return memberInsert(data);
      }else{
        //소셜로그인
      }
    }
  }).then(function(result){
    var data = {
      access_token : access_token,
      userno : result.insertId
    };
    return deviceUpdate(data , deviceId);
  }).catch(function(err){
    console.log(err);
  }).then(function(){
    code = 1;
    emailSend(email , email_token);
    res.json({
      code : code,
      data : 'success',
      accessToken : access_token,
      msg : '가입성공'
    });
  });
});
router.get('/auth' , function(req , res){
  var email_token = req.query.id;
  var query = connection.query(" SELECT id FROM members WHERE email_token =  ? " , email_token , function(err , result){
    if (err){
      console.log(err);
      throw err;
    }
    if ( result.length > 0 ){
      var updateQuery = connection.query(" UPDATE members SET email_yn = 'y' WHERE email_token = ? " , email_token , function(err , result){
        if(err){
          consloe.log(err);
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
router.post('/email-send' , function(req , res){
  var accessToken = req.body.accessToken;
  var deviceId = req.body.deviceId;
  var code = 0;
  var promise = userSelectFromToken(accessToken , deviceId)
  .then(function(result){
    if ( result.id == 0 ){
      //회원이 없음
      code = 2;
    }else{
      code = 1;
      emailSend(result.email , result.email_token);
    }
    res.json({
      code : code
    });
  })
})
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
	var description = req.body.description;
	var code = 2;
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
