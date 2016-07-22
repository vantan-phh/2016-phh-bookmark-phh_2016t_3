var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var len;

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,result){
    var bookmarkId = new Array(result.length);
    len = result.length;
    for(var i = 0; i < result.length; i++){
      bookmarkId[i] = result[i].bookmark_id;
    }
    res.render('myPage.ejs',{
      list : result,
      bookmark_id : bookmarkId
    });
  });
});
router.post('/',function(req,res){
  var newBookmarkUrl = req.body.new_bookmark_url;
  req.session.url = newBookmarkUrl;
  res.redirect('/PHH_Bookmark/myBookmarkEdit');
});

router.post('/delete',function(req,res){
  var hoge = req.body;
  for(var x in hoge){
    x = x.split('id');
    var query = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ?'
    connection.query(query,[x[1]]);
  }
  res.redirect('/PHH_Bookmark/myPage');
});

module.exports = router;
