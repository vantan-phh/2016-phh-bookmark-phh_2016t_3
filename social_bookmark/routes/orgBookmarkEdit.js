var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var isAdmin;

router.get('/',function(req,res){
  var bookmarkId = req.session.edit_org_bookmark_id;
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var checkMembership = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  connection.query(checkMembership,[myId,orgId],function(err,result){
    if(result.length > 0){
      if(result[0].is_admin === 1){
        isAdmin = true;
      } else { // the user is not an admin
        isAdmin = false;
      }
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
            orgThumbnail : orgThumbnail,
            isAdmin : isAdmin
          });
        });
      });
    } else { // the user is not belong to the organization
      res.redirect('/PHH_Bookmark/topPage');
    }
  });
});

router.post('/',function(req,res){
  var title = req.body.title;
  var description = req.body.description;
  var orgId = req.session.org_id;
  var bookmarkId = req.session.edit_org_bookmark_id;
  var checkInjection = /[%;+-]+/g;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  connection.query(specifyOrg, [orgId], function(err, result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    if(!checkInjection.test(title)){
      if(!checkInjection.test(description)){
        var query = 'UPDATE `bookmarks` SET `title` = ?, `description` = ? WHERE `bookmark_id` = ?';
        connection.query(query,[title,description,bookmarkId]);
        res.redirect('/PHH_Bookmark/organizationPage');
      }else{
        res.render('orgBookmarkEdit.ejs', {
          orgName : orgName,
          orgIntroduction : orgIntroduction,
          orgThumbnail : orgThumbnail,
          title : title,
          description : description,
          descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません'
        });
      }
    }else{
      res.render('orgBookmarkEdit.ejs', {
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        orgThumbnail : orgThumbnail,
        title : title,
        description : description,
        titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません'
      });
    }
  });
});

router.post('/delete',function(req,res){
  var ids = req.body;
  for(var x in ids){
    var query = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ?'
    connection.query(query,[x]);
  }
  res.redirect('/PHH_Bookmark/organizationPage');
});

module.exports = router;
