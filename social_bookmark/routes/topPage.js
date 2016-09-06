var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  var myId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var selectBelongOrg = 'SELECT `org_id` FROM `organization_memberships` WHERE `user_id` = ?';
      connection.query(selectBelongOrg, [myId]).then((result) => {
        var values = {
          selectedOrgIds : result[0],
        };
        resolve(values);
      });
    });
    return promise;
  })().then((values) => {
    var promise = new Promise((resolve) => {
      if(values.selectedOrgIds.length > 0){
        var orgIdsForQuery = '';
        values.selectedOrgIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            orgIdsForQuery += currentValue.org_id;
            values.orgIdsForQuery = orgIdsForQuery;
            resolve(values);
          }else{
            orgIdsForQuery += currentValue.org_id + ' OR `id` = ';
          }
        });
      }else{
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.orgIdsForQuery){
        var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ' + values.orgIdsForQuery;
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
      if(values.selectedOrgIds.length > 0){
        var orgBookmarks = {};
        values.selectedOrgIds.forEach((currentValue, index, array) => {
          var selectOrgBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? ORDER BY `bookmark_id` DESC LIMIT 5';
          connection.query(selectOrgBookmarks, [currentValue.org_id]).then((result) => {
            orgBookmarks[currentValue.org_id] = result[0];
            if(index + 1 === array.length){
              values.orgBookmarks = orgBookmarks;
              resolve(values);
            }
          });
        });
      }else{
        values.orgBookmarks = false;
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.orgBookmarks){
        var orgIds = [];
        for(var key in values.orgBookmarks){
          orgIds.push(key);
        }
        values.orgIds = orgIds;
        resolve(values);
      }else{
        values.orgIds = [];
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.orgIds.length){
        var orgIdsForQuery = '';
        values.orgIds.forEach((currentValue, index, array) => {
          if(index + 1 === array.length){
            orgIdsForQuery += currentValue;
            values.orgIdsForQuery = orgIdsForQuery;
            resolve(values);
          }else{
            orgIdsForQuery += currentValue + ' OR `org_id` = ';
          }
        });
      }else{
        values.orgIdsForQuery = false;
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.orgIdsForQuery){
        var selectBookmarkId = 'SELECT `bookmark_id` FROM `bookmarks` WHERE `org_id` = ' + values.orgIdsForQuery;
        connection.query(selectBookmarkId).then((result) => {
          values.selectedBookmarkIds = result[0];
          resolve(values);
        });
      }else{
        values.selectedBookmarkIds = [];
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectComment = 'SELECT * FROM `comments` WHERE `bookmark_id` = ?';
      if(values.selectedBookmarkIds.length > 0){
        values.selectedBookmarkIds.forEach((currentValue, index, array) => {
          connection.query(selectComment, [currentValue.bookmark_id]).then((result) => {
            for(var key in values.orgBookmarks){
              if(values.orgBookmarks[key].length > 0){
                values.orgBookmarks[key].forEach((_currentValue, _index, _array) => {
                  if(_currentValue.bookmark_id === currentValue.bookmark_id){
                    _currentValue.numberOfComments = result[0].length;
                  }
                  if(_index + 1 === _array.length && index + 1 === array.length){
                    resolve(values);
                  }
                });
              }
            }
          });
        });
      }else{
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      if(values.orgIdsForQuery){
        values.orgIdsForQuery = values.orgIdsForQuery.replace(/`org_id`/g, '`id`');
        var selectOrgDataForOrgBookmarks = 'SELECT * FROM `organizations` WHERE `id` = ' + values.orgIdsForQuery;
        connection.query(selectOrgDataForOrgBookmarks).then((result) => {
          values.selectedOrgDataForOrgBookmarks = result[0];
          resolve(values);
        });
      }else{
        values.selectedOrgDataForOrgBookmarks = [];
        resolve(values);
      }
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      var selectRecentBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? ORDER BY `bookmark_id` DESC LIMIT 5';
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
      selectedOrgDataForOrgBookmarks : values.selectedOrgDataForOrgBookmarks,
    });
  });
});

router.post('/submit', (req, res) => {
  var newBookmarkUrl = req.body.new_bookmark_url;
  var newBookmarkTitle = req.body.title;
  var newBookmarkDescription = req.body.description;
  var query = 'INSERT INTO `user_bookmarks` (`title`,`url`,`description`) VALUES(?, ? ,?)';
  connection.query(query, [newBookmarkTitle, newBookmarkUrl, newBookmarkDescription]).then(() => {
    res.redirect('/topPage');
  });
});

module.exports = router;
