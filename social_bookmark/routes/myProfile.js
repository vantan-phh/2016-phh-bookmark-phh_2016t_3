var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  var userId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var query = 'SELECT `name`, `nick_name`, `image_path`, `introduction` FROM `users` WHERE `user_id` = ?';
      connection.query(query, [userId]).then((result) => {
        var nickName = result[0][0].nick_name;
        var thumbnailPath = result[0][0].image_path;
        var introduction = result[0][0].introduction;
        var userName = result[0][0].name;
        if(introduction === null || introduction === ''){
          introduction = '自己紹介';
        }
        var values = {
          nickName,
          thumbnailPath,
          introduction,
          userName,
        };
        resolve(values);
      });
    });
    return promise;
  })().then((values) => {
    var promise = new Promise((resolve) => {
      var selectBelongOrg = 'SELECT `org_id` FROM `organization_memberships` WHERE `user_id` = ?';
      connection.query(selectBelongOrg, [userId]).then((result) => {
        values.selectedBelongOrgIds = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var belongOrgIdsForQuery = '';
      if(values.selectedBelongOrgIds.length > 0){
        values.selectedBelongOrgIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            belongOrgIdsForQuery += currentValue.org_id;
            values.belongOrgIdsForQuery = belongOrgIdsForQuery;
            resolve(values);
          }else{
            belongOrgIdsForQuery += currentValue.org_id + ' OR `id` = ';
          }
        });
      }else{
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.belongOrgIdsForQuery){
        var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ' + values.belongOrgIdsForQuery;
        connection.query(selectOrgData).then((result) => {
          values.orgData = result[0];
          resolve(values);
        });
      }else{
        values.orgData = [];
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var selectRecentBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? ORDER BY `bookmark_id` DESC LIMIT 5';
    connection.query(selectRecentBookmarks, [userId]).then((result) => {
      res.render('userProfile.ejs', {
        userName : values.userName,
        nickName : values.nickName,
        thumbnailPath : values.thumbnailPath,
        introduction : values.introduction,
        recentBookmarks : result[0],
        orgData : values.orgData,
      });
    });
  });
});


module.exports = router;
