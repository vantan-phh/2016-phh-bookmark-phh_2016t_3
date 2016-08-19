var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

var isAdmin;

router.get('/', (req, res) => {
  var bookmarkId = req.session.edit_org_bookmark_id;
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var checkMembership = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
      connection.query(checkMembership, [myId, orgId]).then((result) => {
        if(result[0].length > 0){
          if(result[0][0].is_admin === 1){
            isAdmin = true;
          }else{
            isAdmin = false;
          }
          resolve(isAdmin);
        }else{
          res.redirect('/PHH_Bookmark/topPage');
        }
      });
    });
    return promise;
  })().then((value) => {
    isAdmin = value;
    var promise = new Promise((resolve) => {
      var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ?';
      connection.query(selectBookmarkData, [bookmarkId]).then((result) => {
        var title = result[0][0].title;
        var description = result[0][0].description;
        var values = {
          isAdmin,
          title,
          description,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    isAdmin = values.isAdmin;
    var title = values.title;
    var description = values.description;
    var promise = new Promise((resolve) => {
      var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ?';
      connection.query(selectOrgData, [orgId]).then((result) => {
        var orgName = result[0][0].name;
        var orgIntroduction = result[0][0].introduction;
        var orgThumbnail = result[0][0].image_path;
        values = {
          isAdmin,
          title,
          description,
          orgName,
          orgIntroduction,
          orgThumbnail,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    isAdmin = values.isAdmin;
    var title = values.title;
    var description = values.description;
    var orgName = values.orgName;
    var orgThumbnail = values.orgThumbnail;
    var orgIntroduction = values.orgIntroduction;
    res.render('orgBookmarkEdit.ejs', {
      title,
      description,
      orgName,
      orgThumbnail,
      orgIntroduction,
      isAdmin,
    });
  });
});

router.post('/', (req, res) => {
  var title = req.body.title;
  var description = req.body.description;
  var orgId = req.session.org_id;
  var bookmarkId = req.session.edit_org_bookmark_id;
  var checkInjection = /[%;+-]+/g;
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
      if(!checkInjection.test(title)){
        resolve(values);
      }else{
        res.render('orgBookmarkEdit.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          title,
          description,
          titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません',
        });
      }
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    if(!checkInjection.test(description)){
      var editBookmarkQuery = 'UPDATE `bookmarks` SET `title` = ?, `description` = ? WHERE `bookmark_id` = ?';
      connection.query(editBookmarkQuery, [title, description, bookmarkId]).then(() => {
        res.redirect('/PHH_Bookmark/organizationPage');
      });
    }else{
      res.render('orgBookmarkEdit.ejs', {
        orgName,
        orgIntroduction,
        orgThumbnail,
        title,
        description,
        descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません',
      });
    }
  });
});

router.post('/delete', (req, res) => {
  var ids = req.body;
  var idArray = [];
  (() => {
    var promise = new Promise((resolve) => {
      for(var x in ids){
        idArray.push(x);
      }
      resolve(idArray);
    });
    return promise;
  })().then((value) => {
    idArray = value;
    var promise = new Promise((resolve) => {
      var idsForQuery = '';
      idArray.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          idsForQuery += currentValue;
          resolve(idsForQuery);
        }else{
          idsForQuery += currentValue + ' OR `bookmark_id` = ';
        }
      });
    });
    return promise;
  }).then((value) => {
    var idsForQuery = value;
    var deleteBookmark = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ' + idsForQuery;
    connection.query(deleteBookmark).then(() => {
      res.redirect('/PHH_Bookmark/organizationPage');
    });
  });
});

module.exports = router;
