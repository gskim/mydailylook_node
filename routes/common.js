var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.json');

var version = config.appVersion;


var connection = mysql.createConnection({
    host    :config.db_host,
    port : 3306,
    user : config.db_user,
    password : config.db_password,
    database:'mydailylook'
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
    console.log(req.body.deviceId);
    var query = connection.query('SELECT * FROM devices WHERE device_id = ? ' , deviceId , function(err , result){
      console.log(result);
      if ( result.length > 0 ){
        code = 2; //기존단말기
        var device = {};
        res.send(device);
      }else{
        code = 1; //신규단말기
        var device = {
                      'device_id':deviceId,
                      'push_id':pushId,
                      'app_version':appVersion,
                      'os_type':osType,
                      'os_version':osVersion,
                      'visit_time' : 'current_timestamp()',
                    };
        query = connection.query('insert into devices set ?',device,function(err,result){
            if (err) {
                console.error(err);
                throw err;
            }
            console.log(query);
            var response = {
                            'code':code,
                            'eventUrl' : config.eventUrl,
                            'appVersion' : version,
                            'isForce' : config.isForce
            };
            res.send(response);
        });
      }
    });
});

module.exports = router;
