var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var bookmarkId = req.session.edit_org_bookmark_id;
  var orgId = req.session.org_id;
  var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
  connection.query(selectBookmarkData,[bookmarkId],function(err,result){
    var title = result[0].title;
    var description = result[0].description;
    var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ?';
    connection.query(selectOrgData,[orgId],function(err,result){
      var orgName = result[0].name;
      var orgIntroduction = result[0].introduction;
      var orgThumbnail = result[0].image_path;
      res.render('orgBookmarkEdit.ejs',{
        title : title,
        description : description,
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        orgThumbnail : orgThumbnail
      });
    });
  });
});

router.post('/',function(req,res){
  var title = req.body.title;
  var description = req.body.description;
  var bookmarkId = req.session.edit_org_bookmark_id;
  var query = 'UPDATE `bookmarks` SET `title` = ?, `description` = ? WHERE `bookmark_id` = ?';
  connection.query(query,[title,description,bookmarkId],function(err,result){
    res.redirect('/PHH_Bookmark/organizationPage');
  });
});

module.exports = router;
