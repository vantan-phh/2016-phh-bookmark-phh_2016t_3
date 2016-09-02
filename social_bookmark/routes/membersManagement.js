var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

var selectedUserNames = [];
var selectedNickNames = [];
var memberUserNames = [];
var memberNickNames = [];
var myUserName;

router.get('/', (req, res) => {
  selectedUserNames = [];
  selectedNickNames = [];
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  if(req.session.selectUserInMemberManagement) delete req.session.selectUserInMemberManagement;
  if(req.session.excludeUserInMemberManagement) delete req.session.excludeUserInMemberManagement;
  (() => {
    var promise = new Promise((resolve) => {
      var checkAuthority = 'SELECT `user_id` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ? AND `is_admin` = true';
      connection.query(checkAuthority, [myId, orgId]).then((result) => {
        if(result[0].length === 1){
          resolve();
        }else{
          res.redirect('/PHH_Bookmark/organizationPage');
        }
      });
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      var checkMembership = 'SELECT `user_id` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
      connection.query(checkMembership, [myId, orgId]).then((result) => {
        if(result[0].length > 0){
          resolve();
        }else{
          res.redirect('/PHH_Bookmark/topPage');
        }
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
      memberUserNames = [];
      memberNickNames = [];
      connection.query(specifyOrg, [orgId]).then((result) => {
        var orgName = result[0][0].name;
        var orgIntroduction = result[0][0].introduction;
        var orgThumbnail = result[0][0].image_path;
        var values = {
          orgName,
          orgThumbnail,
          orgIntroduction,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgThumbnail = values.orgThumbnail;
    var orgIntroduction = values.orgIntroduction;
    var promise = new Promise((resolve) => {
      var selectMembers = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ?';
      connection.query(selectMembers, [orgId]).then((result) => {
        var belongMembers = result[0];
        values = {
          orgName,
          orgThumbnail,
          orgIntroduction,
          belongMembers,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgThumbnail = values.orgThumbnail;
    var orgIntroduction = values.orgIntroduction;
    var belongMembers = values.belongMembers;
    var promise = new Promise((resolve) => {
      var idsForQuery = '';
      belongMembers.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          idsForQuery += currentValue.user_id;
          values = {
            orgName,
            orgThumbnail,
            orgIntroduction,
            idsForQuery,
          };
          resolve(values);
        }else{
          idsForQuery += currentValue.user_id + ' OR `user_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var idsForQuery = values.idsForQuery;
    var promise = new Promise((resolve) => {
      var selectMemberData = 'SELECT * FROM `users` WHERE `user_id` = ' + idsForQuery;
      connection.query(selectMemberData).then((result) => {
        var selectedData = result[0];
        values = {
          orgName,
          orgIntroduction,
          orgThumbnail,
          selectedData,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var selectedData = values.selectedData;
    var promise = new Promise((resolve) => {
      selectedData.forEach((currentValue, index, array) => {
        memberUserNames.push(currentValue.name);
        memberNickNames.push(currentValue.nick_name);
        if(index + 1 === array.length){
          values = {
            orgName,
            orgIntroduction,
            orgThumbnail,
          };
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
    connection.query(selectMyUserName, [myId]).then((result) => {
      myUserName = result[0][0].name;
      res.render('membersManagement.ejs', {
        memberUserNames,
        memberNickNames,
        orgName,
        orgThumbnail,
        orgIntroduction,
        myUserName,
      });
    });
  });
});

router.post('/searchUser', (req, res) => {
  if(req.session.selectUserInMemberManagement) delete req.session.selectUserInMemberManagement;
  if(req.session.excludeUserInMemberManagement) delete req.session.excludeUserInMemberManagement;
  var orgId = req.session.org_id;
  var searchedUser = req.body.searchedUser;
  var myId = req.session.user_id;
  var checkForm = /^[a-zA-Z0-9]+$/;
  (() => {
    var promise = new Promise((resolve) => {
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
      connection.query(specifyOrg, [orgId]).then((result) => {
        var orgName = result[0][0].name;
        var orgIntroduction = result[0][0].introduction;
        var orgThumbnail = result[0][0].image_path;
        var values = {
          orgName,
          orgIntroduction,
          orgThumbnail,
        };
        resolve(values);
      });
    });
    return promise;
  })().then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var promise = new Promise((resolve) => {
      if(checkForm.test(searchedUser)){
        resolve(values);
      }else{
        res.render('membersManagement.ejs', {
          memberUserNames,
          memberNickNames,
          selectedUserNames,
          selectedNickNames,
          orgName,
          orgIntroduction,
          orgThumbnail,
          notice : 'ユーザー名は半角英数です',
          myUserName,
        });
      }
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    if(selectedUserNames.length > 0){
      (() => {
        var promise = new Promise((resolve) => {
          var excludeUsers = [];
          memberUserNames.forEach((currentValue, index, array) => {
            excludeUsers.push(currentValue);
            if(index + 1 === array.length){
              values = {
                orgName,
                orgIntroduction,
                orgThumbnail,
                excludeUsers,
              };
              resolve(values);
            }
          });
        });
        return promise;
      })().then((_values) => {
        var excludeUsers = _values.excludeUsers;
        excludeUsers = excludeUsers.concat(selectedUserNames);
        var searchUser = 'SELECT `name`, `nick_name` FROM (SELECT * FROM `users` WHERE `name` NOT IN (?)) AS `a` WHERE `name` LIKE "%' + searchedUser + '%"';
        connection.query(searchUser, [excludeUsers]).then((result) => {
          if(result[0].length > 0){
            res.render('membersManagement.ejs', {
              orgName,
              orgIntroduction,
              orgThumbnail,
              selectedUserNames,
              selectedNickNames,
              memberUserNames,
              memberNickNames,
              myUserName,
              searchedUsers : result[0],
            });
          }else{
            res.render('membersManagement.ejs', {
              orgName,
              orgIntroduction,
              orgThumbnail,
              selectedUserNames,
              selectedNickNames,
              memberUserNames,
              memberNickNames,
              notice : '該当するユーザーが見つかりません。',
              myUserName,
            });
          }
        });
      });
    }else{
      (() => {
        var promise = new Promise((resolve) => {
          var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
          connection.query(selectMyUserName, [myId]).then((result) => {
            myUserName = result[0][0].name;
            values = {
              orgName,
              orgIntroduction,
              orgThumbnail,
              myUserName,
            };
            resolve(values);
          });
        });
        return promise;
      })().then((_values) => {
        myUserName = _values.myUserName;
        var promise = new Promise((resolve) => {
          var excludeUsers = [];
          memberUserNames.forEach((currentValue, index, array) => {
            excludeUsers.push(currentValue);
            if(index + 1 === array.length){
              _values.excludeUsers = excludeUsers;
              resolve(_values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        orgName = _values.orgName;
        orgIntroduction = _values.orgIntroduction;
        orgThumbnail = _values.orgThumbnail;
        var excludeUsers = _values.excludeUsers;
        var searchUser = 'SELECT * FROM `users` WHERE `name` NOT IN (?)';
        connection.query(searchUser, [excludeUsers]).then((result) => {
          if(result[0].length){
            res.render('membersManagement.ejs', {
              orgName,
              orgIntroduction,
              orgThumbnail,
              selectedUserNames,
              selectedNickNames,
              memberUserNames,
              memberNickNames,
              myUserName,
              searchedUsers : result[0],
            });
          }else{
            res.render('membersManagement.ejs', {
              orgName,
              orgIntroduction,
              orgThumbnail,
              selectedUserNames,
              selectedNickNames,
              notice : '該当するユーザーが見つかりません。',
              memberUserNames,
              memberNickNames,
              myUserName,
            });
          }
        });
      });
    }
  });
});

router.post('/selectUser', (req, res) => {
  var results = req.body.result;
  if(req.session.excludeUserInMemberManagement) delete req.session.excludeUserInMemberManagement;
  if(req.session.selectUserInMemberManagement === req.body.result){
    delete req.session.selectUserInMemberManagement;
    res.redirect('/PHH_Bookmark/membersManagement');
  }else{
    results = results.split(',');
    var selectedUserName = results[0];
    var selectedNickName = results[1];
    selectedUserNames.push(selectedUserName);
    selectedNickNames.push(selectedNickName);
    var orgId = req.session.org_id;
    var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
    connection.query(specifyOrg, [orgId]).then((result) => {
      var orgName = result[0][0].name;
      var orgIntroduction = result[0][0].introduction;
      var orgThumbnail = result[0][0].image_path;
      if(req.session.selectUserInMemberManagement) delete req.session.selectUserInMemberManagement;
      req.session.selectUserInMemberManagement = req.body.result;
      res.render('membersManagement.ejs', {
        orgName,
        orgIntroduction,
        orgThumbnail,
        selectedUserNames,
        selectedNickNames,
        memberNickNames,
        memberUserNames,
        myUserName,
      });
    });
  }
});

router.post('/excludeUser', (req, res) => {
  if(req.session.selectUserInMemberManagement) delete req.session.selectUserInMemberManagement;
  var results = req.body.result;
  results = results.split(',');
  var excludeUserName = results[0];
  var excludeNickName = results[1];
  var orgId = req.session.org_id;
  (() => {
    var promise = new Promise((resolve) => {
      if(req.session.excludeUserInMemberManagement === req.body.result){
        delete req.session.excludeUserInMemberManagement;
        res.redirect('/PHH_Bookmark/membersManagement');
      }else{
        resolve();
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
      connection.query(specifyOrg, [orgId]).then((result) => {
        var orgName = result[0][0].name;
        var orgIntroduction = result[0][0].introduction;
        var orgThumbnail = result[0][0].image_path;
        var values = {
          orgName,
          orgIntroduction,
          orgThumbnail,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      selectedUserNames.some((currentValue, index) => {
        if(currentValue === excludeUserName){
          selectedUserNames.splice(index, 1);
        }
        return 0;
      });
      resolve(values);
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      selectedNickNames.some((currentValue, index) => {
        if(currentValue === excludeNickName){
          selectedNickNames.splice(index, 1);
        }
        return 0;
      });
      resolve(values);
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    req.session.excludeUserInMemberManagement = req.body.result;
    res.render('membersManagement.ejs', {
      orgName,
      orgIntroduction,
      orgThumbnail,
      selectedUserNames,
      selectedNickNames,
      memberUserNames,
      memberNickNames,
      myUserName,
    });
  });
});

router.post('/makeJoin', (req, res) => {
  var orgId = req.session.org_id;
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
  })().then((value) => {
    var userNamesForQuery = value;
    var promise = new Promise((resolve) => {
      var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ' + userNamesForQuery;
      connection.query(selectUserId).then((result) => {
        var selectedUserIds = result[0];
        resolve(selectedUserIds);
      });
    });
    return promise;
  }).then((value) => {
    var selectedUserIds = value;
    var promise = new Promise((resolve) => {
      var makeJoin = 'INSERT INTO `organization_memberships` (`user_id`, `org_id`, `is_admin`) VALUES (?, ?, ?)';
      selectedUserIds.forEach((currentValue, index, array) => {
        connection.query(makeJoin, [currentValue.user_id, orgId, false]).then(() => {
          if(index + 1 === array.length){
            resolve();
          }
        });
      });
    });
    return promise;
  }).then(() => {
    res.redirect('/PHH_Bookmark/membersManagement');
  });
});

router.post('/expelUser', (req, res) => {
  var orgId = req.session.org_id;
  var expelUserName = req.body.result;
  (() => {
    var promise = new Promise((resolve) => {
      var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
      connection.query(selectUserId, [expelUserName]).then((result) => {
        var expelUserId = result[0][0].user_id;
        resolve(expelUserId);
      });
    });
    return promise;
  })().then((value) => {
    var expelUserId = value;
    var expelUser = 'DELETE FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
    connection.query(expelUser, [expelUserId, orgId]).then(() => {
      res.redirect('/PHH_Bookmark/membersManagement');
    });
  });
});

router.post('/leave', (req, res) => {
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
      connection.query(specifyOrg, [orgId]).then((result) => {
        var values = {
          orgName : result[0][0].name,
          orgIntroduction : result[0][0].introduction,
          orgThumbnail : result[0][0].image_path,
        };
        resolve(values);
      });
    });
    return promise;
  })().then((values) => {
    var promise = new Promise((resolve) => {
      var selectAdmins = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = true';
      connection.query(selectAdmins, [orgId]).then((result) => {
        if(result[0].length > 1){
          resolve();
        }else{
          res.render('membersManagement.ejs', {
            memberUserNames,
            memberNickNames,
            orgName : values.orgName,
            orgThumbnail : values.image_path,
            orgIntroduction : values.orgIntroduction,
            myUserName,
            authorityNotice : '管理者が一人のみのため脱退はできません。',
          });
        }
      });
    });
    return promise;
  }).then(() => {
    var leave = 'DELETE FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
    connection.query(leave, [myId, orgId]).then(() => {
      res.redirect('/PHH_Bookmark/topPage');
    });
  });
});
module.exports = router;
