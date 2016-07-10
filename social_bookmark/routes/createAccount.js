var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

const crypto = require('crypto');

function hashPassword(password){
  var array = new Array();
  for(var i = 0; i < 10; i++){
    array.push(String.fromCharCode('0'.charCodeAt() + i));
  }
  for(var i = 0; i < 26; i++){
    array.push(String.fromCharCode('a'.charCodeAt() + i));
  }
  for(var i = 0; i < 26; i++){
    array.push(String.fromCharCode('A'.charCodeAt() + i));
  }
  var salt = '';
  for(var i = 0; i < 8; i++){
    salt += array[Math.floor(Math.random()*62)]
  }
  password += salt;
  var hash = crypto.createHash('sha256');
  hash.update(password);
  var a = hash.digest('hex');
  for(var i = 0; i < 10000; i++){
    var h = crypto.createHash('sha256');
    var b = h.update(a);
    b = b.digest('hex');
    a = b;
  }
  password = b;
  connection.query('INSERT INTO `hashes` (`hash`,`salt`) VALUES(?,?)',[password,salt]);
}

router.get('/',function(req,res){
  res.render('createAccount.ejs');
});
router.post('/join', function(req,res){
  var eMail = req.body.email;
  var userName = req.body.user_name;
  var password = req.body.password;
  hashPassword(password);
  var query = 'INSERT INTO `users` (`user_name`,`mail`) VALUES(?, ?)';
  connection.query(query,[userName,eMail],function(err,rows){
    res.redirect('/PHH_Bookmark/login');
  });
});

module.exports = router;
