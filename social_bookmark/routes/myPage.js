var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var client = require('cheerio-httpcli');
var bookmarkData;

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,result){
    bookmarkData = result;
    res.render('myPage.ejs',{
      bookmarkData : bookmarkData
    });
  });
});

router.post('/',function(req,res){
  var userId = req.session.user_id;
  var url = req.body.url;
  var title = req.body.title;
  var description = req.body.description;
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  var checkInjection = /[%;+-]+/g;
  if(checkUrl.test(url)){
    if(!checkInjection.test(title)){
      if(!checkInjection.test(description)){
        if(title.length <= 32){
          if(description.length <= 128){
            var createBookmark = 'INSERT INTO `bookmarks` (`user_id`,`title`,`url`,`description`) VALUES (?, ?, ?, ?)';
            connection.query(createBookmark,[userId,title,url,description]);
            res.redirect('/PHH_Bookmark/myPage');
          }else{
            var userId = req.session.user_id;
            var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
            connection.query(query,[userId],function(err,result){
              bookmarkData = result;
              res.render('myPage.ejs',{
                bookmarkData : bookmarkData,
                url : url,
                title : title,
                description : description,
                descriptionNotice : '説明文は128文字以内です'
              });
            });
          }
        }else{
          var userId = req.session.user_id;
          var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
          connection.query(query,[userId],function(err,result){
            bookmarkData = result;
            res.render('myPage.ejs',{
              bookmarkData : bookmarkData,
              url : url,
              title : title,
              description : description,
              titleNotice : 'タイトルは32文字以内です'
            });
          });
        }
      }else{
        var userId = req.session.user_id;
        var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
        connection.query(query,[userId],function(err,result){
          bookmarkData = result;
          res.render('myPage.ejs',{
            bookmarkData : bookmarkData,
            url : url,
            title : title,
            description : description,
            descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません'
          });
        });
      }
    }else{
      var userId = req.session.user_id;
      var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
      connection.query(query,[userId],function(err,result){
        bookmarkData = result;
        res.render('myPage.ejs',{
          bookmarkData : bookmarkData,
          url : url,
          title : title,
          description : description,
          titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません'
        });
      });
    }
  }else{
    var userId = req.session.user_id;
    var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
    connection.query(query,[userId],function(err,result){
      bookmarkData = result;
      res.render('myPage.ejs',{
        bookmarkData : bookmarkData,
        urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください'
      });
    });
  }
});

router.post('/submitUrl',function(req,res){
  var url = req.body.result;
  var userId = req.session.user_id;
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  if(checkUrl.test(url)){
    var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
    connection.query(selectBookmarkData,[userId],function(err,result){
      client.fetch(url).then(function(result){
        res.render('myPage.ejs',{
          bookmarkData : bookmarkData,
          title : result.$('title').text(),
          url : url
        });
      });
    });
  }else{
    var userId = req.session.user_id;
    var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
    connection.query(query,[userId],function(err,result){
      bookmarkData = result;
      res.render('myPage.ejs',{
        bookmarkData : bookmarkData,
        urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください'
      });
    });
  }
});

router.post('/delete',function(req,res){
  var ids = req.body;
  for(var x in ids){
    var query = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ?'
    connection.query(query,[x]);
  }
  res.redirect('/PHH_Bookmark/myPage');
});

module.exports = router;
