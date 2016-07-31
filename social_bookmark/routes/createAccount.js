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
  var passwordAndHash = [];
  passwordAndHash.push(password);
  passwordAndHash.push(salt);
  return passwordAndHash;
}

router.get('/',function(req,res){
  res.render('createAccount.ejs');
});
router.post('/', function(req,res){
  if(req.session.user_id){
    delete req.session.user_id;
  }
  var eMail = req.body.email;
  var userName = req.body.user_name;
  var password = req.body.password;
  var passwordAndHash = hashPassword(password);
  var existsEmailQuery = 'SELECT `mail` FROM `users` WHERE `mail` = ?';
  var existsUserNameQuery = 'SELECT `name` FROM `users` WHERE `name` = ?';
  var createAccount = 'INSERT INTO `users` (`name`,`mail`,`salt`,`hash`,`nick_name`,`image_path`) VALUES(?, ?, ?, ?, ?, ?)';
  connection.query(existsEmailQuery,[eMail],function(err,result){
    if(result.length === 1){
      res.render('createAccount.ejs',{
        eMailExists: '既に登録されているメールアドレスです。'
      });
    }
    connection.query(existsUserNameQuery,[userName],function(err,result){
      if(result.length === 1){
        res.render('createAccount.ejs',{
          userNameExists : '既に登録されているユーザーネームです。'
        });
      } else {
        password = passwordAndHash[0];
        var salt = passwordAndHash[1];
        connection.query(createAccount,[userName,eMail,salt,password,userName,'http://res.cloudinary.com/dy4f7hul5/image/upload/v1469220623/sample.jpg'],function(err,rows){
          res.redirect('/PHH_Bookmark/login');
        });
      }
    });
  });
});

module.exports = router;
