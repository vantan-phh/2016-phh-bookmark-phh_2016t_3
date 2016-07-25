var express = require('express');
var client = require('cheerio-httpcli');
var router = express.Router();
var connection = require('../mysqlConnection');

var exist;

router.get('/',function(req,res){
  var checkUrl = req.session.url;
  checkUrl.toString();
  client.fetch(checkUrl).then(function (result) {
    res.render('myBookmarkEdit.ejs',{
      title : result.$('title').text()
    });
  });
});
router.post('/',function(req,res){
  var userId = req.session.user_id;
  var url = req.session.url;
  var title = req.body.title;
  var description = req.body.description;
  if(title.length > 32 && description.length > 128){
    res.render('myBookmarkEdit.ejs',{
      tooLongTitle : 'タイトルが長すぎます。',
      tooLongDescription : '説明が長すぎます。',
      title : title
    });
  }else if(title.length > 32){
    res.render('myBookmarkEdit.ejs',{
      tooLongTitle : 'タイトルが長すぎます。',
      title : title
    });
  }else if(description.length > 128){
    res.render('myBookmarkEdit.ejs',{
      tooLongDescription : '説明が長すぎます。',
      title : title
    });
  }else if(exist === true){
    var query = 'UPDATE `bookmarks` SET `title` = ?, `description` = ? WHERE `bookmark_id` = ?';
    var bookmarkId = req.session.edit_id;
    connection.query(query,[title, description, bookmarkId],function(err,result){
      res.redirect('/PHH_Bookmark/myPage');
    });
  }else{
    var query = 'INSERT INTO `bookmarks` (`user_id`,`title`,`url`,`description`) VALUES(?, ?, ?, ?)';
    connection.query(query,[userId,title,url,description],function(err,result){
      res.redirect('/PHH_Bookmark/myPage');
    });
  }
});

router.get('/exist',function(req,res){
  var bookmarkId = req.session.edit_id;
  var query = 'SELECT `title`,`description` FROM `bookmarks` WHERE `bookmark_id` = ?';
  connection.query(query,[bookmarkId],function(err,result){
    var title = result[0].title;
    var description = result[0].description;
    exist = true;
    res.render('myBookmarkEdit',{
      title : title,
      description : description
    });
  });
});

module.exports = router;
