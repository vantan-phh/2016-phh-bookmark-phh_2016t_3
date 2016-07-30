var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var orgId = req.session.org_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var memberUserNames = [];
  var memberNickNames = [];
  connection.query(specifyOrg,[orgId],function(err,result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    var selectMembers = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ?';
    connection.query(selectMembers,[orgId],function(err,result){
      var selectMemberData = 'SELECT * FROM `users` WHERE `user_id` = ?';
      var len = result.length;
      for(var i = 0; i < len; i++){
        var memberId = result[i].user_id;
        connection.query(selectMemberData,[memberId],function(err,result){
          memberUserNames.push(result[0].name);
          memberNickNames.push(result[0].nick_name);
          if(memberUserNames.length === len){
            res.render('membersManagement.ejs',{
              memberUserNames : memberUserNames,
              memberNickNames : memberNickNames,
              orgName : orgName,
              orgThumbnail :orgThumbnail,
              orgIntroduction : orgIntroduction
            });
          }
        });
      }
    });
  });
});

router.post('/searchUser',function(req,res){
  var searchedUser = req.body.searchedUser;
  var myId = res.session.user_id;
  var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
  connection.query(selectMyUserName,[myId],function(err,result){
    var myUserName = result[0].name;
    if(searchedUser = ''){
      res.render('organizationPage.ejs',{

      });
    }
  });
  searchedUser = new RegExp('.*' + searchedUser + '.*');
  var query = 'SELECT * FROM `users` WHERE'
});

module.exports = router;
