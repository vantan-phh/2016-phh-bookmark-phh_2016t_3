var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

var cannotLeave;

router.get('/', (req, res) => {
  var myId = req.session.user_id;
  var orgId = req.session.org_id;
  (() => {
    var promise = new Promise((resolve) => {
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `org_id` = ?';
      connection.query(specifyOrg, [orgId]).then((result) => {
        resolve(result[0][0]);
      });
    });
    return promise;
  })().then((value) => {
    var orgData = value;
    var promise = new Promise((resolve) => {
      var selectAdminIds = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = true';
      connection.query(selectAdminIds, [orgId]).then((result) => {
        var selectedAdminIds = result[0];
        var values = {
          orgData,
          selectedAdminIds,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var selectedAdminIds = values.selectedAdminIds;
    var promise = new Promise((resolve) => {
      var selectAdmins = 'SELECT * FROM `users` WHERE `user_id` = ';
      selectedAdminIds.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          selectAdmins += '?';
          values.selectAdmins = selectAdmins;
          resolve(values);
        }else{
          selectAdmins += '? OR `user_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.adminIds = [];
      values.selectedAdminIds.forEach((currentValue, index, array) => {
        values.adminIds.push(currentValue.user_id);
        if(index + 1 === array.length) resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      connection.query(values.selectAdmins, values.adminIds).then((result) => {
        values.selectedAdminData = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectNotAdminIds = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = false';
      connection.query(selectNotAdminIds, [orgId]).then((result) => {
        values.selectedNotAdminIds = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var selectedNotAdminIds = values.selectedNotAdminIds;
    var promise = new Promise((resolve, reject) => {
      var selectNotAdminData = 'SELECT * FROM `users` WHERE `user_id` = ';
      if(selectedNotAdminIds.length > 0){
        selectedNotAdminIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            selectNotAdminData += '?';
            values.selectNotAdminData = selectNotAdminData;
            resolve(values);
          }else{
            selectNotAdminData += '? OR `user_id` = ';
          }
        });
      }else{
        reject(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.notAdminIds = [];
      values.selectedNotAdminIds.forEach((currentValue, index, array) => {
        values.notAdminIds.push(currentValue.user_id);
        if(index + 1 === array.length) resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      connection.query(values.selectNotAdminData, values.notAdminIds).then((result) => {
        values.selectedNotAdminData = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
      connection.query(selectMyUserName, [myId]).then((result) => {
        values.myUserName = result[0][0].name;
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    if(cannotLeave === 1){
      cannotLeave = 0;
      res.render('organizationMembers.ejs', {
        orgName : values.orgData.name,
        orgIntroduction : values.orgData.introduction,
        orgThumbnail : values.orgData.image_path,
        orgId : values.orgData.org_id,
        selectedAdminData : values.selectedAdminData,
        selectedNotAdminData : values.selectedNotAdminData,
        myUserName : values.myUserName,
        cannotLeaveNotice : 'この組織の管理者が1名のみのため、脱退はできません。',
      });
    }else{
      res.render('organizationMembers.ejs', {
        orgName : values.orgData.name,
        orgIntroduction : values.orgData.introduction,
        orgThumbnail : values.orgData.image_path,
        orgId : values.orgData.org_id,
        selectedAdminData : values.selectedAdminData,
        selectedNotAdminData : values.selectedNotAdminData,
        myUserName : values.myUserName,
      });
    }
  }).catch((values) => {
    if(cannotLeave === 1){
      cannotLeave = 0;
      res.render('organizationMembers.ejs', {
        orgName : values.orgData.name,
        orgIntroduction : values.orgData.introduction,
        orgThumbnail : values.orgData.image_path,
        orgId : values.orgDara.org_id,
        selectedAdminData : values.selectedAdminData,
        selectedNotAdminData : values.selectedNotAdminData,
        myUserName : values.myUserName,
        cannotLeaveNotice : 'この組織の管理者が1名のみのため、脱退はできません。',
      });
    }else{
      res.render('organizationMembers.ejs', {
        orgName : values.orgData.name,
        orgIntroduction : values.orgData.introduction,
        orgThumbnail : values.orgData.image_path,
        orgId : values.orgData.org_id,
        selectedAdminData : values.selectedAdminData,
        selectedNotAdminData : values.selectedNotAdminData,
        myUserName : values.myUserName,
      });
    }
  });
});

router.post('/leave', (req, res) => {
  var myId = req.session.user_id;
  var orgId = req.session.org_id;
  (() => {
    var promise = new Promise((resolve) => {
      var checkAuthority = 'SELECT `is_admin` FROM `organization_memberships` WHERE `org_id` = ? AND `user_id` = ?';
      connection.query(checkAuthority, [orgId, myId]).then((result) => {
        resolve(result[0][0].is_admin);
      });
    });
    return promise;
  })().then((isAdmin) => {
    if(isAdmin === 1){
      (() => {
        var promise = new Promise((resolve) => {
          var selectAdmins = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ? AND `is_admin` = true';
          connection.query(selectAdmins, [orgId]).then((result) => {
            if(result[0].length > 1){
              resolve();
            }else{
              cannotLeave = 1;
              res.redirect('/PHH_Bookmark/organizationMembers');
            }
          });
        });
        return promise;
      })().then(() => {
        var leave = 'DELETE FROM `organization_memberships` WHERE `org_id` = ? AND `user_id` = ?';
        connection.query(leave, [orgId, myId]).then(() => {
          res.render('leave.ejs');
        });
      });
    }else{
      var leave = 'DELETE FROM `organization_memberships` WHERE `org_id` = ? AND `user_id` = ?';
      connection.query(leave, [orgId, myId]).then(() => {
        res.render('leave.ejs');
      });
    }
  });
});

module.exports = router;
