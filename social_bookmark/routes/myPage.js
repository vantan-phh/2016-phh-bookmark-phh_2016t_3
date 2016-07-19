var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,rows){
    res.render('myPage.ejs',{
      list : rows
    });
  });
});
router.post('/',function(req,res){
  var newBookmarkUrl = req.body.new_bookmark_url;
  req.session.url = newBookmarkUrl;
  res.redirect('/PHH_Bookmark/myBookmarkEdit');
});

module.exports = router;
