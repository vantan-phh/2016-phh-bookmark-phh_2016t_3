'use strict';
var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var multer = require('multer');
var upload = multer({dest:'./PHH_Bookmark/view/img/uploads/'});
var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dy4f7hul5',
  api_key: '925664739655858',
  api_secret: 'sbP8YsyWrhbf-vyZDsq4-6Izd_8'
});
var beSetUsers = [];
var selectedUserNames = [];
var selectedUserNickNames = [];

var checkForm = /^[a-zA-Z0-9]+$/;
var checkInjection = /[%;+-]+/g;
var checkSpace = /[\S]+/g;

router.get('/',function(req,res){
  selectedUserNames = [];
  selectedUserNickNames = [];
  res.render('createOrganization.ejs');
});

router.post('/searchUser',function(req,res){
  var invitedUser = req.body.result;
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var userId = req.session.user_id;
  var selectOwnName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
  var overlapUsers = [];
  if(checkForm.test(invitedUser)){
    connection.query(selectOwnName,[userId],function(err,result){
      var ownUserName = result[0].name;
      if(invitedUser === ''){
        res.render('createOrganization',{
          orgName : orgName,
          orgIntroduction : orgIntroduction,
          selectedUserNames : selectedUserNames,
          selectedUserNickNames : selectedUserNickNames
        });
      }else{ // when invitedUser contains any charactor
        if(selectedUserNames.length > 0){
          var selectOverlapUser = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
          for(var i = 0; i < selectedUserNames.length; i++){
            connection.query(selectOverlapUser,[selectedUserNames[i]],function(err,result){
              overlapUsers.push(result[0].user_id);
              if(overlapUsers.length === selectedUserNames.length){
                overlapUsers.push(userId);
                var excludeOverlapUsers = 'SELECT `name` FROM `users` WHERE `user_id` NOT IN (?)';
                connection.query(excludeOverlapUsers,[overlapUsers],function(err,result){
                  if(result.length > 0){
                    var searchedUserName = [];
                    invitedUser = new RegExp('.*' + invitedUser + '.*');
                    for(var i = 0; i < result.length; i++){
                      var invitedUserName = result[i].name;
                      if(invitedUser.test(invitedUserName)){
                        searchedUserName.push(result[i].name);
                      }
                    }
                    if(searchedUserName.length > 0){
                      var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ?';
                      var searchedUserNickName = [];
                      for(var i = 0; i < searchedUserName.length; i++){
                        connection.query(selectNickName,[searchedUserName[i]],function(err,result){
                          searchedUserNickName.push(result[0].nick_name);
                          if(searchedUserName.length === searchedUserNickName.length){
                            res.render('createOrganization',{
                              orgName : orgName,
                              orgIntroduction : orgIntroduction,
                              searchedUserName : searchedUserName,
                              searchedUserNickName : searchedUserNickName,
                              selectedUserNames : selectedUserNames,
                              selectedUserNickNames : selectedUserNickNames
                            });
                          }
                        });
                      }
                    }else{ // when no user hits
                      res.render('createOrganization',{
                        orgName : orgName,
                        orgIntroduction : orgIntroduction,
                        selectedUserNames : selectedUserNames,
                        selectedUserNickNames : selectedUserNickNames,
                        noUser : '該当するユーザーが見つかりません。'
                      });
                    }
                  }else{ // when no user hits
                    res.render('createOrganization',{
                      orgName : orgName,
                      orgIntroduction : orgIntroduction,
                      selectedUserNames : selectedUserNames,
                      selectedUserNickNames : selectedUserNickNames,
                      noUser : '該当するユーザーが見つかりません。'
                    });
                  }
                });
              }
            });
          }
        }else{ // when still no one selected
          var excludeOwnData = 'SELECT `name` FROM `users` WHERE `name` NOT IN (?)';
          connection.query(excludeOwnData,[ownUserName],function(err,result){
            if(result.length > 0){
              var searchedUserName = [];
              invitedUser = new RegExp('.*' + invitedUser + '.*');
              for(var i = 0; i < result.length; i++){
                var invitedUserName = result[i].name;
                if(invitedUser.test(invitedUserName)){
                  searchedUserName.push(result[i].name);
                }
              }
              if(searchedUserName.length > 0){
                var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ?';
                var searchedUserNickName = [];
                for(var i = 0; i < searchedUserName.length; i++){
                  connection.query(selectNickName,[searchedUserName[i]],function(err,result){
                    searchedUserNickName.push(result[0].nick_name);
                    if(searchedUserName.length === searchedUserNickName.length){
                      res.render('createOrganization',{
                        orgName : orgName,
                        orgIntroduction : orgIntroduction,
                        searchedUserName : searchedUserName,
                        searchedUserNickName : searchedUserNickName,
                        selectedUserNames : selectedUserNames,
                        selectedUserNickNames : selectedUserNickNames
                      });
                    }
                  });
                }
              }else{ // when no user hits
                res.render('createOrganization',{
                  orgName : orgName,
                  orgIntroduction : orgIntroduction,
                  selectedUserNames : selectedUserNames,
                  selectedUserNickNames : selectedUserNickNames,
                  noUser : '該当するユーザーが見つかりません。'
                });
              }
            }else{ // when no user hit
              res.render('createOrganization',{
                orgName : orgName,
                orgIntroduction : orgIntroduction,
                selectedUserNames : selectedUserNames,
                selectedUserNickNames : selectedUserNickNames,
                noUser : '該当するユーザーが見つかりません。'
              });
            }
          });
        }
      }
    });
  }else{
    res.render('createOrganization',{
      orgName : orgName,
      orgIntroduction : orgIntroduction,
      selectedUserNames : selectedUserNames,
      selectedUserNickNames : selectedUserNickNames,
      searchUserNotice : 'ユーザー名は半角英数です'
    });
  }
});

