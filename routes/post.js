var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var moment = require('moment');
var version = config.appVersion;
var multer = require('multer');
var Promise = require('promise');
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
//var upload = multer({ storage: storage }).fields([
//                                                  { name: 'file1', maxCount: 1 },
//                                                  { name: 'file2', maxCount: 1 },
//                                                  { name: 'file3', maxCount: 1 },
//                                                  { name: 'file4', maxCount: 1 }
//                                                ]);
var upload = multer({storage : storage}).single('file1');

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
var multiparty = require('multiparty');
var fs = require('fs');
//router.post('/posting'   , function( req ,res ){
//	var form = new multiparty.Form();
//    
//    // get field name & value
//    form.on('field',function(name,value){
//         console.log('normal field / name = '+name+' , value = '+value);
//    });
//    
// // file upload handling
//    form.on('part',function(part){
//         var filename;
//         var size;
//         if (part.filename) {
//               filename = part.filename;
//               size = part.byteCount;
//         }else{
//               part.resume();
//        
//         }    
//         console.log(part);
//         console.log("Write Streaming file :"+filename);
//         var writeStream = fs.createWriteStream('uploads/' + moment().format('YYYYMMDD') + '/'+filename);
//         writeStream.filename = filename;
//         part.pipe(writeStream);
//
//         part.on('data',function(chunk){
//               console.log(filename+' read '+chunk.length + 'bytes');
//         });
//        
//         part.on('end',function(){
//               console.log(filename+' Part read complete');
//               writeStream.end();
//         });
//    });
//    
//    form.on('close',function(){
//    	res.json({
//  		  code : 1
//  	  });
//   });
//    form.parse(req);
//	  
//	});
router.post('/posting'   , function( req ,res ){
  var accessToken = req.body.accessToken;
	var content = req.body.contents;
	var tag = req.body.tag;
	var permission = req.body.permission;
	var place_name = req.body.place_name;
	var place_position = req.body.place_position;
	var promise = new Promise(function(resolved , rejected){
		upload(req , res , function(err){
			if (err) rejected(err);
			
			resolved(req);
		})
	}).catch(function(err){
		console.log('err : ' + err);
	}).then(function(req){
		console.log(req.body.tag);
		console.log(req.file);
	});
  res.json({
	  code : 1
  });
});


module.exports = router;
