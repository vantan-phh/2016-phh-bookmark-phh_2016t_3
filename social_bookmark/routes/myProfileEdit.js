var express = require('express');
var router = express.Router();
var multer = require('multer');
var connection = require('../mysqlConnection');
var upload = multer({dest:'./PHH_Bookmark/view/img/uploads/'});
var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dy4f7hul5',
  api_key: '925664739655858',
  api_secret: 'sbP8YsyWrhbf-vyZDsq4-6Izd_8'
});

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,result){
    var nickName = result[0].nick_name;
    var imagePath = result[0].image_path;
    var introduction = result[0].introduction;
    res.render('myProfileEdit.ejs',{
      nickName : nickName,
      imagePath : imagePath,
      introduction : introduction
    });
  });
});

router.post('/',upload.single('image_file'),function(req,res){
  var userId = req.session.user_id;
  if(req.file !== undefined){
    var path = req.file.path;
    var nickName = req.body.nick_name;
    if(nickName === ''){
      var query = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
      connection.query(query,[userId],function(err,result){
        nickName = result[0].name;
      });
    }
    var introduction = req.body.introduction;
    cloudinary.uploader.upload(path, function(result){
      var imagePath = result.url;
      console.log(imagePath);
      var query = 'UPDATE `users` SET `nick_name` = ?,`image_path` = ?,`introduction` = ? WHERE `user_id` = ?';
      connection.query(query,[nickName,imagePath,introduction,userId],function(err,result){
        res.redirect('/PHH_Bookmark/myProfile');
      });
    });
  }else{
    var nickName = req.body.nick_name;
    if(nickName === ''){
      var query = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
      connection.query(query,[userId],function(err,result){
        nickName = result[0].name;
      });
    }
    var introduction = req.body.introduction;
    var query = 'UPDATE `users` SET `nick_name` = ?, `introduction` = ? WHERE `user_id` = ?';
    connection.query(query,[nickName,introduction,userId],function(err,result){
      res.redirect('/PHH_Bookmark/myProfile');
    });
  }
});

module.exports = router;
