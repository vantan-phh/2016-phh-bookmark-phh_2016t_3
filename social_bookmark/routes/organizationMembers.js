var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  var myId = req.session.user_id;
  var orgId = req.session.org_id;
  (() => {
    var promise = new Promise((resolve) => {
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
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
      var adminIdsForQuery = '';
      selectedAdminIds.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          adminIdsForQuery += currentValue.user_id;
          values.adminIdsForQuery = adminIdsForQuery;
          resolve(values);
        }else{
          adminIdsForQuery += currentValue.user_id + ' OR `user_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var adminIdsForQuery = values.adminIdsForQuery;
    var promise = new Promise((resolve) => {
      var selectAdmins = 'SELECT * FROM `users` WHERE `user_id` = ' + adminIdsForQuery;
      connection.query(selectAdmins).then((result) => {
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
    var promise = new Promise((resolve) => {
      var notAdminIdsForQuery = '';
      if(selectedNotAdminIds.length > 0){
        selectedNotAdminIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            notAdminIdsForQuery += currentValue.user_id;
            values.notAdminIdsForQuery = notAdminIdsForQuery;
            resolve(values);
          }else{
            notAdminIdsForQuery += currentValue.user_id + ' OR `user_id` = ';
          }
        });
      }else{
        values.notAdminIdsForQuery = notAdminIdsForQuery;
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var notAdminIdsForQuery = values.notAdminIdsForQuery;
    var promise = new Promise((resolve) => {
      if(notAdminIdsForQuery === ''){
        values.selectedNotAdminData = [];
        resolve(values);
      }else{
        var selectNotAdminData = 'SELECT * FROM `users` WHERE `user_id` = ' + notAdminIdsForQuery;
        connection.query(selectNotAdminData).then((result) => {
          values.selectedNotAdminData = result[0];
          resolve(values);
        });
      }
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
    res.render('organizationMembers.ejs', {
      orgName : values.orgData.name,
      orgIntroduction : values.orgData.introduction,
      orgThumbnail : values.orgData.image_path,
      selectedAdminData : values.selectedAdminData,
      selectedNotAdminData : values.selectedNotAdminData,
      myUserName : values.myUserName,
    });
  });
});

module.exports = router;
