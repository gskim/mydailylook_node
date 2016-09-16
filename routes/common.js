var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');
var connection = require('../db.js');
var Promise = require('promise');
var moment = require('moment');
var version = config.appVersion;
function updateDevice(data , deviceId){
  return new Promise(function(resolved , rejected){
    connection.query('UPDATE devices SET ? WHERE device_id = ? ' , [data , deviceId ], function(err , result){
      if(err) rejected(err);
      resolved(result);
    });
  })
}
function insertDevice(data){
  return new Promise(function(resolved , rejected){
    connection.query('insert into devices set ?',data,function(err,result){
      if (err) rejected(err);
      resolved(result);
    });
  });
}
router.post('/gate',function(req,res){
    var deviceId = req.body.deviceId;
    var pushId = req.body.gcmId;
    var appVersion = req.body.appVersion;
    var osType = req.body.osType;
    var osVersion = req.body.osVersion;
    var code = 0;
    console.log('deviceId : ' + deviceId);
    var now = moment().format('YYYY-MM-DD HH:mm:ss');
    var promise = new Promise(function(resolved , rejected){
      connection.query('SELECT * FROM devices WHERE device_id = ? ' , deviceId , function(err , result){
        if(err){
          rejected(err);
        }
        resolved(result);
      });
    }).then(function(result){
      var device = {
                    'push_id':pushId,
                    'app_version':appVersion,
                    'os_type':osType,
                    'os_version':osVersion,
                    'visit_time' : now
                  };
      if ( result.length > 0 ){
        code = 2;
        return updateDevice(device , deviceId);
      }else{
        code = 1;
        device.device_id = deviceId;
        return insertDevice(device);
      }
    }).then(function(result){
      console.log(result);
    }).catch(function(err){
      console.log(err);
      throw err;
    }).then(function(){
      var response = {
                      'code':code,
                      'eventUrl' : config.eventUrl,
                      'appVersion' : version,
                      'isForce' : config.isForce
      };
      res.json(response);
    });
});


module.exports = router;
