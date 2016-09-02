var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

const crypto = require('crypto');

function hashPassword(password){
  'use strict';
  var array = [];
  for(let i = 0; i < 10; i++){
    array.push(String.fromCharCode('0'.charCodeAt() + i));
  }
  for(let i = 0; i < 26; i++){
    array.push(String.fromCharCode('a'.charCodeAt() + i));
  }
  for(let i = 0; i < 26; i++){
    array.push(String.fromCharCode('A'.charCodeAt() + i));
  }
  var salt = '';
  for(let i = 0; i < 8; i++){
    salt += array[Math.floor(Math.random() * 62)];
  }
  password += salt;
  var hash = crypto.createHash('sha256');
  hash.update(password);
  var a = hash.digest('hex');
  var b;
  for(var i = 0; i < 10000; i++){
    var h = crypto.createHash('sha256');
    b = h.update(a);
    b = b.digest('hex');
    a = b;
  }
  password = b;
  var passwordAndHash = [];
  passwordAndHash.push(password);
  passwordAndHash.push(salt);
  return passwordAndHash;
}

router.get('/', (req, res) => {
  res.render('createAccount.ejs');
});

router.post('/', (req, res) => {
  var eMail = req.body.email;
  var userName = req.body.user_name;
  var password = req.body.password;
  var checkForm = /^[a-zA-Z0-9]+$/;
  var checkEmail = /^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/;
  var againPassword = req.body.again_password;
  (() => {
    var promise = new Promise((resolve) => {
      if(password === againPassword){
        resolve();
      }else{
        res.render('createAccount.ejs', {
          passwordNotice : 'パスワードが一致しません',
        });
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(checkEmail.test(eMail)){
        resolve();
      }else{
        res.render('createAccount.ejs', {
          mailNotice : '正しいメールアドレスを入力してください',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(checkForm.test(userName) && userName.length <= 16){
        resolve();
      }else{
        res.render('createAccount.ejs', {
          usernameNotice : 'ユーザーネームは半角英数16文字以下です',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(checkForm.test(password) && password.length >= 8){
        resolve();
      }else{
        res.render('createAccount.ejs', {
          passwordNotice : 'パスワードは半角英数8文字以上です',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var existsEmailQuery = 'SELECT `mail` FROM `users` WHERE `mail` = ?';
      connection.query(existsEmailQuery, [eMail]).then((result) => {
        if(result[0].length > 0){
          res.render('createAccount.ejs', {
            eMailExists : '既に登録されているメールアドレスです',
          });
        }else{
          resolve();
        }
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var existsUserNameQuery = 'SELECT `name` FROM `users` WHERE `name` = ?';
      connection.query(existsUserNameQuery, [userName]).then((result) => {
        if(result[0].length > 0){
          res.render('createAccount.ejs', {
            userNameExists : '既に登録されているユーザーネームです。',
          });
        }else{
          resolve();
        }
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var passwordAndHash = hashPassword(password);
      resolve(passwordAndHash);
    });
    return promise;
  }).then((value) => {
    password = value[0];
    var salt = value[1];
    var createAccount = 'INSERT INTO `users` (`name`,`mail`,`salt`,`hash`,`nick_name`,`image_path`) VALUES(?, ?, ?, ?, ?, ?)';
    connection.query(createAccount, [userName, eMail, salt, password, userName, 'http://res.cloudinary.com/dy4f7hul5/image/upload/v1469220623/sample.jpg']).then(() => {
      res.redirect('/PHH_Bookmark/login');
    });
  });
});

module.exports = router;
