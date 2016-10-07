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
  var checkEmail = /^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/;
  if(checkEmail.test(mail)){
    var changeMail = 'UPDATE `users` SET `mail` = ? WHERE `user_id` = ?';
    connection.query(changeMail, [mail, myId]).then(() => {
      res.redirect('/PHH_Bookmark/accountSetting');
    });
  }else{
    var selectMyData = 'SELECT * FROM `users` WHERE `user_id` = ?';
    connection.query(selectMyData, [myId]).then((result) => {
      res.render('accountSetting.ejs', {
        myData : result[0][0],
        mailNotice : '正しいメールアドレスを入力してください',
      });
    });
  }
});

router.post('/password', (req, res) => {
  var myId = req.session.user_id;
  var currentPassword = req.body.currentPassword;
  var newPassword = req.body.newPassword;
  var newPasswordConfirm = req.body.newPasswordConfirm;
  var checkForm = /^[a-zA-Z0-9]+$/;
  new Promise((resolve) => {
    if(checkForm.test(newPassword) && newPassword.length >= 8){
      resolve();
    }else{
      var selectMyData = 'SELECT * FROM `users` WHERE `user_id` = ?';
      connection.query(selectMyData, [myId]).then((result) => {
        res.render('accountSetting.ejs', {
          myData : result[0][0],
          passwordNotice : 'パスワードは半角英数8文字以上です',
        });
      });
    }
  })
  .then(() => new Promise((resolve) => {
    var selectHashAndSalt = 'SELECT * FROM `users` WHERE `user_id` = ?';
    connection.query(selectHashAndSalt, [myId]).then((result) => {
      var values = {
        currentHash : result[0][0].hash,
        currentSalt : result[0][0].salt,
      };
      resolve(values);
    });
  }))
  .then((values) => new Promise((resolve) => {
    var submittedHash = toHash(currentPassword, values.currentSalt);
    values.submittedHash = submittedHash;
    resolve(values);
  }))
  .then((values) => new Promise((resolve) => {
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
  }))
  .then((values) => new Promise((resolve) => {
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
  }))
  .then((values) => new Promise((resolve) => {
    var newPasswordAndHash = hashPassword(newPassword);
    values.newPasswordAndHash = newPasswordAndHash;
    resolve(values);
  }))
  .then((values) => {
    var newHash = values.newPasswordAndHash[0];
    var newSalt = values.newPasswordAndHash[1];
    return new Promise((resolve) => {
      var changePassword = 'UPDATE `users` SET `hash` = ?, `salt` = ? WHERE `user_id` = ?';
      connection.query(changePassword, [newHash, newSalt, myId]).then(() => {
        resolve();
      });
    });
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

router.post('/leave', (req, res) => {
  var myId = req.session.user_id;
  new Promise((resolve, reject) => {
    var checkOrganization = 'SELECT * FROM (SELECT * FROM `organization_memberships` WHERE `user_id` = ? AND `is_admin` = true) AS a';
    connection.query(checkOrganization, [myId]).then((result) => {
      result[0].length ? reject(result[0]) : resolve();
    });
  }))
  .catch((value) => new Promise((resolve, reject) => {
    var orgIds = [];
    value.forEach((currentValue, index, array) => {
      orgIds.push(currentValue.org_id);
      if(index + 1 === array.length){
        var values = {
          orgIds,
          selectedMemberships : value,
        };
        reject(values);
      }
    });
  }))
  .catch((values) => {new Promise((resolve, reject) => {
    values.orgIds = values.orgIds.filter((currentValue, index, array) => array.indexOf(currentValue) === index);
    reject(values);
  }))
  .catch((values) => new Promise((resolve, reject) => {
    values.memberships = {};
    values.orgIds.forEach((currentValue, index, array) => {
      values.memberships[currentValue] = [];
      if(index + 1 === array.length) reject(values);
    });
  }))
  .catch((values) => new Promise((resolve, reject) => {
    values.selectedMemberships.forEach((currentValue, index, array) => {
      values.orgIds.forEach((_currentValue, _index, _array) => {
        if(currentValue.org_id === _currentValue) values.memberships[_currentValue].push(currentValue.user_id);
        if(index + 1 === array.length && _index + 1 === _array.length) reject(values);
      });
    });
  }))
  .catch((values) => new Promise((resolve, reject) => {
    var cannotLeave = 0;
    for(var i = 0; i < values.orgIds.length; i++){
      if(values.memberships[values.orgIds[i]].length <= 1){
        cannotLeave++;
      }
    }
    cannotLeave > 0 ? reject() : resolve();
  }))
  .then(() => new Promise((resolve) => {
    var deleteMembership = 'DELETE FROM `organization_memberships` WHERE `user_id` = ?';
    connection.query(deleteMembership, [myId]).then(() => {
      resolve();
    }, () => {
      resolve();
    });
  }))
  .then(() => new Promise((resolve) => {
    var deleteBookmarks = 'DELETE FROM `bookmarks` WHERE `user_id` = ? AND `org_id` = NULL';
    connection.query(deleteBookmarks, [myId]).then(() => {
      resolve();
    }, () => {
      resolve();
    });
  }))
  .then(() => {
    var deleteFromUsers = 'UPDATE `users` SET `name` = "unknown", `mail` = "unknown", `salt` = "unknown", hash = "unknown", `nick_name` = "unknown", image_path = "NULL", introduction = "NULL" WHERE `user_id` = ?';
    connection.query(deleteFromUsers, [myId]).then(() => {
      delete req.session.user_id;
      res.redirect('/PHH_Bookmark/left');
    });
  }).catch(() => {
    var selectMyData = 'SELECT * FROM `users` WHERE `user_id` = ?';
    connection.query(selectMyData, [myId]).then((result) => {
      res.render('accountSetting', {
        myData : result[0][0],
        organizationNotice : '管理者があなたのみの組織が存在するため退会できません。権限を他のユーザーに付与するかその組織を解散してください',
      });
    });
  });
});

module.exports = router;
