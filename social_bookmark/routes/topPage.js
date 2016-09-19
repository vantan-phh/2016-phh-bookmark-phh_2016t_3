var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  var myId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve, reject) => {
      var selectBelongOrg = 'SELECT `org_id` FROM `organization_memberships` WHERE `user_id` = ?';
      connection.query(selectBelongOrg, [myId]).then((result) => {
        var values = {
          selectedOrgIds : result[0],
        };
        values.selectedOrgIds.length ? resolve(values) : reject();
      });
    });
    return promise;
  })().then((values) => {
    var promise = new Promise((resolve) => {
      var selectOrgData = 'SELECT * FROM `organizations` WHERE `org_id` =';
      values.selectedOrgIds.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          selectOrgData += ' ?';
          values.selectOrgData = selectOrgData;
          resolve(values);
        }else{
          selectOrgData += ' ? OR `org_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.orgIds = [];
      values.selectedOrgIds.forEach((currentValue, index, array) => {
        values.orgIds.push(currentValue.org_id);
        if(index + 1 === array.length) resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      connection.query(values.selectOrgData, values.orgIds).then((result) => {
        values.orgData = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var orgBookmarks = {};
      values.orgIds.forEach((currentValue, index, array) => {
        var selectOrgBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? ORDER BY `bookmark_id` DESC LIMIT 3';
        connection.query(selectOrgBookmarks, [currentValue]).then((result) => {
          orgBookmarks[currentValue] = result[0];
          if(index + 1 === array.length){
            values.orgBookmarks = orgBookmarks;
            resolve(values);
          }
        });
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.orgIds = Object.keys(values.orgBookmarks);
      var selectBookmarkId = 'SELECT `bookmark_id` FROM `bookmarks` WHERE `org_id` =';
      values.orgIds.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          selectBookmarkId += ' ?';
          values.selectBookmarkId = selectBookmarkId;
          resolve(values);
        }else{
          selectBookmarkId += ' ? OR `org_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      connection.query(values.selectBookmarkId, values.orgIds).then((result) => {
        values.selectedBookmarkIds = result[0];
        resolve(values);
      });
    });
    return promise;
  }).catch(() => {
    var promise = new Promise((resolve, reject) => {
      var values = { orgData : [] };
      reject(values);
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve, reject) => {
      var selectComment = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
      if(values.selectedBookmarkIds.length > 0){
        var orgBookmarksKeys = Object.keys(values.orgBookmarks);
        values.selectedBookmarkIds.forEach((currentValue, index, array) => {
          connection.query(selectComment, [currentValue.bookmark_id]).then((result) => {
            orgBookmarksKeys.forEach((key, _index, _array) => {
              if(values.orgBookmarks[key].length > 0){
                values.orgBookmarks[key].forEach((_currentValue) => {
                  if(_currentValue.bookmark_id === currentValue.bookmark_id){
                    _currentValue.numberOfComments = result[0].length;
                  }
                });
              }
              if(_index + 1 === _array.length && index + 1 === array.length){
                resolve(values);
              }
            });
          });
        });
      }else{
        reject(values);
      }
    });
    return promise;
  }).catch((values) => {
    var promise = new Promise((resolve) => {
      values.selectedOrgDataForOrgBookmarks = [];
      resolve(values);
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectRecentBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? ORDER BY `bookmark_id` DESC LIMIT 6';
      connection.query(selectRecentBookmarks, [myId]).then((result) => {
        values.myBookmarks = result[0];
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.myBookmarks.length > 0){
        values.myBookmarks.forEach((currentValue, index, array) => {
          var selectComment = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
          connection.query(selectComment, [currentValue.bookmark_id]).then((result) => {
            currentValue.numberOfComments = result[0].length;
            if(index + 1 === array.length){
              resolve(values);
            }
          });
        });
      }else{
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    res.render('topPage.ejs', {
      orgData : values.orgData,
      myBookmarks : values.myBookmarks,
      orgBookmarks : values.orgBookmarks,
    });
  });
});

module.exports = router;
