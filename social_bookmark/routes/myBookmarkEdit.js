var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

var bookmarkId;
var url;

router.get('/', (req, res) => {
  bookmarkId = req.query.result;
  var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
  connection.query(selectBookmarkData, [bookmarkId]).then((result) => {
    var title = result[0][0].title;
    url = result[0][0].url;
    var description = result[0][0].description;
    res.render('myBookmarkEdit.ejs', {
      title,
      url,
      description,
    });
  });
});

router.post('/', (req, res) => {
  var title = req.body.title;
  var description = req.body.description;
  var updateBookmarkData = 'UPDATE `bookmarks` SET `title` = ?, `description` = ? WHERE `bookmark_id` = ?';
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  (() => {
    var promise = new Promise((resolve) => {
      if(checkSpace.test(title)){
        resolve();
      }else{
        res.render('myBookmarkEdit.ejs', {
          titleNotice : 'タイトルを入力してください',
          description,
          title,
          url,
        });
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(description)){
        resolve();
      }else{
        res.render('myBookmarkEdit.ejs', {
          descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません',
          description,
          title,
          url,
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(title)){
        resolve();
      }else{
        res.render('myBookmarkEdit.ejs', {
          titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません',
          title,
          description,
          url,
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(title.length <= 32){
        resolve();
      }else{
        res.render('myBookmarkEdit.ejs', {
          titleNotice : 'タイトルは32文字以内です',
          title,
          description,
          url,
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(description.length <= 128){
        resolve();
      }else{
        res.render('myBookmarkEdit.ejs', {
          descriptionNotice : '説明文は128文字以内です',
          title,
          description,
          url,
        });
      }
    });
    return promise;
  }).then(() => {
    connection.query(updateBookmarkData, [title, description, bookmarkId]).then(() => {
      res.redirect('/PHH_Bookmark/myPage');
    });
  });
});

module.exports = router;
