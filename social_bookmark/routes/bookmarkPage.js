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
      if(queryResult.length > 0){
        var bookmarkIdsForQuery = '';
        queryResult.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            bookmarkIdsForQuery += currentValue.bookmark_id;
            var values = {
              queryResult,
              bookmarkIdsForQuery,
            };
            resolve(values);
          }else{
            bookmarkIdsForQuery += currentValue.bookmark_id + ' OR `bookmark_id` = ';
          }
        });
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
  }).then((values) => {
    var userIdsForQuery = values.userIdsForQuery;
    var queryResult = values.queryResult;
    var promise = new Promise((resolve) => {
      var pullNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ' + userIdsForQuery;
      connection.query(pullNickName).then((result) => {
        var nickNames = result[0];
        values = {
          nickNames,
          queryResult,
        };
        resolve(values);
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
        var queryResult = value;
        var promise = new Promise((resolve) => {
          var userIdsForQuery = '';
          queryResult.forEach((currentValue, index, array) => {
            if(index + 1 === array.length){
              userIdsForQuery += currentValue;
              var values = {
                queryResult,
                userIdsForQuery,
              };
              resolve(values);
            }else{
              userIdsForQuery += currentValue + ' OR `user_id` = ';
            }
          });
        });
        return promise;
      }).then((values) => {
        var queryResult = values.queryResult;
        var userIdsForQuery = values.userIdsForQuery;
        var promise = new Promise((resolve) => {
          var pullNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ' + userIdsForQuery;
          connection.query(pullNickName).then((result) => {
            var nickNames = result[0];
            values = {
              queryResult,
              nickNames,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((values) => {
        var queryResult = values.queryResult;
        var nickNames = values.nickNames;
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
