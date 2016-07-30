var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', function(req, res){
  var userId = req.session.user_id;
  var bookmarkId = req.session.bookmark_id;
  var query = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
  connection.query(query, [bookmarkId], function(err, result){
    var queryResult = result;
    var pullBookmark = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
    connection.query(pullBookmark, [bookmarkId], function(err, result){
      res.render('bookmarkPage.ejs',{
        comments : queryResult,
        bookmark : result,
        browsingUserId : userId
      })
    })
  })
});

router.post('/', function(req, res){
  var userId = req.session.user_id;
  var bookmarkId = req.session.bookmark_id;
  var commentText = req.body.comment_text;
  var query = 'INSERT INTO `comments` (`bookmark_id`, `user_id`, `body`) VALUES(?, ?, ?)';
  connection.query(query, [bookmarkId, userId, commentText], function(err, result){
    res.redirect('/PHH_Bookmark/bookmarkPage');
  })
})

router.post('/delete', function(req, res){
  var deleteComment = req.body.result;
  var query = 'DELETE FROM `comments` WHERE `comment_id` = ?'
  connection.query(query, [deleteComment], function(err, result){
    res.redirect('/PHH_Bookmark/bookmarkPage');
  });
})

module.exports = router;
