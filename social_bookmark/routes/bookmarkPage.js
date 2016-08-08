var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', function(req, res){
  var userId = req.session.user_id;
  var bookmarkId = req.session.bookmark_id;
  var commentNickNameArr = [];
  var query = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
  connection.query(query, [bookmarkId], function(err, result){
    var queryResult = result;
    if(result.length !== 0){
      for(var i = 0; i < queryResult.length; i++){
        var commentUserId = queryResult[i].user_id;
        var pullUserName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?'
        connection.query(pullUserName, [commentUserId],function(err, result){
          var nickName = result[0].nick_name;
          commentNickNameArr.push(nickName);
          if(commentNickNameArr.length === queryResult.length){
            var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
            connection.query(pullBookmark, [bookmarkId], function(err, result){
              res.render('bookmarkPage.ejs',{
                comments : queryResult,
                bookmark : result,
                browsingUserId : userId,
                commentNickName : commentNickNameArr
              });
            });
          }
        });
      }
    }else{
      var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
      connection.query(pullBookmark, [bookmarkId], function(err, result){
        res.render('bookmarkPage.ejs',{
          bookmark : result,
          browsingUserId : userId,
          commentNickName : commentNickNameArr
        });
      });
    }
  });
});

router.post('/', function(req, res){
  var userId = req.session.user_id;
  var bookmarkId = req.session.bookmark_id;
  var commentText = req.body.comment_text;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  if(checkSpace.test(commentText)){
    if(!checkInjection.test(commentText)){
      var query = 'INSERT INTO `comments` (`bookmark_id`, `user_id`, `body`) VALUES(?, ?, ?)';
      connection.query(query, [bookmarkId, userId, commentText], function(err, result){
        res.redirect('/PHH_Bookmark/bookmarkPage');
      });
    }else{
      var userId = req.session.user_id;
      var bookmarkId = req.session.bookmark_id;
      var commentNickNameArr = [];
      var query = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
      connection.query(query, [bookmarkId], function(err, result){
        var queryResult = result;
        for(var i = 0; i < queryResult.length; i++){
          var commentUserId = queryResult[i].user_id;
          var pullUserName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?'
          connection.query(pullUserName, [commentUserId],function(err, result){
            var nickName = result[0].nick_name;
            commentNickNameArr.push(nickName);
            if(commentNickNameArr.length === queryResult.length){
              var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
              connection.query(pullBookmark, [bookmarkId], function(err, result){
                res.render('bookmarkPage.ejs',{
                  comments : queryResult,
                  bookmark : result,
                  browsingUserId : userId,
                  commentNickName : commentNickNameArr,
                  commentNotice : 'セキュリティ上の観点からコメントに「+, -, %, ;」は使えません'
                });
              });
            }
          });
        }
      });
    }
  }else{
    res.redirect('/PHH_Bookmark/bookmarkPage');
  }
});

router.post('/delete', function(req, res){
  var deleteComment = req.body.result;
  var query = 'DELETE FROM `comments` WHERE `comment_id` = ?'
  connection.query(query, [deleteComment], function(err, result){
    res.redirect('/PHH_Bookmark/bookmarkPage');
  });
});

module.exports = router;
