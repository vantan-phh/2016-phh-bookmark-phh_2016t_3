var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  var userId = req.session.user_id;
  var bookmarkId = req.session.bookmark_id;
  (() => {
    var promise = new Promise((resolve) => {
      var query = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
      connection.query(query, [bookmarkId]).then((result) => {
        var queryResult = result[0];
        resolve(queryResult);
      });
    });
    return promise;
  })().then((value) => {
    var promise = new Promise((resolve) => {
      var queryResult = value;
      console.log(queryResult);
      if(queryResult.length > 0){
        resolve(queryResult);
      }else{
        var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
        connection.query(pullBookmark, [bookmarkId]).then((result) => {
          console.log(result[0]);
          res.render('bookmarkPage.ejs', {
            bookmark : result[0],
            browsingUserId : userId,
          });
        });
      }
    });
    return promise;
  }).then((value) => {
    var queryResult = value;
    var promise = new Promise((resolve) => {
      var nickNames = [];
      queryResult.forEach((currentValue, index, array) => {
        var pullNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?'
        connection.query(pullNickName, [currentValue.user_id]).then((result) => {
          if(index + 1 === array.length){
            nickNames.push(result[0][0].nick_name);
            var values = {
              queryResult,
              nickNames,
            };
            resolve(values);
          }else{
            nickNames.push(result[0][0].nick_name);
          }
        });
      });
    });
    return promise;
  }).then((values) => {
    var nickNames = values.nickNames;
    var queryResult = values.queryResult;
    var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
    connection.query(pullBookmark, [bookmarkId]).then((result) => {
      res.render('bookmarkPage.ejs', {
        comments : queryResult,
        bookmark : result[0],
        browsingUserId : userId,
        commentNickName : nickNames,
      });
    });
  });
});

router.post('/', (req, res) => {
  var userId = req.session.user_id;
  var bookmarkId = req.session.bookmark_id;
  var commentText = req.body.comment_text;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  if(checkSpace.test(commentText)){
    if(!checkInjection.test(commentText)){
      var insertComment = 'INSERT INTO `comments` (`bookmark_id`, `user_id`, `body`) VALUES(?, ?, ?)';
      connection.query(insertComment, [bookmarkId, userId, commentText]).then(() => {
        res.redirect('/PHH_Bookmark/bookmarkPage');
      });
    }else{
      (() => {
        var promise = new Promise((resolve) => {
          var query = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
          connection.query(query, [bookmarkId]).then((result) => {
            var queryResult = result[0];
            resolve(queryResult);
          });
        });
        return promise;
      })().then((value) => {
        var promise = new Promise((resolve) => {
          var queryResult = value;
          console.log(queryResult);
          if(queryResult.length > 0){
            resolve(queryResult);
          }else{
            var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
            connection.query(pullBookmark, [bookmarkId]).then((result) => {
              res.render('bookmarkPage.ejs', {
                bookmark : result[0],
                browsingUserId : userId,
              });
            });
          }
        });
        return promise;
      }).then((value) => {
        var queryResult = value;
        var promise = new Promise((resolve) => {
          var nickNames = [];
          queryResult.forEach((currentValue, index, array) => {
            var pullNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?'
            connection.query(pullNickName, [currentValue.user_id]).then((result) => {
              if(index + 1 === array.length){
                nickNames.push(result[0][0].nick_name);
                var values = {
                  queryResult,
                  nickNames,
                };
                resolve(values);
              }else{
                nickNames.push(result[0][0].nick_name);
              }
            });
          });
        });
        return promise;
      }).then((values) => {
        var nickNames = values.nickNames;
        var queryResult = values.queryResult;
        var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
        connection.query(pullBookmark, [bookmarkId]).then((result) => {
          res.render('bookmarkPage.ejs', {
            comments : queryResult,
            bookmark : result[0],
            browsingUserId : userId,
            commentNickName : nickNames,
            commentNotice : 'セキュリティ上の観点からコメントに「+, -, %, ;」は使えません',
          });
        });
      });
    }
  }else{
    res.redirect('/PHH_Bookmark/bookmarkPage');
  }
});

router.post('/delete', (req, res) => {
  var deleteComment = req.body.result;
  var query = 'DELETE FROM `comments` WHERE `comment_id` = ?';
  connection.query(query, [deleteComment]).then(() => {
    res.redirect('/PHH_Bookmark/bookmarkPage');
  });
});

module.exports = router;
