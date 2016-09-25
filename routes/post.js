var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var connection = require('../db.js');
var moment = require('moment');
var multer = require('multer');
var Promise = require('promise');
var fs = require('fs');
var storage = multer.diskStorage({
    // 서버에 저장할 폴더
    destination: function (req, file, cb) {

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
        ext: file.originalname.split('.')[1]
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

var easyimg = require('easyimage');
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
  var deviceId = req.body.deviceId;
	var content = req.body.contents;
	var tag = req.body.tag;
	var permission = req.body.permission;
	var place_name = req.body.place_name;
	var place_position = req.body.place_position;
  var files;
  var now = moment().format('YYYY-MM-DD HH:mm:ss');
  var userno;
	var promise = new Promise(function(resolved , rejected){
		upload(req , res , function(err){
			if (err) rejected(err);
			resolved(req);
		})
	}).catch(function(err){
		console.log('err : ' + err);
    res.json({
      code : 2
    });
	}).then(function(req){
		console.log(req.body);
		console.log(req.body.tag);
		console.log(req.files);
    files = req.files;
    return new Promise(function(resolved , rejected){
      connection.query( ' SELECT * FROM devices WHERE access_token = ? AND device_id = ? ' , [ accessToken , deviceId ] , function(err , result){
        if(err) rejected(err);
        if ( result.length > 0 ){
          resolved(result[0]);
        }else{
          rejected(0);
        }
      })
    });
	}).then(function(result){
    var data = {
      userno : result.userno,
      content : content,
      tag : tag,
      permission : permission,
      place_name : place_name,
      place_position : place_position,
      regdate : now
    }
    userno = result.userno;
    return new Promise(function(resolved , rejected){
      connection.query( ' INSERT INTO posts = ? ' , data , function(err , result){
        if(err) rejected(err);
        resolved(result);
      });
    })
  }).then(function(result){
    var data = {
      user_id : userno,
      post_id : result.insertId,

    }
    return 1;
  }).catch(err){
    console.log(err);
  }.then(function(result){
    res.json({
      code : 3
    })
  });

});

router.get('/image',function(req,res){
	var id = req.query.id;

	var img = fs.readFileSync(__dirname + '/..//uploads/20160918/1474187212777.jpg');
    res.writeHead(200, {'Content-Type': 'image/jpg' });
    res.end(img);

});


module.exports = router;
