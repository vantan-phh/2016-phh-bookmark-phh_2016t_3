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
  connection.query(updateBookmarkData,[title,description,bookmarkId]);
  if(title.length > 32 && description.length > 128){
    res.render('myBookmarkEdit.ejs',{
      tooLongTitle : 'タイトルが長すぎます。',
      tooLongDescription : '説明が長すぎます。',
      title : title,
      description : description,
      url : url
    });
  }else if(title.length > 32){
    res.render('myBookmarkEdit.ejs',{
      tooLongTitle : 'タイトルが長すぎます。',
      title : title,
      description : description,
      url : url
    });
  }else if(description.length > 128){
    res.render('myBookmarkEdit.ejs',{
      tooLongDescription : '説明が長すぎます。',
      title : title,
      description : description,
      url : url
    });
  }else{
    var query = 'INSERT INTO `bookmarks` (`user_id`,`title`,`url`,`description`) VALUES(?, ?, ?, ?)';
    connection.query(query,[userId,title,url,description],function(err,result){
      res.redirect('/PHH_Bookmark/myPage');
    });
  }
});

module.exports = router;
