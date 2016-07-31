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
  var checkForm = /^[a-zA-Z0-9]+$/;
  var checkEmail = /^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/;
  var checkInjection = /[%+-\\(\\)"'\\*\\/\\;]+/g;
  if(checkEmail.test(eMail)){
    if(checkForm.test(userName) && userName.length <= 16){
      if(checkForm.test(password) && password.length >= 8){
        var passwordAndHash = hashPassword(password);
        var eMailExistsQuery = 'SELECT `mail` FROM `users` WHERE `mail` = ?';
        var query = 'INSERT INTO `users` (`name`,`mail`,`salt`,`hash`,`nick_name`,`image_path`) VALUES(?, ?, ?, ?, ?, ?)';
        connection.query(eMailExistsQuery,[eMail],function(err,result){
          var eMailExists = result.length === 1;
          if(eMailExists){
            res.render('createAccount.ejs',{
              emailExists: '既に登録されているメールアドレスです。'
            });
          }else{
            password = passwordAndHash[0];
            var salt = passwordAndHash[1];
            connection.query(query,[userName,eMail,salt,password,userName,'http://res.cloudinary.com/dy4f7hul5/image/upload/v1469220623/sample.jpg'],function(err,rows){
              res.redirect('/PHH_Bookmark/login');
            });
          }
        });
      }else{
        res.render('createAccount.ejs', {
          passwordNotice: 'パスワードは半角英数8文字以上です'
        });
      }
    }else{
      res.render('createAccount.ejs', {
        usernameNotice: 'ユーザーネームは半角英数16文字以下です'
      });
    }
  }else{
    res.render('createAccount.ejs', {
      mailNotice: '正しいメールアドレスを入力してください'
    })
  }
});

module.exports = router;
