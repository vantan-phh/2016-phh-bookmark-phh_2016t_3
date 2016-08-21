'use strict';
var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');
var multer = require('multer');

var upload = multer({ dest : './PHH_Bookmark/view/img/uploads/' });
var cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name : 'dy4f7hul5',
  api_key : '925664739655858',
  api_secret : 'sbP8YsyWrhbf-vyZDsq4-6Izd_8',
});
var selectedUserNames = [];
var selectedNickNames = [];

var checkForm = /^[a-zA-Z0-9]+$/;

router.get('/', (req, res) => {
  selectedUserNames = [];
  selectedNickNames = [];
  res.render('createOrganization.ejs');
});

router.post('/searchUser', (req, res) => {
  var invitedUser = req.body.result;
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var userId = req.session.user_id;
  var selectOwnName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
  var overlapUsers = [];
  var checkSpace = /[\s]+/g;
  (() => {
    var promise = new Promise((resolve) => {
      if(checkForm.test(invitedUser)){
        connection.query(selectOwnName, [userId]).then((result) => {
          var ownUserName = result[0][0].name;
          if(checkSpace.test(invitedUser)){
            res.render('createOrganization', {
              orgName,
              orgIntroduction,
              selectedUserNames,
              selectedNickNames,
            });
          }else{
            resolve(ownUserName);
          }
        });
      }else{
        res.render('createOrganization', {
          orgName,
          orgIntroduction,
          selectedUserNames,
          selectedNickNames,
          searchUserNotice : 'ユーザー名は半角英数です',
        });
      }
    });
    return promise;
  })().then((value) => {
    var ownUserName = value;
    if(selectedUserNames.length > 0){
      (() => {
        var promise = new Promise((resolve) => {
          var userNamesForQuery = '';
          selectedUserNames.forEach((currentValue, index, array) => {
            if(index + 1 === array.length){
              userNamesForQuery += '"' + currentValue + '"';
              resolve(userNamesForQuery);
            }else{
              userNamesForQuery += '"' + currentValue + '" OR `name` = ';
            }
          });
        });
        return promise;
      })().then((_value) => {
        var userNamesForQuery = _value;
        var promise = new Promise((resolve) => {
          var selectOverlapUser = 'SELECT `user_id` FROM `users` WHERE `name` = ' + userNamesForQuery;
          connection.query(selectOverlapUser).then((result) => {
            var selectedIds = result[0];
            resolve(selectedIds);
          });
        });
        return promise;
      }).then((_value) => {
        var selectedIds = _value;
        var promise = new Promise((resolve) => {
          selectedIds.forEach((currentValue, index, array) => {
            overlapUsers.push(currentValue.user_id);
            if(index + 1 === array.length){
              overlapUsers.push(userId);
              resolve(overlapUsers);
            }
          });
        });
        return promise;
      }).then((_value) => {
        overlapUsers = _value;
        var promise = new Promise((resolve) => {
          var excludeOverlapUsers = 'SELECT `name` FROM `users` WHERE `user_id` NOT IN (?)';
          connection.query(excludeOverlapUsers, [overlapUsers]).then((result) => {
            if(result[0].length > 0){
              var hitUserNames = result[0];
              resolve(hitUserNames);
            }else{ // when no user hits
              res.render('createOrganization', {
                orgName,
                orgIntroduction,
                selectedUserNames,
                selectedNickNames,
                noUser : '該当するユーザーが見つかりません。',
              });
            }
          });
        });
        return promise;
      }).then((_value) => {
        var hitUserNames = _value;
        var promise = new Promise((resolve) => {
          var searchedUserNames = [];
          invitedUser = new RegExp('.*' + invitedUser + '.*');
          hitUserNames.forEach((currentValue, index, array) => {
            var invitedUserName = currentValue.name;
            if(invitedUser.test(invitedUserName)){
              searchedUserNames.push(currentValue.name);
            }
            if(index + 1 === array.length){
              resolve(searchedUserNames);
            }
          });
        });
        return promise;
      }).then((_value) => {
        var searchedUserNames = _value;
        var promise = new Promise((resolve) => {
          if(searchedUserNames.length > 0){
            var userNamesForQuery = '';
            searchedUserNames.forEach((currentValue, index, array) => {
              if(index + 1 === array.length){
                userNamesForQuery += '"' + currentValue + '"';
                var values = {
                  searchedUserNames,
                  userNamesForQuery,
                };
                resolve(values);
              }else{
                userNamesForQuery += '"' + currentValue + '" OR `name` = ';
              }
            });
          }else{ // when no user hits
            res.render('createOrganization.ejs', {
              orgName,
              orgIntroduction,
              selectedUserNames,
              selectedNickNames,
              noUser : '該当するユーザーが見つかりません。',
            });
          }
        });
        return promise;
      }).then((_values) => {
        var userNamesForQuery = _values.userNamesForQuery;
        var searchedUserNames = _values.searchedUserNames;
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ' + userNamesForQuery;
          connection.query(selectNickName).then((result) => {
            var hitNickNames = result[0];
            var values = {
              searchedUserNames,
              hitNickNames,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((_values) => {
        var hitNickNames = _values.hitNickNames;
        var searchedUserNames = _values.searchedUserNames;
        var promise = new Promise((resolve) => {
          var searchedNickNames = [];
          hitNickNames.forEach((currentValue, index, array) => {
            searchedNickNames.push(currentValue.nick_name);
            if(index + 1 === array.length){
              var values = {
                searchedUserNames,
                searchedNickNames,
              };
              resolve(values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        var searchedNickNames = _values.searchedNickNames;
        var searchedUserNames = _values.searchedUserNames;
        res.render('createOrganization', {
          orgName,
          orgIntroduction,
          searchedUserNames,
          searchedNickNames,
          selectedUserNames,
          selectedNickNames,
        });
      });
    }else{ // when no one selected still
      (() => {
        var promise = new Promise((resolve) => {
          var excludeOwnData = 'SELECT `name` FROM `users` WHERE `name` NOT IN (?)';
          connection.query(excludeOwnData, [ownUserName]).then((result) => {
            if(result[0].length > 0){
              var searchedUserNames = [];
              invitedUser = new RegExp('.*' + invitedUser + '.*');
              result[0].forEach((currentValue, index, array) => {
                if(invitedUser.test(currentValue.name)){
                  searchedUserNames.push(currentValue.name);
                }
                if(index + 1 === array.length){
                  resolve(searchedUserNames);
                }
              });
            }else{ // when no user hits
              res.render('createOrganization', {
                orgName,
                orgIntroduction,
                selectedUserNames,
                selectedNickNames,
                noUser : '該当するユーザーが見つかりません。',
              });
            }
          });
        });
        return promise;
      })().then((_value) => {
        var searchedUserNames = _value;
        var promise = new Promise((resolve) => {
          if(searchedUserNames.length > 0){
            var userNamesForQuery = '';
            searchedUserNames.forEach((currentValue, index, array) => {
              if(index + 1 === array.length){
                userNamesForQuery += '"' + currentValue + '"';
                var values = {
                  searchedUserNames,
                  userNamesForQuery,
                };
                resolve(values);
              }else{
                userNamesForQuery += '"' + currentValue + '" OR `name` = ';
              }
            });
          }else{ // when no user hits
            res.render('createOrganization.ejs', {
              orgName,
              orgIntroduction,
              selectedUserNames,
              selectedNickNames,
              noUser : '該当するユーザーが見つかりません。',
            });
          }
        });
        return promise;
      }).then((_values) => {
        var searchedUserNames = _values.searchedUserNames;
        var userNamesForQuery = _values.userNamesForQuery;
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ' + userNamesForQuery;
          connection.query(selectNickName).then((result) => {
            var hitNickNames = result[0];
            var values = {
              searchedUserNames,
              hitNickNames,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((_values) => {
        var searchedUserNames = _values.searchedUserNames;
        var hitNickNames = _values.hitNickNames;
        var promise = new Promise((resolve) => {
          var searchedNickNames = [];
          hitNickNames.forEach((currentValue, index, array) => {
            searchedNickNames.push(currentValue.nick_name);
            if(index + 1 === array.length){
              var values = {
                searchedUserNames,
                searchedNickNames,
              };
              resolve(values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        var searchedUserNames = _values.searchedUserNames;
        var searchedNickNames = _values.searchedNickNames;
        res.render('createOrganization.ejs', {
          orgName,
          orgIntroduction,
          searchedUserNames,
          searchedNickNames,
          selectedUserNames,
          selectedNickNames,
        });
      });
    }
  });
});

router.post('/create', upload.single('image_file'), (req, res) => {
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var myId = req.session.user_id;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  var orgNameExists = 'SELECT `name` FROM `organizations` WHERE `name` = ?';
  var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
  (() => {
    var promise = new Promise((resolve) => {
      if(checkSpace.test(orgName)){
        resolve();
      }else{
        res.render('createOrganization', {
          orgName,
          orgIntroduction,
          selectedUserNames,
          selectedNickNames,
          orgNameNotice : '組織名を入力してください',
        });
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(orgIntroduction)){
        resolve();
      }else{
        res.render('createOrganization', {
          orgName,
          orgIntroduction,
          selectedUserNames,
          selectedNickNames,
          orgIntroductionNotice : 'セキュリティ上の観点から紹介文に「+, -, %, ;」は使えません',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(orgName)){
        resolve();
      }else{
        res.render('createOrganization', {
          orgName,
          orgIntroduction,
          selectedUserNames,
          selectedNickNames,
          orgNameNotice : 'セキュリティ上の観点から組織名に「+, -, %, ;」は使えません',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      connection.query(orgNameExists, [orgName]).then((result) => {
        if(result[0].length < 1){
          resolve();
        }else{ // when submitted orgName is already exist in DB
          res.render('createOrganization', {
            orgName,
            orgIntroduction,
            selectedUserNames,
            selectedNickNames,
            orgNameExists : '同じ名前の組織が存在しています。',
          });
        }
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      connection.query(selectMyUserName, [myId]).then((result) => {
        var myUserName = result[0][0].name;
        selectedUserNames.push(myUserName);
        resolve();
      });
    });
    return promise;
  }).then(() => {
    if(req.file){
      (() => {
        var promise = new Promise((resolve) => {
          var path = req.file.path;
          cloudinary.uploader.upload(path, (result) => {
            var orgThumbnail = result.url;
            resolve(orgThumbnail);
          });
        });
        return promise;
      })().then((value) => {
        var orgThumbnail = value;
        var promise = new Promise((resolve) => {
          var createOrgQuery = 'INSERT INTO `organizations` (`name`, `image_path`, `introduction`) VALUES (?, ?, ?)';
          connection.query(createOrgQuery, [orgName, orgThumbnail, orgIntroduction]).then(() => {
            resolve();
          });
        });
        return promise;
      }).then(() => {
        var promise = new Promise((resolve) => {
          var selectOrgId = 'SELECT `id` FROM `organizations` WHERE `name` = ?';
          connection.query(selectOrgId, [orgName]).then((result) => {
            var orgId = result[0][0].id;
            resolve(orgId);
          });
        });
        return promise;
      }).then((value) => {
        var orgId = value;
        var promise = new Promise((resolve) => {
          var userNamesForQuery = '';
          selectedUserNames.forEach((currentValue, index, array) => {
            if(index + 1 === array.length){
              userNamesForQuery += '"' + currentValue + '"';
              var values = {
                orgId,
                userNamesForQuery,
              };
              resolve(values);
            }else{
              userNamesForQuery += '"' + currentValue + '" OR `name` = ';
            }
          });
        });
        return promise;
      }).then((values) => {
        var orgId = values.orgId;
        var userNamesForQuery = values.orgId;
        var promise = new Promise((resolve) => {
          var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ' + userNamesForQuery;
          connection.query(selectUserId).then((result) => {
            var selectedUserIds = result[0];
            values = {
              orgId,
              selectedUserIds,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((values) => {
        var orgId = values.orgId;
        var selectedUserIds = values.selectedUserIds;
        var promise = new Promise((resolve) => {
          var intoMembershipsQuery = 'INSERT INTO `organization_memberships` (`user_id`, `org_id`, `is_admin`) VALUES (?, ?, ?)';
          selectedUserIds.forEach((currentValue, index, array) => {
            if(currentValue.user_id !== req.session.user_id){
              connection.query(intoMembershipsQuery, [currentValue.user_id, orgId, false]);
            }else if(currentValue.user_id === req.session.user_id){
              connection.query(intoMembershipsQuery, [currentValue.user_id, orgId, true]).then(() => {
                if(index + 1 === array.length){
                  resolve(orgId);
                }
              });
            }
          });
        });
        return promise;
      }).then((value) => {
        var orgId = value;
        if(req.session.org_id){
          delete req.session.org_id;
        }
        req.session.org_id = orgId;
        res.redirect('/PHH_Bookmark/organizationPage');
      });
    }else{ // when file data wasn't submitted
      (() => {
        var promise = new Promise((resolve) => {
          var orgThumbnail = 'http://res.cloudinary.com/dy4f7hul5/image/upload/v1469755753/y7mekcjoe7zptq7zl3ti.png';
          var createOrgQuery = 'INSERT INTO `organizations` (`name`, `image_path`, `introduction`) VALUES (?, ?, ?)';
          connection.query(createOrgQuery, [orgName, orgThumbnail, orgIntroduction]).then(() => {
            resolve();
          });
        });
        return promise;
      })().then(() => {
        var promise = new Promise((resolve) => {
          var selectOrgId = 'SELECT `id` FROM `organizations` WHERE `name` = ?';
          connection.query(selectOrgId, [orgName]).then((result) => {
            var orgId = result[0][0].id;
            resolve(orgId);
          });
        });
        return promise;
      }).then((value) => {
        var orgId = value;
        var promise = new Promise((resolve) => {
          var userNamesForQuery = '';
          selectedUserNames.forEach((currentValue, index, array) => {
            if(index + 1 === array.length){
              userNamesForQuery += '"' + currentValue + '"';
              var values = {
                orgId,
                userNamesForQuery,
              };
              resolve(values);
            }else{
              userNamesForQuery += '"' + currentValue + '" OR `name` = ';
            }
          });
        });
        return promise;
      }).then((values) => {
        var orgId = values.orgId;
        var userNamesForQuery = values.userNamesForQuery;
        var promise = new Promise((resolve) => {
          var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ' + userNamesForQuery;
          connection.query(selectUserId).then((result) => {
            var selectedUserIds = result[0];
            values = {
              orgId,
              selectedUserIds,
            };
            resolve(values);
          });
        });
        return promise;
      }).then((values) => {
        var orgId = values.orgId;
        var selectedUserIds = values.selectedUserIds;
        var promise = new Promise((resolve) => {
          var intoMembershipsQuery = 'INSERT INTO `organization_memberships` (`user_id`, `org_id`, `is_admin`) VALUES (?, ?, ?)';
          selectedUserIds.forEach((currentValue) => {
            if(currentValue.user_id !== req.session.user_id){
              connection.query(intoMembershipsQuery, [currentValue.user_id, orgId, false]);
            }else if(currentValue.user_id === req.session.user_id){
              connection.query(intoMembershipsQuery, [currentValue.user_id, orgId, true]).then(() => {
                resolve(orgId);
              });
            }
          });
        });
        return promise;
      }).then((value) => {
        var orgId = value;
        if(req.session.org_id){
          delete req.session.org_id;
        }
        req.session.org_id = orgId;
        res.redirect('/PHH_Bookmark/organizationPage');
      });
    }
  });
});

router.post('/selectUser', (req, res) => {
  var selectedUser = req.body.result;
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  selectedUser = selectedUser.split(',');
  selectedUserNames.push(selectedUser[0]);
  selectedNickNames.push(selectedUser[1]);
  res.render('createOrganization', {
    orgName,
    orgIntroduction,
    selectedUserNames,
    selectedNickNames,
  });
});

router.post('/excludeUser', (req, res) => {
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var excludeUser = req.body.result;
  (() => {
    var promise = new Promise((resolve) => {
      var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ?';
      connection.query(selectNickName, [excludeUser]).then((result) => {
        var excludeUserNickName = result[0][0].nick_name;
        resolve(excludeUserNickName);
      });
    });
    return promise;
  })().then((value) => {
    var excludeUserNickName = value;
    var promise = new Promise((resolve) => {
      var values;
      selectedUserNames.some((currentValue, index) => {
        if(currentValue === excludeUser){
          selectedUserNames.splice(index, 1);
        }
        return 0;
      });
      values = {
        excludeUserNickName,
        selectedUserNames,
      };
      resolve(values);
    });
    return promise;
  }).then((values) => {
    selectedUserNames = values.selectedUserNames;
    var excludeUserNickName = values.excludeUserNickName;
    var promise = new Promise((resolve) => {
      selectedNickNames.some((currentValue, index) => {
        if(currentValue === excludeUserNickName){
          selectedNickNames.splice(index, 1);
        }
        return 0;
      });
      values = {
        selectedNickNames,
        selectedUserNames,
      };
      resolve(values);
    });
    return promise;
  }).then((values) => {
    selectedUserNames = values.selectedUserNames;
    selectedNickNames = values.selectedNickNames;
    res.render('createOrganization.ejs', {
      orgName,
      orgIntroduction,
      selectedNickNames,
      selectedUserNames,
    });
  });
});

module.exports = router;
