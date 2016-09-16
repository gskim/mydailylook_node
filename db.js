var mysql = require('mysql');
var connection = mysql.createPool({
    host    :'localhost',
    port : 3306,
    user : 'root',
    password : 'rltjs500529',
    database: 'mydailylook',
    connectionLimit : 20,
    waitForConnections:true
});
// connection.getConnection(function(err) {
//     if (err) {
//         console.error('mysql connection error');
//         console.error(err);
//         throw err;
//     }
// });

module.exports = connection;
