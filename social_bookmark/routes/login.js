var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

const crypto = require('crypto');

router.get('/', function(req, res) {
  // if (req.session.id) {
  //   res.redirect('/PHH_Bookmark/view');
  // } else {
    res.render('login.ejs');
//   }
});
router.post('/', function(req, res){
  var eMailOrUserName = req.body.email_or_user_name;
  var re = /@/g;
  if(re.test(eMailOrUserName)){
    var eMail = eMailOrUserName;
    var idFromMail = connection.query('SELECT `id` FROM `users` WHERE `mail` = ?',[eMail]);
  }else{
    var userName = eMailOrUserName;
    var idFromUserName = connection.query('SELECT `id` FROM `users` WHERE `user_name` = ?',[userName]);
  }
  var password = req.body.password;
  var saltFromId = connection.query('SELECT `salt` FROM `hashes` WHERE `id` = ?',[idFromMail]);
  var hash = crypto.createHash('sha256');
  password += saltFromId;
  hash.update(password);
  var a = hash.digest('hex');
  for(var i = 0; i < 10000; i++){
    var h = crypto.createHash('sha256');
    var b = h.update(a);
    b = b.digest('hex');
    a = b;
  }
  password = b;
  var hashFromId = connection.query('SELECT `hash` FROM `hashes` WHERE `id` = ?',[idFromMail]);
  if(eMail){
    if(password === hashFromId){
      req.session.id = idFromMail;
      res.redirect('/PHH_Bookmark/view');
    }else{
      req.session.id = false;
      res.render('login.ejs',{
        noUser:'入力した値からユーザーが探せません。'
      });
    }
  }else if(userName){
    if(password === hashFromId){
      //req.session.id = idFromUserName;
      res.redirect('/PHH_Bookmark/topPage');
    }else{
      //req.session.id = false;
      res.render('login.ejs',{
        noUser:'入力した値からユーザーが探せません。'
      });
    }
  }
});

module.exports = router;
