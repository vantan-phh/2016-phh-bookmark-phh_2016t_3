var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
  connection.query(query,[userId],function(err,result){
    res.render('topPage.ejs',{
      list : result
    });
  });
});
router.post('/submit',function(req,res){
  var newBookmarkUrl = req.body.new_bookmark_url;
  var newBookmarkTitle = req.body.title;
  var newBookmarkDescription = req.body.description;
  var query = 'INSERT INTO `user_bookmarks` (`title`,`url`,`description`) VALUES(?, ? ,?)';
  connection.query(query,[newBookmarkTitle,newBookmarkUrl,newBookmarkDescription],function(err,result){
    res.redirect('/topPage');
  });
});

module.exports = router;
