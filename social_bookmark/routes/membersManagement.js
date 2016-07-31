var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var selectedUserNames = [];
var selectedUserNickNames = [];

router.get('/',function(req,res){
  selectedUserNames = [];
  selectedUserNickNames = [];
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
  var orgId = req.session.org_id;
  var searchedUser = req.body.searchedUser;
  var myId = req.session.user_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var overlapUsers = [];
  connection.query(specifyOrg,[orgId],function(err,result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    if(searchedUser = ''){
      res.render('organizationPage.ejs',{
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        orgThumbnail : orgThumbnail
      });
    } else { // searchedUser contain any charactors
      if(selectedUserNames.length > 0){
        var excludeSelectedUsers = 'SELECT * FROM `users` WHERE `name` NOT IN (?)';
        connection.query(excludeSelectedUsers,[selectedUserNames],function(err,result){
          if(result.length > 0){
            var searchedUserNames = [];
            var searchedUserNickNames = [];
            searchedUser = new RegExp('.*' + searchedUser + '.*');
            for(var i = 0;i < result.length; i++){
              var searchedUserName = result[0].name;
              var searchedUserNickName = result[0].nick_name;
              searchedUserNames.push(searchedUserName);
              searchedUserNickNames.push(searchedUserNickName);
              if(searchedUserNames.length === result.length){
                res.render('membersManagement.ejs',{
                  orgName : orgName,
                  orgIntroduction : orgIntroduction,
                  orgThumbnail : orgThumbnail,
                  searchedUserNames : searchedUserNames,
                  searchedUserNickNames : searchedUserNickNames
                });
              }
            }
          }
        });
      } else { // still no one selected
        var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
        connection.query(selectMyUserName,[myId],function(err,result){
          var myUserName = result[0].name;
          var excludeOwnData = 'SELECT `name` FROM `users` WHERE `name` NOT IN(?)';
          connection.query(excludeOwnData,[myUserName],function(err,result){
            if(result.length > 0){
              var searchedUserNames = [];
              searchedUser = new RegExp('.*' + searchedUser + '.*');
              for(var i = 0; i < result.length; i++){
                var searchedUserName = result[i].name;
                if(searchedUser.test(searchedUserName)){
                  searchedUserNames.push(searchedUserName);
                }
              }
              var searchedUserNickNames = [];
              var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ?';
              for(var i = 0; i < searchedUserNames.length; i++){
                connection.query(selectNickName,[searchedUserNames[i]],function(err,result){
                  var searchedUserNickName = result[0].nick_name;
                  searchedUserNickNames.push(searchedUserNickName);
                  if(searchedUserNames.length === searchedUserNickNames.length){
                    res.render('membersManagement.ejs',{
                      orgName : orgName,
                      orgIntroduction : orgIntroduction,
                      orgThumbnail : orgThumbnail,
                      searchedUserNames : searchedUserNames,
                      searchedUserNickNames : searchedUserNickNames
                    });
                  }
                });
              }
            } else { // when no users hit
              res.render('organizationPage.ejs',{
                orgName : orgName,
                orgIntroduction : orgIntroduction,
                orgThumbnail : orgThumbnail,
                noUser : '該当するユーザーが見つかりません。'
              });
            }
          })
        });
      }
    };
  });
});

module.exports = router;
