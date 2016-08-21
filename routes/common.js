var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var moment = require('moment');
var version = config.appVersion;


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