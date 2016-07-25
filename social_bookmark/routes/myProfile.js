var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var multer = require('multer');
var upload = multer({dest:'./PHH_Bookmark/view/img/uploads/'});
var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dy4f7hul5',
  api_key: '925664739655858',
  api_select: 'sbP8YsyWrhbf-vyZDsq4-6Izd_8'
});

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT `name`,`nick_name`,`image_path`,`introduction` FROM `users` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,result){
    var nickName = result[0].nick_name;
    var thumbnailPath = result[0].image_path;
    var introduction = result[0].introduction;
    var userName = result[0].name;
    console.log(thumbnailPath);
    if(nickName === null){
      nickName = userName;
    }
    if(thumbnailPath === null){
      thumbnailPath = 'img/favicon_Prototype.ico';
    }
    if(introduction === null){
      introduction = '自己紹介';
    }
    res.render('myProfile.ejs',{
      nickName : nickName,
      thumbnailPath : thumbnailPath,
      introduction : introduction
    });
  });
});


module.exports = router;
