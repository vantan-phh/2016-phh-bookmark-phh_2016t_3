var express = require('express');
var client = require('cheerio-httpcli');
var router = express.Router();
var connection = require('../mysqlConnection');
var bookmarkId;
var url;

router.get('/',function(req,res){
  bookmarkId = req.query.result;
  var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
  connection.query(selectBookmarkData,[bookmarkId],function(err,result){
    var title = result[0].title;
    url = result[0].url;
    var description = result[0].description;
    res.render('myBookmarkEdit.ejs',{
      title : title,
      url : url,
      description : description
    });
  });
});

router.post('/',function(req,res){
  var title = req.body.title;
  var description = req.body.description;
  var userId = req.session.user_id;
  var updateBookmarkData = 'UPDATE `bookmarks` SET `title` = ?, `description` = ? WHERE `bookmark_id` = ?';
  var checkInjection = /[%;+-]+/g;
  if(!checkInjection.test(description)){
    if(!checkInjection.test(title)){
      if(title.length <= 32){
        if(description.length <= 128){
          connection.query(updateBookmarkData,[title,description,bookmarkId]);
        }else{
          res.render('myBookmarkEdit.ejs',{
            tooLongDescription : '説明が長すぎます。',
            title : title,
            description : description,
            url : url
          });
        }
      }else{
        res.render('myBookmarkEdit.ejs',{
          tooLongTitle : 'タイトルが長すぎます。',
          title : title,
          description : description,
          url : url
        });
      }
    }else{
      res.render('myBookmarkEdit.ejs', {
        titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません',
        title : title,
        description : description,
        url : url
      });
    }
  }else{
    res.render('myBookmarkEdit.ejs', {
      descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません',
      description : description,
      title : title,
      url : url
    });
  }
});

module.exports = router;
