var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var moment = require('moment');
var version = config.appVersion;
var multer = require('multer');
//var storage = multer.diskStorage({
//  // 서버에 저장할 폴더
//  destination: function (req, file, cb) {
//    cb(null, 'uploads/' + moment().format('YYYYMMDD') + '/');
//  },
//  // 서버에 저장할 파일 명
//  filename: function (req, file, cb) {
//    file.uploadedFile = {
//      name: Date.now(),
//      ext: file.mimetype.split('/')[1]
//    };
//    cb(null, file.uploadedFile.name + '.' + file.uploadedFile.ext);
//  }
//});
//var upload = multer({ storage: storage }).array('file' , 3);
var storage = multer.diskStorage({
    // 서버에 저장할 폴더
    destination: function (req, file, cb) {
      var fs = require('fs');
      var dir = 'uploads/' + moment().format('YYYYMMDD') + '/';

      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      cb(null, 'uploads/' + moment().format('YYYYMMDD') + '/' );
    },
    // 서버에 저장할 파일 명
    filename: function (req, file, cb) {
      file.uploadedFile = {
        name: Date.now(),
        ext: file.mimetype.split('/')[1]
      };
      cb(null, file.uploadedFile.name + '.' + file.uploadedFile.ext);
    }
  });
var upload = multer({ storage: storage }).fields([
                                                  { name: 'file1', maxCount: 1 },
                                                  { name: 'file2', maxCount: 1 },
                                                  { name: 'file3', maxCount: 1 },
                                                  { name: 'file4', maxCount: 1 }
                                                ]);
//var upload = multer({ storage: storage }).array('file' , 3);

var easyimg = require('easyimage');

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



router.get('/resizing' , function(req , res){
  easyimg.info('uploads/20160822/1471792947568.jpeg').then(
    function(file) {
      console.log(file);
    }, function (err) {
      console.log(err);
    }
  );
  easyimg.info('uploads/20160822/test.jpeg').then(
    function(file) {
      console.log(file);
    }, function (err) {
      console.log(err);
    }
  );
  easyimg.resize({
     src:'uploads/20160822/1471792947568.jpeg', dst:'uploads/20160822/test.jpeg',
     width:500, height:500,
  }).then(
  function(image) {
     console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
  },
  function (err) {
    console.log(err);
  }
);
  res.json('');
});


router.post('/posting'   , function( req ,res ){
  var accessToken = req.body.accessToken;
  console.log(accessToken);
	var content = req.body.contents;
	var tag = req.body.tag;
	var permission = req.body.permission;
	var place_name = req.body.place_name;
	var place_position = req.body.place_position;
	console.log(req.files);
	upload(req , res , function(err){
		if (err){
			console.log(err);
			throw err;
		}
//		var data  = {
//                email:email,
//                password: password,
//                regdate : now,
//                login_time : now,
//                login_type : loginType,
//                email_token : email_token,
//                nickname : deviceId
//              };
//		var query = connection.query(' INSERT INTO posts SET ? ' , data , function(err , result){
//			
//		});
	})
	
  res.json({
	  code : 1
  });
});


module.exports = router;
