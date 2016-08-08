var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var selectedUserNames = [];
var selectedUserNickNames = [];
var memberUserNames = [];
var memberNickNames = [];
var myUserName;

router.get('/',function(req,res){
  selectedUserNames = [];
  selectedUserNickNames = [];
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var checkAuthority = 'SELECT `user_id` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ? AND `is_admin` = true';
  connection.query(checkAuthority,[myId,orgId],function(err,result){
    if(result.length === 1){
      var checkMembership = 'SELECT `user_id` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
      connection.query(checkMembership,[myId,orgId],function(err,result){
        if(result.length > 0){
          var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
          memberUserNames = [];
          memberNickNames = [];
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
                    var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
                    connection.query(selectMyUserName,[myId],function(err,result){
                      myUserName = result[0].name;
                      res.render('membersManagement.ejs',{
                        memberUserNames : memberUserNames,
                        memberNickNames : memberNickNames,
                        orgName : orgName,
                        orgThumbnail :orgThumbnail,
                        orgIntroduction : orgIntroduction,
                        myUserName : myUserName
                      });
                    });
                  }
                });
              }
            });
          });
        } else { // the user is not belong to the organization
          res.redirect('/PHH_Bookmark/topPage');
        }
      });
    } else { // when the user doesn't have authority
      res.redirect('/PHH_Bookmark/organizationPage');
    }
  });
});

router.post('/searchUser',function(req,res){
  var orgId = req.session.org_id;
  var searchedUser = req.body.searchedUser;
  var myId = req.session.user_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var overlapUsers = [];
  var checkForm = /^[a-zA-Z0-9]+$/;
  connection.query(specifyOrg,[orgId],function(err,result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    if(checkForm.test(searchedUser)){
      if(searchedUser === ''){
        res.render('membersManagement.ejs',{
          orgName : orgName,
          orgIntroduction : orgIntroduction,
          orgThumbnail : orgThumbnail,
          selectedUserNames : selectedUserNames,
          selectedUserNickNames : selectedUserNickNames
        });
      } else { // searchedUser contain any charactors
        if(selectedUserNames.length > 0){
          var exclude = 'SELECT `name` FROM `users` WHERE `name` NOT IN (?)';
          var excludeUsers = [];
          for(var i = 0; i < memberUserNames.length; i++){
            excludeUsers.push(memberUserNames[i]);
          }
          for(var i = 0; i < selectedUserNames.length; i++){
            excludeUsers.push(selectedUserNames[i]);
          }
          connection.query(exclude,[excludeUsers],function(err,result){
            if(result.length > 0){
              var searchedUserNames = [];
              var searchedUserNickNames = [];
              searchedUser = new RegExp('.*' + searchedUser + '.*');
              for(var i = 0;i < result.length; i++){
                var searchedUserName = result[i].name;
                if(searchedUser.test(searchedUserName)){
                  searchedUserNames.push(searchedUserName);
                };
              }
              if(searchedUserNames.length > 0){
                var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ?';
                var searchedUserNickNames = [];
                for(var i = 0; i < searchedUserNames.length; i++){
                  connection.query(selectNickName,[searchedUserNames[i]],function(err,result){
                    var searchedUserNickName = result[0].nick_name;
                    searchedUserNickNames.push(searchedUserNickName);
                    if(searchedUserNames.length === selectedUserNickNames.length){
                      res.render('membersManagement.ejs',{
                        orgName : orgName,
                        orgIntroduction : orgIntroduction,
                        orgThumbnail : orgThumbnail,
                        memberUserNames : memberUserNames,
                        memberNickNames : memberNickNames,
                        searchedUserNames : searchedUserNames,
                        searchedUserNickNames : searchedUserNickNames,
                        selectedUserNames : selectedUserNames,
                        selectedUserNickNames : selectedUserNickNames,
                        myUserName : myUserName
                      });
                    }
                  });
                }
              }else{ // when no user hits
                res.render('membersManagement.ejs',{
                  orgName : orgName,
                  orgIntroduction : orgIntroduction,
                  orgThumbnail : orgThumbnail,
                  selectedUserNames : selectedUserNames,
                  selectedUserNickNames : selectedUserNickNames,
                  memberUserNames : memberUserNames,
                  memberNickNames : memberNickNames,
                  notice : '該当するユーザーが見つかりません。',
                  myUserName : myUserName
                });
              }
            } else { // when no user hits
              res.render('membersManagement.ejs',{
                orgName : orgName,
                orgIntroduction : orgIntroduction,
                orgThumbnail : orgThumbnail,
                selectedUserNames : selectedUserNames,
                selectedUserNickNames : selectedUserNickNames,
                memberUserNames : memberUserNames,
                memberNickNames : memberNickNames,
                notice : '該当するユーザーが見つかりません。',
                myUserName : myUserName
              });
            }
          });
        } else { // still no one selected
          var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
          connection.query(selectMyUserName,[myId],function(err,result){
            var myUserName = result[0].name;
            var exclude = 'SELECT `name` FROM `users` WHERE `name` NOT IN (?)';
            var excludeUsers = [];
            for(var i = 0; i < memberUserNames.length; i++){
              excludeUsers.push(memberUserNames[i]);
            }
            connection.query(exclude,[excludeUsers],function(err,result){
              if(result.length > 0){
                var searchedUserNames = [];
                searchedUser = new RegExp('.*' + searchedUser + '.*');
                for(var i = 0; i < result.length; i++){
                  var searchedUserName = result[i].name;
                  if(searchedUser.test(searchedUserName)){
                    searchedUserNames.push(searchedUserName);
                  }
                }
                if(searchedUserNames.length > 0){
                  var searchedUserNickNames = [];
                  var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ?';
                  for(var i = 0; i < searchedUserNames.length; i++){
                    connection.query(selectNickName,[searchedUserNames[i]],function(err,result){
                      console.log(err);
                      console.log(result);
                      var searchedUserNickName = result[0].nick_name;
                      searchedUserNickNames.push(searchedUserNickName);
                      if(searchedUserNames.length === searchedUserNickNames.length){
                        res.render('membersManagement.ejs',{
                          orgName : orgName,
                          orgIntroduction : orgIntroduction,
                          orgThumbnail : orgThumbnail,
                          searchedUserNames : searchedUserNames,
                          searchedUserNickNames : searchedUserNickNames,
                          memberUserNames : memberUserNames,
                          memberNickNames : memberNickNames,
                          selectedUserNames : selectedUserNames,
                          selectedUserNickNames : selectedUserNickNames,
                          myUserName : myUserName
                        });
                      }
                    });
                  }
                }else{ // when no users hit
                  res.render('membersManagement.ejs',{
                    memberUserNames : memberUserNames,
                    memberNickNames : memberNickNames,
                    selectedUserNames : selectedUserNames,
                    selectedUserNickNames : selectedUserNickNames,
                    orgName : orgName,
                    orgIntroduction : orgIntroduction,
                    orgThumbnail : orgThumbnail,
                    notice : '該当するユーザーが見つかりません。',
                    myUserName : myUserName
                  });
                }
              }else{ // when no user hits
                res.render('membersManagement.ejs',{
                  orgName : orgName,
                  orgIntroduction : orgIntroduction,
                  orgThumbnail : orgThumbnail,
                  selectedUserNames : selectedUserNames,
                  selectedUserNickNames : selectedUserNickNames,
                  notice : '該当するユーザーが見つかりません。',
                  memberUserNames :  memberUserNames,
                  memberNickNames : memberNickNames,
                  myUserName : myUserName
                });
              };
            });
          });
        }
      };
    }else{ // when the user input full angle characters
      res.render('membersManagement.ejs',{
        memberUserNames : memberUserNames,
        memberNickNames : memberNickNames,
        selectedUserNames : selectedUserNames,
        selectedUserNickNames : selectedUserNickNames,
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        orgThumbnail : orgThumbnail,
        notice : 'ユーザー名は半角英数です',
        myUserName : myUserName
      });
    }
  });
});

