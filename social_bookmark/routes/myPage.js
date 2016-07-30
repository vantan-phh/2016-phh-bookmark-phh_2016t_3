var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,result){
    var bookmarkId = new Array(result.length);
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
  if(req.session.url){
    delete req.session.url;
  }
  req.session.url = newBookmarkUrl;
  res.redirect('/PHH_Bookmark/myBookmarkEdit');
});

router.post('/delete',function(req,res){
  var ids = req.body;
  for(var x in ids){
    var query = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ?'
    connection.query(query,[x]);
  }
  res.redirect('/PHH_Bookmark/myPage');
});

router.post('/edit',function(req,res){
  if(req.session.edit_id){
    delete req.session.edit_id;
  }
  var id = req.body.result;
  id = id.split('id');
  id = id[1];
  req.session.edit_id = id;
  res.redirect('/PHH_Bookmark/myBookmarkEdit/exist');
});

module.exports = router;
