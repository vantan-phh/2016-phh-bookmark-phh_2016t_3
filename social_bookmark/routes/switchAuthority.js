var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var orgId = req.session.org_id;
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
            for(var i = 0; i < notAdminIds.length; i++){
              connection.query(selectNotAdminUsers,[notAdminIds[i]],function(err,result){
                notAdminUserNames.push(result[0].name);
                notAdminNickNames.push(result[0].nick_name);
                if(notAdminIds.length === notAdminNickNames.length){
                  res.render('switchAuthority.ejs',{
                    adminNickNames : adminNickNames,
                    adminUserNames : adminUserNames,
                    notAdminNickNames : notAdminNickNames,
                    notAdminUserNames : notAdminUserNames
                  });
                }
              });
            }
          }
        });
      }
    });
  });
});

module.exports = router;
