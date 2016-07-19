var express = require('express');
var client = require('cheerio-httpcli');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var checkUrl = req.session.url;
  checkUrl.toString();
  client.fetch(checkUrl).then(function (result) {
    res.render('myBookmarkEdit.ejs',{
      title : result.$('title').text()
    });
  });
});
router.post('/',function(req,res){
  var userId = req.session.user_id;
  var url = req.session.url;
  var title = req.body.title;
  var description = req.body.description;
  var query = 'INSERT INTO `bookmarks` (`user_id`,`title`,`url`,`description`) VALUES(?, ?, ?, ?)';
  connection.query(query,[userId,title,url,description],function(err,result){
    res.redirect('/PHH_Bookmark/myPage');
  });
});

module.exports = router;