router.post('/create',upload.single('image_file'),function(req,res){
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var myId = req.session.user_id;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  var orgNameExists = 'SELECT `name` FROM `organizations` WHERE `name` = ?';
  var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
  if(checkSpace.test(orgName)){
    if(!checkInjection.test(orgIntroduction)){
      if(!checkInjection.test(orgName)){
        connection.query(orgNameExists,[orgName],function(err,result){
          if(result.length < 1){
            connection.query(selectMyUserName,[myId],function(err,result){
              var myUserName = result[0].name;
              selectedUserNames.push(myUserName);
              if(req.file){
                var path = req.file.path;
                cloudinary.uploader.upload(path,function(result){
                  var orgThumbnail = result.url;
                  var createOrgQuery = 'INSERT INTO `organizations` (`name`,`image_path`,`introduction`) VALUES(?, ?, ?)';
                  connection.query(createOrgQuery,[orgName,orgThumbnail,orgIntroduction],function(err,result){
                    var selectOrgId = 'SELECT `id` FROM `organizations` WHERE `name` = ?';
                    connection.query(selectOrgId,[orgName],function(err,result){
                      var orgId = result[0].id;
                      var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
                      for(var i = 0; i < selectedUserNames.length; i++){
                        connection.query(selectUserId,[selectedUserNames[i]],function(err,result){
                          var userId = result[0].user_id;
                          var intoMembershipsQuery = 'INSERT INTO `organization_memberships` (`user_id`,`org_id`,`is_admin`) VALUES(?, ?, ?)';
                          if(userId !== req.session.user_id){
                            connection.query(intoMembershipsQuery,[userId,orgId,false]);
                          } else if(userId === req.session.user_id){
                            connection.query(intoMembershipsQuery,[userId,orgId,true],function(err,result){
                              if(req.session.org_id){
                                delete req.session.org_id;
                              }
                              req.session.org_id = orgId;
                              res.redirect('/PHH_Bookmark/organizationPage');
                            });
                          }
                        });
                      }
                    });
                  });
                });
              }else{ //when file data wasn't submitted
                var orgThumbnail = 'http://res.cloudinary.com/dy4f7hul5/image/upload/v1469755753/y7mekcjoe7zptq7zl3ti.png';
                var createOrgQuery = 'INSERT INTO `organizations` (`name`,`image_path`,`introduction`) VALUES(?, ?, ?)';
                connection.query(createOrgQuery,[orgName,orgThumbnail,orgIntroduction],function(err,result){
                  var selectOrgId = 'SELECT `id` FROM `organizations` WHERE `name` = ?';
                  connection.query(selectOrgId,[orgName],function(err,result){
                    var orgId = result[0].id;
                    var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
                    for(var i = 0; i < selectedUserNames.length; i++){
                      connection.query(selectUserId,[selectedUserNames[i]],function(err,result){
                        var userId = result[0].user_id;
                        var intoMembershipsQuery = 'INSERT INTO `organization_memberships` (`user_id`,`org_id`,`is_admin`) VALUES(?, ?, ?)';
                        if(userId !== req.session.user_id){
                          connection.query(intoMembershipsQuery,[userId,orgId,false]);
                        } else if(userId === req.session.user_id){
                          connection.query(intoMembershipsQuery,[userId,orgId,true],function(err,result){
                            if(req.session.org_id){
                              delete req.session.org_id;
                            }
                            req.session.org_id = orgId;
                            res.redirect('/PHH_Bookmark/organizationPage');
                          });
                        }
                      });
                    }
                  });
                });
              };
            });
          } else { // when submitted orgName is already exist in DB
            res.render('createOrganization',{
              orgName : orgName,
              orgIntroduction : orgIntroduction,
              selectedUserNames : selectedUserNames,
              selectedUserNickNames : selectedUserNickNames,
              orgNameExists : '同じ名前の組織が存在しています。'
            });
          }
        });
      }else{
        res.render('createOrganization',{
          orgName : orgName,
          orgIntroduction : orgIntroduction,
          selectedUserNames : selectedUserNames,
          selectedUserNickNames : selectedUserNickNames,
          orgNameNotice : 'セキュリティ上の観点から組織名に「+, -, %, ;」は使えません'
        });
      }
    }else{
      res.render('createOrganization',{
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        selectedUserNames : selectedUserNames,
        selectedUserNickNames : selectedUserNickNames,
        orgIntroductionNotice : 'セキュリティ上の観点から紹介文に「+, -, %, ;」は使えません'
      });
    }
  }else{
    res.render('createOrganization',{
      orgName : orgName,
      orgIntroduction : orgIntroduction,
      selectedUserNames : selectedUserNames,
      selectedUserNickNames : selectedUserNickNames,
      orgIntroductionNotice : '組織名を入力してください'
    });
  }
});

router.post('/selectUser',function(req,res){
  var selectedUser = req.body.result;
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  selectedUser = selectedUser.split(',');
  selectedUserNames.push(selectedUser[0]);
  selectedUserNickNames.push(selectedUser[1]);
  res.render('createOrganization',{
    orgName : orgName,
    orgIntroduction :orgIntroduction,
    selectedUserNames : selectedUserNames,
    selectedUserNickNames : selectedUserNickNames
  });
});

router.post('/excludeUser',function(req,res){
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var excludeUser = req.body.result;
  var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ?';
  connection.query(selectNickName,[excludeUser],function(err,result){
    var excludeUserNickName = result[0].nick_name;
    selectedUserNames.some(function(v,i){
      if(v === excludeUser){
        selectedUserNames.splice(i,1);
      }
    });
    selectedUserNickNames.some(function(v,i){
      if(v == excludeUserNickName){
        selectedUserNickNames.splice(i,1);
      }
    });
    res.render('createOrganization.ejs',{
      orgName : orgName,
      orgIntroduction : orgIntroduction,
      selectedUserNickNames :selectedUserNickNames,
      selectedUserNames : selectedUserNames
    });
  });
});

module.exports = router;
