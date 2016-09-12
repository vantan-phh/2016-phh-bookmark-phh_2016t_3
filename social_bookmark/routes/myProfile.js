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
    var promise = new Promise((resolve) => {
      var selectRecentBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? ORDER BY `bookmark_id` DESC LIMIT 5';
      connection.query(selectRecentBookmarks, [userId]).then((result) => {
        values.recentBookmarks = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      if(values.recentBookmarks.length){
        var bookmarkIdsForQuery = '';
        values.recentBookmarks.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            bookmarkIdsForQuery += currentValue.bookmark_id;
            values.bookmarkIdsForQuery = bookmarkIdsForQuery;
            resolve(values);
          }else{
            bookmarkIdsForQuery += currentValue.bookmark_id + ' OR `bookmark_id` = ';
          }
        });
      }else{
        reject(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectComment = 'SELECT * FROM `comments` WHERE `bookmark_id` = ' + values.bookmarkIdsForQuery;
      connection.query(selectComment).then((result) => {
        values.selectedComments = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      if(values.selectedComments.length){
        var commentedBookmarkIds = [];
        values.selectedComments.forEach((currentValue, index, array) => {
          commentedBookmarkIds.push(currentValue.bookmark_id);
          if(index + 1 === array.length){
            values.commentedBookmarkIds = commentedBookmarkIds;
            resolve(values);
          }
        });
      }else{
        reject(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      if(values.commentedBookmarkIds.length){
        values.commentedBookmarkIds = values.commentedBookmarkIds.filter((currentValue, _index, array) => array.indexOf(currentValue) === _index);
        resolve(values);
      }else{
        reject(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var comments = {};
      values.commentedBookmarkIds.forEach((currentValue, index, array) => {
        comments[currentValue] = [];
        if(index + 1 === array.length){
          values.comments = comments;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.selectedComments.forEach((currentValue, index, array) => {
        for(var key in values.comments){
          if(key === currentValue.bookmark_id.toString()){
            values.comments[key].push(currentValue);
          }
          if(index + 1 === array.length){
            resolve(values);
          }
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.recentBookmarks.forEach((currentValue, index, array) => {
        for(var key in values.comments){
          if(key === currentValue.bookmark_id.toString()){
            if(values.comments[key].length){
              currentValue.numberOfComments = values.comments[key].length;
            }else{
              currentValue.numberOfComments = 0;
            }
          }
          if(index + 1 === array.length){
            resolve(values);
          }
        }
      });
    });
    return promise;
  }).then((values) => {
    res.render('userProfile.ejs', {
      userName : values.userName,
      nickName : values.nickName,
      thumbnailPath : values.thumbnailPath,
      introduction : values.introduction,
      recentBookmarks : values.recentBookmarks,
      orgData : values.orgData,
    });
  }).catch((values) => {
    res.render('userProfile', {
      userName : values.userName,
      nickName : values.nickName,
      thumbnailPath : values.thumbnailPath,
      introduction : values.introduction,
      recentBookmarks : values.recentBookmarks,
      orgData : values.orgData,
    });
  });
});


module.exports = router;
