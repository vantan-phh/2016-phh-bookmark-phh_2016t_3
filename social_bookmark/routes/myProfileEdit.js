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
  var nickName = req.body.nick_name;
  var introduction = req.body.introduction;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  if(checkSpace.test(nickName)){
    if(!checkInjection.test(introduction)){
      if(!checkInjection.test(nickName)){
        if(nickName.length <= 32){
          if(introduction.length <= 128){
            if(req.file !== undefined){
              var path = req.file.path;
              if(nickName === ''){
                var query = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
                connection.query(query,[userId],function(err,result){
                  nickName = result[0].name;
                });
              }
              cloudinary.uploader.upload(path, function(result){
                var imagePath = result.url;
                console.log(imagePath);
                var query = 'UPDATE `users` SET `nick_name` = ?,`image_path` = ?,`introduction` = ? WHERE `user_id` = ?';
                connection.query(query,[nickName,imagePath,introduction,userId],function(err,result){
                  res.redirect('/PHH_Bookmark/myProfile');
                });
              });
            }else{
              if(nickName === ''){
                var query = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
                connection.query(query,[userId],function(err,result){
                  nickName = result[0].name;
                });
              }
              var query = 'UPDATE `users` SET `nick_name` = ?, `introduction` = ? WHERE `user_id` = ?';
              connection.query(query,[nickName,introduction,userId],function(err,result){
                res.redirect('/PHH_Bookmark/myProfile');
              });
            }
          }else{
            var userId = req.session.user_id;
            var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
            connection.query(query,[userId],function(err,result){
              var nickName = result[0].nick_name;
              var imagePath = result[0].image_path;
              res.render('myProfileEdit.ejs',{
                nickName : nickName,
                imagePath : imagePath,
                introduction : introduction,
                introductionNotice : '自己紹介文は128文字以下です'
              });
            });
          }
        }else{
          var userId = req.session.user_id;
          var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
          connection.query(query,[userId],function(err,result){
            var nickName = result[0].nick_name;
            var imagePath = result[0].image_path;
            res.render('myProfileEdit.ejs',{
              nickName : nickName,
              imagePath : imagePath,
              introduction : introduction,
              nickNameNotice : 'ニックネームは32文字以下です'
            });
          });
        }
      }else{
        var userId = req.session.user_id;
        var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(query,[userId],function(err,result){
          var nickName = result[0].nick_name;
          var imagePath = result[0].image_path;
          res.render('myProfileEdit.ejs',{
            nickName : nickName,
            imagePath : imagePath,
            introduction : introduction,
            nickNameNotice : 'セキュリティ上の観点からニックネームに「+, -, %, ;」は使えません'
          });
        });
      }
    }else{
      var userId = req.session.user_id;
      var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
      connection.query(query,[userId],function(err,result){
        var nickName = result[0].nick_name;
        var imagePath = result[0].image_path;
        res.render('myProfileEdit.ejs',{
          nickName : nickName,
          imagePath : imagePath,
          introduction : introduction,
          introductionNotice : 'セキュリティ上の観点から自己紹介文に「+, -, %, ;」は使えません'
        });
      });
    }
  }else{
    var userId = req.session.user_id;
    var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
    connection.query(query,[userId],function(err,result){
      var nickName = undefined;
      var imagePath = result[0].image_path;
      res.render('myProfileEdit.ejs',{
        nickName : nickName,
        imagePath : imagePath,
        introduction : introduction,
        nickNameNotice : 'ニックネームを入力してください'
      });
    });
  }
});

module.exports = router;
