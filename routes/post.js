var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var moment = require('moment');
var version = config.appVersion;
var multer = require('multer');
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, '/uploads');
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now());
//   }
// });
//var upload = multer({ storage: storage });
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
// var upload = function (req, res) {
//   var deferred = Q.defer();
//   var storage = multer.diskStorage({
//     // 서버에 저장할 폴더
//     destination: function (req, file, cb) {
//       cb(null, '/uploads');
//     },
//
//     // 서버에 저장할 파일 명
//     filename: function (req, file, cb) {
//       file.uploadedFile = {
//         name: req.params.filename,
//         ext: file.mimetype.split('/')[1]
//       };
//       cb(null, file.uploadedFile.name + '.' + file.uploadedFile.ext);
//     }
//   });
//
//   var upload = multer({ storage: storage }).array('files' , 3 );
//   upload(req, res, function (err) {
//     if (err) deferred.reject();
//     else deferred.resolve(req.file.uploadedFile);
//   });
//   return deferred.promise;
// };

// router.post('/posting' , upload.array('files', 4) , function( req ,res ){
//   var accessToken = req.body.accessToken;
// 	//file1 , file2 , file3 ,file4 : 사진 1,2,3,4
// 	var content req.body.contents;
// 	var tag = req.body.tag;
// 	var permission = req.body.permission;
// 	var place_name = req.body.place_name;
// 	var place_position = req.body.place_position;
//   upload(req,res,function(err) {
//         console.log(req.body);
//         console.log(req.files);
//         if(err) {
//             return res.end("Error uploading file.");
//         }
//         res.end("File is uploaded");
//     });
//
//
// });


router.post('/gate',function(req,res){
    var deviceId = req.body.deviceId;
    var pushId = req.body.gcmId;
    var appVersion = req.body.appVersion;
    var osType = req.body.osType;
    var osVersion = req.body.osVersion;
    var code = 0;
    //var now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var now = moment().format('YYYY-MM-DD HH:mm:ss');

    var query = connection.query('SELECT * FROM devices WHERE device_id = ? ' , deviceId , function(err , result){
      if (err) {
        console.log(err);
        throw err;
      }
      if ( result.length > 0 ){
        code = 2; //기존단말기
        var device = {
                      'push_id':pushId,
                      'app_version':appVersion,
                      'os_type':osType,
                      'os_version':osVersion,
                      'visit_time' : now
                    };
        query = connection.query('UPDATE devices SET ? WHERE device_id = ? ' , [device , deviceId ], function(err , result){
          if (err) {
            console.log(err);
            throw err;
          }
          var response = {
                          'code':code,
                          'eventUrl' : config.eventUrl,
                          'appVersion' : version,
                          'isForce' : config.isForce
          };
          res.send(response);
        });
      }else{
        code = 1; //신규단말기
        var device = {
                      'device_id':deviceId,
                      'push_id':pushId,
                      'app_version':appVersion,
                      'os_type':osType,
                      'os_version':osVersion,
                      'visit_time' : now
                    };
        query = connection.query('insert into devices set ?',device,function(err,result){
            if (err) {
                console.error(err);
                throw err;
            }
            console.log(result);
            var response = {
                            'code':code,
                            'eventUrl' : config.eventUrl,
                            'appVersion' : version,
                            'isForce' : config.isForce
            };
            console.log(response);
            res.send(response);
        });
      }
    });
});

module.exports = router;
