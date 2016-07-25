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
  var query = '';
  res.render('myProfileEdit.ejs');
});

router.post('/',upload.single('image_file'),function(req,res){
  var nickName = req.body.nick_name;
  var path = req.file.path;
  var introduction = req.body.introduction;
  var userId = req.session.user_id;
  cloudinary.uploader.upload(path, function(result){
    var imagePath = result.url;
    var query = 'UPDATE `users` SET `nick_name` = ?,`image_path` = ?,`introduction` = ? WHERE `user_id` = ?';
    connection.query(query,[nickName,imagePath,introduction,userId],function(err,result){
      res.redirect('/PHH_Bookmark/myProfile');
    });
  });
});

module.exports = router;
