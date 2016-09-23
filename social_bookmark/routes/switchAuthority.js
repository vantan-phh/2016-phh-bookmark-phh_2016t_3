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
              notAdminIds.push(currentValue.user_id);
              resolve();
            }else{
              notAdminIds.push(currentValue.user_id);
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
      var selectAdminUserName = 'SELECT * FROM `users` WHERE `user_id` =';
      adminIds.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          selectAdminUserName += ' ?';
          resolve(selectAdminUserName);
        }else{
          selectAdminUserName += ' ? OR `user_id` =';
        }
      });
    });
    return promise;
  }).then((value) => {
    var selectAdminUserName = value;
    var promise = new Promise((resolve) => {
      connection.query(selectAdminUserName, adminIds).then((result) => {
        var values = {
          selectedAdmins : result[0],
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(notAdminIds.length){
        var selectNotAdminUserName = 'SELECT * FROM `users` WHERE `user_id` = ';
        notAdminIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            selectNotAdminUserName += '?';
            values.selectNotAdminUserName = selectNotAdminUserName;
            resolve(values);
          }else{
            selectNotAdminUserName += '? OR `user_id` = ';
          }
        });
      }else{
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(notAdminIds.length){
        connection.query(values.selectNotAdminUserName, notAdminIds).then((result) => {
          values.selectedNotAdmins = result[0];
          resolve(values);
        });
      }else{
        values.selectedNotAdmins = [];
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var adminUserNames = [];
      var adminNickNames = [];
      values.selectedAdmins.forEach((currentValue, index, array) => {
        adminUserNames.push(currentValue.name);
        adminNickNames.push(currentValue.nick_name);
        if(index + 1 === array.length){
          values.adminUserNames = adminUserNames;
          values.adminNickNames = adminNickNames;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.selectedNotAdmins.length){
        var notAdminUserNames = [];
        var notAdminNickNames = [];
        values.selectedNotAdmins.forEach((currentValue, index, array) => {
          notAdminUserNames.push(currentValue.name);
          notAdminNickNames.push(currentValue.nick_name);
          if(index + 1 === array.length){
            values.notAdminUserNames = notAdminUserNames;
            values.notAdminNickNames = notAdminNickNames;
            resolve(values);
          }
        });
      }else{
        values.notAdminUserNames = [];
        resolve(values);
      }
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
    var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
    connection.query(selectMyUserName, [myId]).then((result) => {
      myUserName = result[0][0].name;
      if(cannotRenounce === 1){
        cannotRenounce = 0;
        res.render('switchAuthority.ejs', {
          orgName : values.orgName,
          orgIntroduction : values.orgIntroduction,
          orgThumbnail : values.orgThumbnail,
          adminUserNames : values.adminUserNames,
          adminNickNames : values.adminNickNames,
          notAdminUserNames : values.notAdminUserNames,
          notAdminNickNames : values.notAdminNickNames,
          myUserName,
          authorityNotice : '管理者が1名のみのため権限の放棄はできません。',
        });
      }else{
        res.render('switchAuthority.ejs', {
          orgName : values.orgName,
          orgIntroduction : values.orgIntroduction,
          orgThumbnail : values.orgThumbnail,
          adminUserNames : values.adminUserNames,
          adminNickNames : values.adminNickNames,
          notAdminUserNames : values.notAdminUserNames,
          notAdminNickNames : values.notAdminNickNames,
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
