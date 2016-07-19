var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

const crypto = require('crypto');

function toHash(password,salt){
  var hash = crypto.createHash('sha256');
  password += salt;
  hash.update(password);
  var a = hash.digest('hex');
  for(var i = 0; i < 10000; i++){
    var h = crypto.createHash('sha256');
    var b = h.update(a);
    b = b.digest('hex');
    a = b;
  }
  password = b;
  return password;
}

router.get('/', function(req, res) {
  if (req.session.user_id) {
    res.redirect('/PHH_Bookmark/topPage');
  } else {
    res.render('login.ejs');
  }
});
router.post('/', function(req, res){
  var eMailOrUserName = req.body.email_or_user_name;
  var hashFromId;
  var re = /@/g;
  if(re.test(eMailOrUserName)){
    var eMail = eMailOrUserName;
    var idFromMail;
    var saltFromId;
    connection.query('SELECT `user_id` FROM `users` WHERE `mail` = ?',[eMail],function(err,result){
      idFromMail = result[0].user_id;
      connection.query('SELECT `salt` FROM `users` WHERE `user_id` = ?',[idFromMail],function(err,result){
        saltFromId = result[0].salt;
        var password = req.body.password;
        password = toHash(password,saltFromId);
        connection.query('SELECT `hash` FROM `users` WHERE `id` = ?',[idFromMail],function(err,result){
          hashFromId = result[0].hash;
          if(password === hashFromId){
            req.session.user_id = idFromMail;
            res.redirect('/PHH_Bookmark/topPage');
          }else{
            req.session.user_id = false;
            res.render('login.ejs',{
              noUser:'入力した値からユーザーが探せません。'
            });
          }
        });
      });
    });
  }else{
    var userName = eMailOrUserName;
    var idFromUserName;
    var saltFromId;
    var a = 1;
    connection.query('SELECT `user_id` FROM `users` WHERE `name` = ?',[userName],function(err,result){
      idFromUserName = result[0].user_id;
      connection.query('SELECT `salt` FROM `users` WHERE `user_id` = ?',[idFromUserName],function(err,result){
        saltFromId = result[0].salt;
        var password = req.body.password;
        password = toHash(password,saltFromId);
        connection.query('SELECT `hash` FROM `users` WHERE `user_id` = ?',[idFromUserName],function(err,result){
          hashFromId = result[0].hash;
          if(password === hashFromId){
            req.session.user_id = idFromUserName;
            res.redirect('/PHH_Bookmark/topPage');
          }else{
            req.session.user_id = false;
            res.render('login.ejs',{
              noUser:'入力した値からユーザーが探せません。'
            });
          }
        });
      });
    });
  }
});

module.exports = router;
