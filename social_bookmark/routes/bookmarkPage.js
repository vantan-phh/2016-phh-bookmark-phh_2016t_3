var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  if(req.session.comment) delete req.session.comment;
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
      var userData = [];
      queryResult.forEach((currentValue, index, array) => {
        var pullUserData = 'SELECT * FROM `users` WHERE `user_id` = ?';
        connection.query(pullUserData, [currentValue.user_id]).then((result) => {
          if(index + 1 === array.length){
            userData.push(result[0][0]);
            var values = {
              queryResult,
              userData,
            };
            resolve(values);
          }else{
            userData.push(result[0][0]);
          }
        });
      });
    });
    return promise;
  }).then((values) => {
    var userData = values.userData;
    var queryResult = values.queryResult;
    var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
    connection.query(pullBookmark, [bookmarkId]).then((result) => {
      res.render('bookmarkPage.ejs', {
        comments : queryResult,
        bookmark : result[0],
        browsingUserId : userId,
        commentUserData : userData,
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
          if(req.session.comment === commentText){
            delete req.session.comment;
            res.redirect('/PHH_Bookmark/bookmarkPage');
          }else{
            resolve();
          }
        });
        return promise;
      })().then(() => {
        var promise = new Promise((resolve) => {
          var query = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
          connection.query(query, [bookmarkId]).then((result) => {
            var queryResult = result[0];
            resolve(queryResult);
          });
        });
        return promise;
      }).then((value) => {
        var promise = new Promise((resolve) => {
          var queryResult = value;
          if(queryResult.length > 0){
            resolve(queryResult);
          }else{
            var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
            connection.query(pullBookmark, [bookmarkId]).then((result) => {
              if(req.session.comment) delete req.session.comment;
              req.session.comment = commentText;
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
            var pullNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
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
          if(req.session.comment) delete req.session.comment;
          req.session.comment = commentText;
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
    if(req.session.comment) delete req.session.comment;
    req.session.comment = commentText;
    res.redirect('/PHH_Bookmark/bookmarkPage');
  }
});

router.post('/delete', (req, res) => {
  if(req.session.comment) delete req.session.comment;
  var deleteComment = req.body.result;
  var query = 'DELETE FROM `comments` WHERE `comment_id` = ?';
  connection.query(query, [deleteComment]).then(() => {
    res.redirect('/PHH_Bookmark/bookmarkPage');
  });
});

module.exports = router;
