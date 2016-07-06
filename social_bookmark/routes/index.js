var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');


router.get('/',function(req,res){
  var a = 1;
  var query = 'SELECT * FROM `user_bookmarks` WHERE `id` = ?';
  connection.query(query,[a],function(err,rows){
    res.render('test.ejs',{
      list : rows
    });
  });
});
router.post('/submit',function(req,res){
  var newBookmarkUrl = req.body.new_bookmark_url;
  var newBookmarkTitle = req.body.title;
  var newBookmarkDescription = req.body.description;
  var query = 'INSERT INTO `user_bookmarks` (`title`,`url`,`description`) VALUES(?, ? ,?)';
  connection.query(query,[newBookmarkTitle,newBookmarkUrl,newBookmarkDescription],function(err,rows){
    res.redirect('/view');
  });
});

module.exports = router;
