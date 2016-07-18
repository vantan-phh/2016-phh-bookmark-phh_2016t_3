var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var userId = req.session.user_id;
  var query = 'SELECT * FROM `user_bookmarks` WHERE `id` = ?';
  connection.query(query,[userId],function(err,rows){
    res.render('myPage.ejs',{
      list : rows
    });
  });
});
router.post('/',function(req,res){
  var newBookmarkUrl = req.body.new_bookmark_url;
  //var newBookmarkTitle = req.body.title;
  //var newBookmarkDescription = req.body.description;
  var query = 'INSERT INTO `user_bookmarks` (`title`,`url`,`description`) VALUES(?, ? ,?)';
  connection.query(query,[newBookmarkTitle,newBookmarkUrl,newBookmarkDescription],function(err,rows){
    res.redirect('/myPage');
  });
});

module.exports = router;
