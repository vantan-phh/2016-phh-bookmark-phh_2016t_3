var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  var userId = req.session.user_id;
  var query = 'SELECT `name`,`nick_name`,`image_path`,`introduction` FROM `users` WHERE `user_id` = ?';
  connection.query(query, [userId]).then((result) => {
    var nickName = result[0][0].nick_name;
    var thumbnailPath = result[0][0].image_path;
    var introduction = result[0][0].introduction;
    var userName = result[0][0].name;
    if(nickName === null){
      nickName = userName;
    }
    if(thumbnailPath === null){
      thumbnailPath = 'http://res.cloudinary.com/dy4f7hul5/image/upload/v1469220623/sample.jpg';
    }
    if(introduction === null || introduction === ''){
      introduction = '自己紹介';
    }
    res.render('myProfile.ejs', {
      nickName,
      thumbnailPath,
      introduction,
    });
  });
});


module.exports = router;
