var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service : 'Gmail',
  auth : {
    user : 'mydailylook.args@gmail.com',
    pass : 'k4903198'
  }
});

module.exports = transporter;
