var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var myUserName;

router.get('/',function(req,res){
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var checkAuthority = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `user_id` = ? AND `is_admin` = true';
  connection.query(checkAuthority,[orgId,myId],function(err,result){
    if(result.length > 0){
      var selectAdmins = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = ?';
      var adminIds = [];
      connection.query(selectAdmins,[orgId,1],function(err,result){
        for(var i = 0; i < result.length; i++){
          adminIds.push(result[i].user_id);
        }
        var selectNotAdmins = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = ?';
        var notAdminIds = [];
        connection.query(selectNotAdmins,[orgId,0],function(err,result){
          for(var i = 0; i < result.length; i++){
            notAdminIds.push(result[i].user_id);
          }
          var selectAdminUsers = 'SELECT * FROM `users` WHERE `user_id` = ?';
          var adminUserNames = [];
          var adminNickNames = [];
          for(var i = 0; i < adminIds.length; i++){
            connection.query(selectAdminUsers,[adminIds[i]],function(err,result){
              adminUserNames.push(result[0].name);
              adminNickNames.push(result[0].nick_name);
              if(adminIds.length === adminNickNames.length){
                var selectNotAdminUsers = 'SELECT * FROM `users` WHERE `user_id` = ?';
                var notAdminUserNames = [];
                var notAdminNickNames = [];
                if(notAdminIds.length > 0){
                  for(var i = 0; i < notAdminIds.length; i++){
                    connection.query(selectNotAdminUsers,[notAdminIds[i]],function(err,result){
                      notAdminUserNames.push(result[0].name);
                      notAdminNickNames.push(result[0].nick_name);
                      if(notAdminIds.length === notAdminNickNames.length){
                        var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
                        connection.query(selectMyUserName,[myId],function(err,result){
                          myUserName = result[0].name;
                          res.render('switchAuthority.ejs',{
                            adminNickNames : adminNickNames,
                            adminUserNames : adminUserNames,
                            notAdminNickNames : notAdminNickNames,
                            notAdminUserNames : notAdminUserNames,
                            myUserName : myUserName
                          });
                        });
                      }
                    });
                  }
                } else { // when notAdminUsers don't exist
                  var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
                  connection.query(selectMyUserName,[myId],function(err,result){
                    var myUserName = result[0].name;
                    res.render('switchAuthority.ejs',{
                      adminUserNames : adminUserNames,
                      adminNickNames : adminNickNames,
                      notAdminUserNames : notAdminUserNames,
                      notAdminNickNames : notAdminNickNames,
                      myUserName : myUserName
                    });
                  });
                }
              }
            });
          }
        });
      });
    } else { // when the user doesn't have authority
      res.redirect('/PHH_Bookmark/organizationPage');
    }
  });
});

router.post('/give',function(req,res){
  var orgId = req.session.org_id;
  var authorizedUserName = req.body.result;
  var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
  connection.query(selectUserId,[authorizedUserName],function(err,result){
    var authorizedUserId = result[0].user_id;
    var authorize = 'UPDATE `organization_memberships` SET `is_admin` = true WHERE `user_id` = ? AND `org_id` = ?';
    connection.query(authorize,[authorizedUserId,orgId]);
    res.redirect('/PHH_Bookmark/switchAuthority');
  });
});

router.post('/renounce',function(req,res){
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var renounce = 'UPDATE `organization_memberships` SET `is_admin` = false WHERE `user_id` = ? AND `org_id` = ?';
  connection.query(renounce,[myId,orgId]);
  res.redirect('/PHH_Bookmark/switchAuthority');
});

module.exports = router;
