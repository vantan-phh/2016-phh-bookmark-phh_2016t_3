var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT `name`,`nick_name`,`img_dat`,`introduction` FROM `users` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,result){
    var nickName = result[0].nick_name;
    var thumbnail = result[0].img_dat;
    var introduction = result[0].introduction;
    var userName = result[0].name;
    console.log(thumbnail);
    if(nickName === null){
      nickName = userName;
    }
    if(thumbnail === null){
      thumbnail = 'img/favicon_Prototype.ico';
    }
    if(introduction === null){
      introduction = '自己紹介';
    }
    res.render('myProfile.ejs',{
      nickName : nickName,
      thumbnail : thumbnail,
      introduction : introduction
    });
  });
});


module.exports = router;
