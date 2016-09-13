var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

const crypto = require('crypto');

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
  if (req.session.user_id) {
    res.redirect('/PHH_Bookmark/topPage');
  } else {
    res.render('login.ejs');
  }
});

router.post('/', (req, res) => {
  var eMailOrUserName = req.body.email_or_user_name;
  var password = req.body.password;
  var hashFromId;
  var re = /@/g;
  var checkForm = /^[a-zA-Z0-9]+$/;
  var checkEmail = /^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/;
  if(re.test(eMailOrUserName)){
    var eMail = eMailOrUserName;
    if(checkEmail.test(eMail)){
      (() => {
        var promise = new Promise((resolve) => {
          connection.query('SELECT `user_id` FROM `users` WHERE `mail` = ?', [eMail]).then((result) => {
            if(result[0].length === 1){
              var idFromMail = result[0][0].user_id;
              resolve(idFromMail);
            }else{
              req.session.user_id = false;
              res.render('login.ejs', {
                noUser : 'ログインに失敗しました',
              });
            }
          });
        });
        return promise;
      })().then((value) => {
        var idFromMail = value;
        var promise = new Promise((resolve) => {
          connection.query('SELECT `salt` FROM `users` WHERE `user_id` = ?', [idFromMail]).then((result) => {
            var saltFromId = result[0][0].salt;
            var values = {
              saltFromId,
              idFromMail,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((values) => {
        var saltFromId = values.saltFromId;
        var idFromMail = values.idFromMail;
        var promise = new Promise((resolve) => {
          if(checkForm.test(password)){
            password = toHash(password, saltFromId);
            values = {
              idFromMail,
              password,
              saltFromId,
            };
            resolve(values);
          }else{
            res.render('login.ejs', {
              passwordNotice : '正しい形式でパスワードを入力してください',
            });
          }
        });
        return promise;
      }).then((values) => {
        var idFromMail = values.idFromMail;
        password = values.password;
        var promise = new Promise((resolve) => {
          connection.query('SELECT `hash` FROM `users` WHERE `user_id` = ?', [idFromMail]).then((result) => {
            hashFromId = result[0][0].hash;
            values = {
              password,
              hashFromId,
              idFromMail,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((values) => {
        password = values.password;
        hashFromId = values.hashFromId;
        var idFromMail = values.idFromMail;
        if(password === hashFromId){
          req.session.user_id = idFromMail;
          res.redirect('/PHH_Bookmark/topPage');
        }else{
          req.session.user_id = false;
          res.render('login.ejs', {
            noUser : 'ログインに失敗しました',
          });
        }
      });
    }else{
      res.render('login.ejs', {
        mailNotice : '正しいメールアドレスを入力してください',
      });
    }
  }else{
    var userName = eMailOrUserName;
    if(checkForm.test(userName)){
      (() => {
        var promise = new Promise((resolve) => {
          connection.query('SELECT `user_id` FROM `users` WHERE `name` = ?', [userName]).then((result) => {
            if(result[0].length === 1){
              var idFromUserName = result[0][0].user_id;
              resolve(idFromUserName);
            }else{
              req.session.user_id = false;
              res.render('login.ejs', {
                noUser : 'ログインに失敗しました',
              });
            }
          });
        });
        return promise;
      })().then((value) => {
        var idFromUserName = value;
        var promise = new Promise((resolve) => {
          connection.query('SELECT `salt` FROM `users` WHERE `user_id` = ?', [idFromUserName]).then((result) => {
            var saltFromId = result[0][0].salt;
            var values = {
              idFromUserName,
              saltFromId,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((values) => {
        var idFromUserName = values.idFromUserName;
        var saltFromId = values.saltFromId;
        var promise = new Promise((resolve) => {
          if(checkForm.test(password)){
            password = toHash(password, saltFromId);
            values = {
              idFromUserName,
              password,
            };
            resolve(values);
          }else{
            res.render('login.ejs', {
              passwordNotice : '正しい形式でパスワードを入力してください',
            });
          }
        });
        return promise;
      }).then((values) => {
        var idFromUserName = values.idFromUserName;
        password = values.password;
        connection.query('SELECT `hash` FROM `users` WHERE `user_id` = ?', [idFromUserName]).then((result) => {
          hashFromId = result[0][0].hash;
          if(password === hashFromId){
            req.session.user_id = idFromUserName;
            res.redirect('/PHH_Bookmark/topPage');
          }else{
            req.session.user_id = false;
            res.render('login.ejs', {
              noUser : 'ログインに失敗しました',
            });
          }
        });
      });
    }else{
      res.render('login.ejs', {
        usernameNotice : '正しいユーザーネームを',
      });
    }
  }
});

module.exports = router;