router.post('/selectUser',function(req,res){
  var results = req.body.result;
  results = results.split(',');
  var selectedUserName = results[0];
  var selectedUserNickName = results[1];
  selectedUserNames.push(selectedUserName);
  selectedUserNickNames.push(selectedUserNickName);
  var orgId = req.session.org_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  connection.query(specifyOrg,[orgId],function(err,result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    res.render('membersManagement.ejs',{
      orgName : orgName,
      orgIntroduction : orgIntroduction,
      orgThumbnail : orgThumbnail,
      selectedUserNames : selectedUserNames,
      selectedUserNickNames : selectedUserNickNames,
      memberNickNames : memberNickNames,
      memberUserNames : memberUserNames,
      myUserName : myUserName
    });
  });
});

router.post('/excludeUser',function(req,res){
  var results = req.body.result;
  results = results.split(',');
  var excludeUserName = results[0];
  var excludeUserNickName = results[1];
  var orgId = req.session.org_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  connection.query(specifyOrg,[orgId],function(err,result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    selectedUserNames.some(function(v,i){
      if(v === excludeUserName){
        selectedUserNames.splice(i,1);
      }
    });
    selectedUserNickNames.some(function(v,i){
      if(v == excludeUserNickName){
        selectedUserNickNames.splice(i,1);
      }
    });
    res.render('membersManagement.ejs',{
      orgName : orgName,
      orgIntroduction : orgIntroduction,
      orgThumbnail : orgThumbnail,
      selectedUserNames : selectedUserNames,
      selectedUserNickNames : selectedUserNickNames,
      memberUserNames : memberUserNames,
      memberNickNames : memberNickNames,
      myUserName : myUserName
    });
  });
});

router.post('/makeJoin',function(req,res){
  var orgId = req.session.org_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
  var makeJoinUsers = [];
  for(var i = 0; i < selectedUserNames.length; i++){
    connection.query(selectUserId,[selectedUserNames[i]],function(err,result){
      makeJoinUsers.push(result[0].user_id);
      if(selectedUserNames.length === makeJoinUsers.length){
        var makeJoin = 'INSERT INTO `organization_memberships` (`user_id`,`org_id`,`is_admin`) VALUES (?, ?, ?)';
        for(var i = 0; i < makeJoinUsers.length; i++){
          connection.query(makeJoin,[makeJoinUsers[i],orgId,false]);
        }
        res.redirect('/PHH_Bookmark/membersManagement');
      }
    });
  }
});

router.post('/expelUser',function(req,res){
  var orgId = req.session.org_id;
  var expelUserName = req.body.result;
  var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
  connection.query(selectUserId,[expelUserName],function(err,result){
    var expelUserId = result[0].user_id;
    var expelUser = 'DELETE FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
    connection.query(expelUser,[expelUserId,orgId]);
    res.redirect('/PHH_Bookmark/membersManagement');
  });
});

router.post('/leave',function(req,res){
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var leave = 'DELETE FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  connection.query(leave,[myId,orgId]);
  res.redirect('/PHH_Bookmark/topPage');
});
module.exports = router;
