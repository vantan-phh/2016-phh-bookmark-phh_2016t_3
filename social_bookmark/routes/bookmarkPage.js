var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', function(req, res){
  res.render('bookmarkPage.ejs');

});

router.post('/', function(req, res){
  var commentText = req.body.comment_text;
  var userId = req.session.user_id;
  var bookmarkId = req.session.bookmark_id;
  console.log(bookmarkId);
  var query = 'INSERT INTO `comments` (`bookmark_id`, `user_id`, `body`) VALUES(?, ?, ?)';
  connection.query(query, [bookmarkId, userId, commentText], function(err, result){
    console.log(err);
    res.redirect('/PHH_Bookmark/bookmarkPage');
  })

})

module.exports = router;
