var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.post('/', (req, res) => {
  var target = req.body.result;
  if(req.session.target){
    delete req.session.target;
  }
  req.session.target = target;
  res.redirect('/PHH_Bookmark/otherProfile');
});

router.get('/', (req, res) => {
  var target = req.session.target;
  (() => {
    var promise = new Promise((resolve, reject) => {
      var query = 'SELECT `name`, `nick_name`, `image_path`, `introduction`, `hash` FROM `users` WHERE `user_id` = ?';
      connection.query(query, [target]).then((result) => {
        if(result[0][0].hash === 'unknown') reject();
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
      connection.query(selectBelongOrg, [target]).then((result) => {
        values.selectedBelongOrgIds = result[0];
        resolve(values);
      });
    });
    return promise;
  }).catch(() => {
    res.render('userProfile.ejs', {
      userName : '',
      nickName : '',
      thumbnailPath : '',
      introduction : '',
      recentBookmarks : '',
      orgData : '',
      notExist : 'このユーザーはすでに存在しません。',
    });
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      var selectOrgData = 'SELECT * FROM `organizations` WHERE `org_id` =';
      if(values.selectedBelongOrgIds.length > 0){
        values.selectedBelongOrgIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            selectOrgData += ' ?';
            values.selectOrgData = selectOrgData;
            resolve(values);
          }else{
            selectOrgData += ' ? OR `org_id` = ';
          }
        });
      }else{
        values.orgData = [];
        reject(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var belongOrgIds = [];
      values.selectedBelongOrgIds.forEach((currentValue, index, array) => {
        belongOrgIds.push(currentValue.org_id);
        if(index + 1 === array.length){
          values.belongOrgIds = belongOrgIds;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      connection.query(values.selectOrgData, values.belongOrgIds).then((result) => {
        values.orgData = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      var selectRecentBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? ORDER BY `bookmark_id` DESC LIMIT 6';
      connection.query(selectRecentBookmarks, [target]).then((result) => {
        values.recentBookmarks = result[0];
        values.recentBookmarks.length ? resolve(values) : reject(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectComment = 'SELECT * FROM `comments` WHERE `bookmark_id` =';
      values.recentBookmarks.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          selectComment += ' ?';
          values.selectComment = selectComment;
          resolve(values);
        }else{
          selectComment += '? OR `bookmark_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var bookmarkIds = [];
      values.recentBookmarks.forEach((currentValue, index, array) => {
        bookmarkIds.push(currentValue.bookmark_id);
        if(index + 1 === array.length){
          values.bookmarkIds = bookmarkIds;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      connection.query(values.selectComment, values.bookmarkIds).then((result) => {
        values.selectedComments = result[0];
        values.selectedComments.length ? resolve(values) : reject(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      var commentedBookmarkIds = [];
      values.selectedComments.forEach((currentValue, index, array) => {
        commentedBookmarkIds.push(currentValue.bookmark_id);
        if(index + 1 === array.length){
          values.commentedBookmarkIds = commentedBookmarkIds;
          values.commentedBookmarkIds.length ? resolve(values) : reject(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.commentedBookmarkIds = values.commentedBookmarkIds.filter((currentValue, _index, array) => array.indexOf(currentValue) === _index);
      resolve(values);
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
      var commentsKeyArray = Object.keys(values.comments);
      values.selectedComments.forEach((currentValue, index, array) => {
        commentsKeyArray.forEach((key, _index, _array) => {
          if(key === currentValue.bookmark_id.toString()) values.comments[key].push(currentValue);
          if(index + 1 === array.length && _index + 1 === _array.length) resolve(values);
        });
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var commentsKeyArray = Object.keys(values.comments);
      values.recentBookmarks.forEach((currentValue, index, array) => {
        commentsKeyArray.forEach((key, _index, _array) => {
          if(key === currentValue.bookmark_id.toString()){
            if(values.comments[key].length){
              currentValue.numberOfComments = values.comments[key].length;
            }else{
              currentValue.numberOfComments = 0;
            }
          }
          if(index + 1 === array.length && _index + 1 === _array.length){
            resolve(values);
          }
        });
      });
    });
    return promise;
  }).then((values) => {
    res.render('userProfile.ejs', {
      targetUserName : values.userName,
      targetNickName : values.nickName,
      thumbnailPath : values.thumbnailPath,
      introduction : values.introduction,
      recentBookmarks : values.recentBookmarks,
      orgData : values.orgData,
    });
  }).catch((values) => {
    res.render('userProfile', {
      targetUserName : values.userName,
      targetNickName : values.nickName,
      thumbnailPath : values.thumbnailPath,
      introduction : values.introduction,
      recentBookmarks : values.recentBookmarks,
      orgData : values.orgData,
    });
  });
});

module.exports = router;
