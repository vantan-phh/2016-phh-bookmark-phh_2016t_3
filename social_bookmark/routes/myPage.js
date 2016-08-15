var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');
var client = require('cheerio-httpcli');

var bookmarkData;

router.get('/',(req,res) => {
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
  connection.query(query,[userId]).then((result) => {
    bookmarkData = result[0];
    res.render('myPage.ejs',{
      bookmarkData,
    });
  });
});

router.post('/',(req,res) => {
  var userId = req.session.user_id;
  var url = req.body.url;
  var title = req.body.title;
  var description = req.body.description;
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  var checkInjection = /[%;+-]+/g;
  var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
  if(checkUrl.test(url)){
    if(!checkInjection.test(title)){
      if(!checkInjection.test(description)){
        if(title.length <= 32){
          if(description.length <= 128){
            var createBookmark = 'INSERT INTO `bookmarks` (`user_id`,`title`,`url`,`description`) VALUES (?, ?, ?, ?)';
            connection.query(createBookmark,[userId,title,url,description]).then(() => {
              res.redirect('/PHH_Bookmark/myPage');
            });
          }else{
            connection.query(query,[userId]).then((result) => {
              bookmarkData = result[0];
              res.render('myPage.ejs',{
                bookmarkData,
                url,
                title,
                description,
                descriptionNotice : '説明文は128文字以内です',
              });
            });
          }
        }else{
          connection.query(query,[userId]).then((result) => {
            bookmarkData = result[0];
            res.render('myPage.ejs',{
              bookmarkData,
              url,
              title,
              description,
              titleNotice : 'タイトルは32文字以内です',
            });
          });
        }
      }else{
        connection.query(query,[userId]).then((result) => {
          bookmarkData = result[0];
          res.render('myPage.ejs',{
            bookmarkData,
            url,
            title,
            description,
            descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません',
          });
        });
      }
    }else{
      connection.query(query,[userId]).then((result) => {
        bookmarkData = result[0];
        res.render('myPage.ejs',{
          bookmarkData,
          url,
          title,
          description,
          titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません',
        });
      });
    }
  }else{
    connection.query(query,[userId]).then((result) => {
      bookmarkData = result[0];
      res.render('myPage.ejs',{
        bookmarkData,
        urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください',
      });
    });
  }
});

router.post('/submitUrl',(req,res) => {
  var url = req.body.result;
  var userId = req.session.user_id;
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  if(checkUrl.test(url)){
    client.fetch(url).then((result) => {
      res.render('myPage.ejs',{
        bookmarkData,
        title : result.$('title').text(),
        url,
      });
    });
  }else{
    var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
    connection.query(query,[userId]).then((result) => {
      bookmarkData = result[0];
      res.render('myPage.ejs',{
        bookmarkData,
        urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください',
      });
    });
  }
});

router.post('/delete',(req,res) => {
  var ids = req.body;
  (() => {
    var promise = new Promise((resolve) => {
      for(var x in ids){
        var query = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ?';
        connection.query(query,[x]);
      }
      resolve();
    });
    return promise;
  })().then(() => {
    res.redirect('/PHH_Bookmark/myPage');
  });
});

module.exports = router;
