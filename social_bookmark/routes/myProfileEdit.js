var express = require('express');

var router = express.Router();
var multer = require('multer');
var connection = require('../mysqlConnection');

var upload = multer({ dest : './PHH_Bookmark/view/img/uploads/' });
var cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name : 'dy4f7hul5',
  api_key : '925664739655858',
  api_secret : 'sbP8YsyWrhbf-vyZDsq4-6Izd_8',
});

router.get('/', (req, res) => {
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
  connection.query(query, [userId]).then((result) => {
    var nickName = result[0][0].nick_name;
    var imagePath = result[0][0].image_path;
    var introduction = result[0][0].introduction;
    res.render('myProfileEdit.ejs', {
      nickName,
      imagePath,
      introduction,
    });
  });
});

router.post('/', upload.single('image_file'), (req, res) => {
  var userId = req.session.user_id;
  var nickName = req.body.nick_name;
  var introduction = req.body.introduction;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  (() => {
    var promise = new Promise((resolve) => {
      if(checkSpace.test(nickName)){
        resolve();
      }else{
        var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(query, [userId]).then((result) => {
          nickName = undefined;
          var imagePath = result[0][0].image_path;
          res.render('myProfileEdit.ejs', {
            nickName,
            imagePath,
            introduction,
            nickNameNotice : 'ニックネームを入力してください',
          });
        });
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(introduction)){
        resolve();
      }else{
        var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(query, [userId]).then((result) => {
          nickName = result[0][0].nick_name;
          var imagePath = result[0][0].image_path;
          res.render('myProfileEdit.ejs', {
            nickName,
            imagePath,
            introduction,
            introductionNotice : 'セキュリティ上の観点から自己紹介文に「+, -, %, ;」は使えません',
          });
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(nickName)){
        resolve();
      }else{
        var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(query, [userId]).then((result) => {
          nickName = result[0][0].nick_name;
          var imagePath = result[0][0].image_path;
          res.render('myProfileEdit.ejs', {
            nickName,
            imagePath,
            introduction,
            nickNameNotice : 'セキュリティ上の観点からニックネームに「+, -, %, ;」は使えません',
          });
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(nickName.length <= 32){
        resolve();
      }else{
        var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(query, [userId]).then((result) => {
          nickName = result[0][0].nick_name;
          var imagePath = result[0][0].image_path;
          res.render('myProfileEdit.ejs', {
            nickName,
            imagePath,
            introduction,
            nickNameNotice : 'ニックネームは32文字以下です',
          });
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(introduction.length <= 128){
        resolve();
      }else{
        var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(query, [userId]).then((result) => {
          nickName = result[0][0].nick_name;
          var imagePath = result[0][0].image_path;
          res.render('myProfileEdit.ejs', {
            nickName,
            imagePath,
            introduction,
            introductionNotice : '自己紹介文は128文字以下です',
          });
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(req.file === undefined){
        var query = 'UPDATE `users` SET `nick_name` = ?, `introduction` = ? WHERE `user_id` = ?';
        connection.query(query, [nickName, introduction, userId]).then(() => {
          res.redirect('/PHH_Bookmark/myProfile');
        });
      }else{
        resolve();
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var path = req.file.path;
      cloudinary.uploader.upload(path, (result) => {
        var imagePath = result.url;
        resolve(imagePath);
      });
    });
    return promise;
  }).then((value) => {
    var imagePath = value;
    if(imagePath === undefined){
      res.render('myProfileEdit.ejs', {
        nickName,
        imagePath,
        introduction,
        thumbailNotice : '画像ファイルが正しく読み込めませんでした。',
      });
    }else{
      var editProfileQuery = 'UPDATE `users` SET `nick_name` = ?, `image_path` = ?, `introduction` = ? WHERE `user_id` = ?';
      connection.query(editProfileQuery, [nickName, imagePath, introduction, userId]).then(() => {
        res.redirect('/PHH_Bookmark/myProfile');
      });
    }
  });
});

module.exports = router;
