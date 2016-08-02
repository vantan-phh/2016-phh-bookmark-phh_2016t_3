var express = require('express');
var router = express.Router();
var client = require('cheerio-httpcli');
var connection = require('../mysqlConnection');
var isAdmin

router.get('/',function(req,res){
  var myId = req.session.user_id;
  var orgId = req.session.org_id;
  var checkMembership = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  connection.query(checkMembership,[myId,orgId],function(err,result){
    if(result.length > 0){
      if(result[0].is_admin === 1){
        isAdmin = true;
      } else { // the user doesn't have authority
        isAdmin = false;
      }
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
      connection.query(specifyOrg,[orgId],function(err,result){
        var orgName = result[0].name;
        var orgIntroduction = result[0].introduction;
        var orgThumbnail = result[0].image_path;
        var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `org_id` = ?';
        connection.query(selectBookmarkData,[orgId],function(err,result){
          if(result.length > 0){
            var result = result;
            res.render('organizationPage.ejs',{
              orgName : orgName,
              orgIntroduction : orgIntroduction,
              orgThumbnail : orgThumbnail,
              result : result,
              isAdmin : isAdmin
            });
          }else{ // when no bookmarks saved in DB with the org_id.
            res.render('organizationPage.ejs',{
              orgName : orgName,
              orgIntroduction : orgIntroduction,
              orgThumbnail : orgThumbnail,
              isAdmin : isAdmin
            });
          }
        });
      });
    } else { // when the user is not belong to the organization
      res.redirect('/PHH_Bookmark/topPage');
    }
  });
});

router.post('/submitUrl',function(req,res){
  var orgId = req.session.org_id;
  var url = req.body.result;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  connection.query(specifyOrg,[orgId],function(err,result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    client.fetch(url).then(function (result) {
      res.render('organizationPage.ejs',{
        isAdmin : isAdmin,
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        orgThumbnail : orgThumbnail,
        url : url,
        title : result.$('title').text()
      });
    });
  });
});

router.post('/',function(req,res){
  var url = req.body.url;
  var title = req.body.title;
  var description = req.body.description;
  var orgId = req.session.org_id;
  var userId = req.session.user_id;
  var query = 'INSERT INTO `bookmarks` (`user_id`,`org_id`,`title`,`url`,`description`) VALUES(?,?,?,?,?)';
  connection.query(query,[userId,orgId,title,url,description],function(err,result){
    res.redirect('/PHH_Bookmark/organizationPage');
  });
});

router.post('/toOrgBookmarkEdit',function(req,res){
  var bookmarkId = req.body.result;
  if(req.session.edit_org_bookmark_id){
    delete req.session.edit_org_bookmark_id;
  }
  req.session.edit_org_bookmark_id = bookmarkId;
  res.redirect('/PHH_Bookmark/orgBookmarkEdit');
});
module.exports = router;
