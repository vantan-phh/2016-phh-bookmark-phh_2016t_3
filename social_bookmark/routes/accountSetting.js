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

function toHash(password, salt){
  var hash = crypto.createHash('sha256');
  password += salt;
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
  return password;
}

router.get('/', (req, res) => {
  var myId = req.session.user_id;
  var selectMyData = 'SELECT * FROM `users` WHERE `user_id` = ?';
  connection.query(selectMyData, [myId]).then((result) => {
    res.render('accountSetting.ejs', {
      myData : result[0][0],
    });
  });
});

router.post('/mail', (req, res) => {
  var myId = req.session.user_id;
  var mail = req.body.mail;
  var changeMail = 'UPDATE `users` SET `mail` = ? WHERE `user_id` = ?';
  connection.query(changeMail, [mail, myId]).then(() => {
    res.redirect('/PHH_Bookmark/accountSetting');
  });
});

router.post('/password', (req, res) => {
  var myId = req.session.user_id;
  var currentPassword = req.body.currentPassword;
  var newPassword = req.body.newPassword;
  var newPasswordConfirm = req.body.newPasswordConfirm;
  (() => {
    var promise = new Promise((resolve) => {
      var selectHashAndSalt = 'SELECT * FROM `users` WHERE `user_id` = ?';
      connection.query(selectHashAndSalt, [myId]).then((result) => {
        var values = {
          currentHash : result[0][0].hash,
          currentSalt : result[0][0].salt,
        };
        resolve(values);
      });
    });
    return promise;
  })().then((values) => {
    var promise = new Promise((resolve) => {
      var submittedHash = toHash(currentPassword, values.currentSalt);
      values.submittedHash = submittedHash;
      resolve(values);
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.submittedHash === values.currentHash){
        resolve(values);
      }else{
        var selectMyData = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(selectMyData, [myId]).then((result) => {
          res.render('accountSetting.ejs', {
            passwordNotice : '入力された値と現在のパスワードが一致しません。',
            myData : result[0][0],
          });
        });
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(newPassword === newPasswordConfirm){
        resolve(values);
      }else{
        var selectMyData = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(selectMyData, [myId]).then((result) => {
          res.render('accountSetting.ejs', {
            confirmNotice : '新しいパスワードとその確認の入力値が一致しません。',
            myData : result[0][0],
          });
        });
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var newPasswordAndHash = hashPassword(newPassword);
      values.newPasswordAndHash = newPasswordAndHash;
      resolve(values);
    });
    return promise;
  }).then((values) => {
    var newHash = values.newPasswordAndHash[0];
    var newSalt = values.newPasswordAndHash[1];
    var promise = new Promise((resolve) => {
      var changePassword = 'UPDATE `users` SET `hash` = ?, `salt` = ? WHERE `user_id` = ?';
      connection.query(changePassword, [newHash, newSalt, myId]).then(() => {
        resolve();
      });
    });
    return promise;
  }).then(() => {
    var selectMyData = 'SELECT * FROM `users` WHERE `user_id` = ?';
    connection.query(selectMyData, [myId]).then((result) => {
      res.render('accountSetting.ejs', {
        myData : result[0][0],
        finishChangingPassword : 'パスワードの変更が完了しました。',
      });
    });
  });
});

module.exports = router;