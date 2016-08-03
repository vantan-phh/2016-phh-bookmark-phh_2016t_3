var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var checkAuthority = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  connection.query(checkAuthority,[myId,orgId],function(err,result){
    if(result.length > 0){
      if(result[0].is_admin === 1){
        var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ?';
        connection.query(selectOrgData,[orgId],function(err,result){
          var orgName = result[0].name;
          var orgIntroduction = result[0].introduction;
          var orgThumbnail = result[0].image_path;
          res.render('organizationManagement.ejs',{
            orgName : orgName,
            orgIntroduction : orgIntroduction,
            orgThumbnail : orgThumbnail
          });
        });
      } else { // the user is not an admin
        res.redirect('/PHH_Bookmark/organizationPage');
      }
    } else { // the user is not belong to the organization
      res.redirect('/PHH_Bookmark/topPage');
    }
  });
});

module.exports = router;
