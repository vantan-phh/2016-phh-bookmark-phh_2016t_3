var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

var myUserName;
var cannotRenounce;

router.get('/', (req, res) => {
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var adminIds = [];
  var notAdminIds = [];
  (() => {
    var promise = new Promise((resolve) => {
      var checkAuthority = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `user_id` = ? AND `is_admin` = true';
      connection.query(checkAuthority, [orgId, myId]).then((result) => {
        if(result[0].length > 0){
          resolve();
        }else{
          res.redirect('/PHH_Bookmark/organizationPage');
        }
      });
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      var selectAdmins = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = ?';
      connection.query(selectAdmins, [orgId, 1]).then((result) => {
        result[0].forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            adminIds.push(currentValue.user_id);
            resolve();
          }else{
            adminIds.push(currentValue.user_id);
          }
        });
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var selectNotAdmins = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = ?';
      connection.query(selectNotAdmins, [orgId, 0]).then((result) => {
        if(result[0].length > 0){
          result[0].forEach((currentValue, index, array) => {
            if(index + 1 === array.length){
              notAdminIds.push(currentValue);
              resolve();
            }else{
              notAdminIds.push(currentValue);
            }
          });
        }else{
          resolve();
        }
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var adminIdsForQuery = '';
      adminIds.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          adminIdsForQuery += currentValue;
          resolve(adminIdsForQuery);
        }else{
          adminIdsForQuery += currentValue + ' OR `user_id` = ';
        }
      });
    });
    return promise;
  }).then((value) => {
    var adminIdsForQuery = value;
    var promise = new Promise((resolve) => {
      var notAdminIdsForQuery = '';
      if(notAdminIds.length > 0){
        notAdminIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            notAdminIdsForQuery += currentValue.user_id;
            var values = {
              adminIdsForQuery,
              notAdminIdsForQuery,
            };
            resolve(values);
          }else{
            notAdminIdsForQuery += currentValue.user_id + ' OR  `user_id` = ';
          }
        });
      }else{
        var values = {
          adminIdsForQuery,
          notAdminIdsForQuery,
        };
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var adminIdsForQuery = values.adminIdsForQuery;
    var notAdminIdsForQuery = values.notAdminIdsForQuery;
    var promise = new Promise((resolve) => {
      var selectUserNames = 'SELECT `name` FROM `users` WHERE `user_id` = ' + adminIdsForQuery;
      connection.query(selectUserNames).then((result) => {
        var selectedAdminUserNames = result[0];
        values = {
          adminIdsForQuery,
          notAdminIdsForQuery,
          selectedAdminUserNames,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var selectedAdminUserNames = values.selectedAdminUserNames;
    var promise = new Promise((resolve) => {
      var adminUserNames = [];
      selectedAdminUserNames.forEach((currentValue, index, array) => {
        adminUserNames.push(currentValue.name);
        if(index + 1 === array.length){
          values.adminUserNames = adminUserNames;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var adminIdsForQuery = values.adminIdsForQuery;
    var promise = new Promise((resolve) => {
      var selectNickNames = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ' + adminIdsForQuery;
      connection.query(selectNickNames, [adminIdsForQuery]).then((result) => {
        var selectedAdminNickNames = result[0];
        values.selectedAdminNickNames = selectedAdminNickNames;
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var selectedAdminNickNames = values.selectedAdminNickNames;
    var promise = new Promise((resolve) => {
      var adminNickNames = [];
      selectedAdminNickNames.forEach((currentValue, index, array) => {
        adminNickNames.push(currentValue.nick_name);
        if(index + 1 === array.length){
          values.adminNickNames = adminNickNames;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectOrgData = 'SELECT * FROM `organizations` WHERE `org_id` = ?';
      connection.query(selectOrgData, [orgId]).then((result) => {
        values.orgName = result[0][0].name;
        values.orgIntroduction = result[0][0].introduction;
        values.orgThumbnail = result[0][0].image_path;
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var notAdminIdsForQuery = values.notAdminIdsForQuery;
    var adminUserNames = values.adminUserNames;
    var adminNickNames = values.adminNickNames;
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var promise = new Promise((resolve) => {
      if(notAdminIds.length > 0){
        var selectUserNames = 'SELECT `name` FROM `users` WHERE `user_id` = ' + notAdminIdsForQuery;
        connection.query(selectUserNames).then((result) => {
          var selectedNotAdminUserNames = result[0];
          values.selectedNotAdminUserNames = selectedNotAdminUserNames;
          resolve(values);
        });
      }else{
        var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
        connection.query(selectMyUserName, [myId]).then((result) => {
          myUserName = result[0][0].name;
          if(cannotRenounce === 1){
            cannotRenounce = 0;
            res.render('switchAuthority.ejs', {
              orgName,
              orgIntroduction,
              orgThumbnail,
              adminUserNames,
              adminNickNames,
              notAdminUserNames : undefined,
              notAdminNickNames : undefined,
              myUserName,
              authorityNotice : '管理者が1名のみのため権限の放棄はできません。',
            });
          }else{
            res.render('switchAuthority.ejs', {
              orgName,
              orgIntroduction,
              orgThumbnail,
              adminUserNames,
              adminNickNames,
              notAdminUserNames : undefined,
              notAdminNickNames : undefined,
              myUserName,
            });
          }
        });
      }
    });
    return promise;
  }).then((values) => {
    var selectedNotAdminUserNames = values.selectedNotAdminUserNames;
    var promise = new Promise((resolve) => {
      var notAdminUserNames = [];
      selectedNotAdminUserNames.forEach((currentValue, index, array) => {
        notAdminUserNames.push(currentValue.name);
        if(index + 1 === array.length){
          values.notAdminUserNames = notAdminUserNames;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var notAdminIdsForQuery = values.notAdminIdsForQuery;
    var promise = new Promise((resolve) => {
      var selectNickNames = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ' + notAdminIdsForQuery;
      connection.query(selectNickNames).then((result) => {
        var selectedNotAdminNickNames = result[0];
        values.selectedNotAdminNickNames = selectedNotAdminNickNames;
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var selectedNotAdminNickNames = values.selectedNotAdminNickNames;
    var promise = new Promise((resolve) => {
      var notAdminNickNames = [];
      selectedNotAdminNickNames.forEach((currentValue, index, array) => {
        notAdminNickNames.push(currentValue.nick_name);
        if(index + 1 === array.length){
          values.notAdminNickNames = notAdminNickNames;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var adminUserNames = values.adminUserNames;
    var adminNickNames = values.adminNickNames;
    var notAdminUserNames = values.notAdminUserNames;
    var notAdminNickNames = values.notAdminNickNames;
    var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
    connection.query(selectMyUserName, [myId]).then((result) => {
      myUserName = result[0][0].name;
      if(cannotRenounce === 1){
        cannotRenounce = 0;
        res.render('switchAuthority.ejs', {
          orgName,
          orgThumbnail,
          orgIntroduction,
          adminNickNames,
          adminUserNames,
          notAdminNickNames,
          notAdminUserNames,
          myUserName,
          authorityNotice : '管理者が1名のみのため、権限の放棄はできません。',
        });
      }else{
        res.render('switchAuthority.ejs', {
          orgName,
          orgThumbnail,
          orgIntroduction,
          adminNickNames,
          adminUserNames,
          notAdminNickNames,
          notAdminUserNames,
          myUserName,
        });
      }
    });
  });
});


router.post('/give', (req, res) => {
  var orgId = req.session.org_id;
  var authorizedUserName = req.body.result;
  var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
  var authorize = 'UPDATE `organization_memberships` SET `is_admin` = true WHERE `user_id` = ? AND `org_id` = ?';
  (() => {
    var promise = new Promise((resolve) => {
      connection.query(selectUserId, [authorizedUserName]).then((result) => {
        var authorizedUserId = result[0][0].user_id;
        resolve(authorizedUserId);
      });
    });
    return promise;
  })().then((value) => {
    var authorizedUserId = value;
    connection.query(authorize, [authorizedUserId, orgId]).then(() => {
      res.redirect('/PHH_Bookmark/switchAuthority');
    });
  });
});

router.post('/renounce', (req, res) => {
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var selectAdmins = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = true';
      connection.query(selectAdmins, [orgId]).then((result) => {
        if(result[0].length > 1){
          resolve();
        }else{
          cannotRenounce = 1;
          res.redirect('/PHH_Bookmark/switchAuthority');
        }
      });
    });
    return promise;
  })().then(() => {
    var renounce = 'UPDATE `organization_memberships` SET `is_admin` = false WHERE `user_id` = ? AND `org_id` = ?';
    connection.query(renounce, [myId, orgId]).then(() => {
      res.redirect('/PHH_Bookmark/switchAuthority');
    });
  });
});

module.exports = router;
