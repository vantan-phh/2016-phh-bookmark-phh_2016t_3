var express = require('express');
var router = express.Router();
var client = require('cheerio-httpcli');
//var connection = require('../mysqlConnection');
var connection = require('mysql-promise')();
connection.configure({
  'host' : 'localhost',
  'user' : 'root',
  'database' : 'phh_social_bookmark_proto'
});
var isAdmin;
var bookmarkData;
var ownBookmarkIds;
var orgName;
var orgIntroduction;
var orgThumbnail;

router.get('/',function(req,res){
  var myId = req.session.user_id;
  var orgId = req.session.org_id;
  var checkMembership = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `org_id` = ?';
  var selectOwnBookmarkIds = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND `org_id` = ?';
  var start = () => {
    var promise = new Promise((resolve,reject) => {
      connection.query(checkMembership,[myId,orgId]).then((result) => {
        isAdmin = result[0][0].is_admin === 1 ? true : false;
        resolve();
      });
    });
    return promise
  }().then(() => {
    var promise = new Promise((resolve,reject) => {
      connection.query(specifyOrg,[orgId]).then((result) => {
        orgName = result[0][0].name;
        orgIntroduction = result[0][0].introduction;
        orgThumbnail = result[0][0].image_path;
        resolve();
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve,reject) => {
      connection.query(selectBookmarkData,[orgId]).then((result) => {
        bookmarkData = result[0];
        resolve();
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve,reject) => {
      connection.query(selectOwnBookmarkIds,[myId,orgId]).then((result) => {
        ownBookmarkIds = result[0];
        resolve();
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve,reject) => {
      res.render('organizationPage.ejs',{
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        orgThumbnail : orgThumbnail,
        bookmarkData : bookmarkData,
        ownBookmarkIds : ownBookmarkIds,
        isAdmin : isAdmin
      });
    });
    return promise;
  });
});

router.post('/submitUrl',function(req,res){
  var orgId = req.session.org_id;
  var url = req.body.result;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  client.fetch(url).then((result) => {
    res.render('organizationPage.ejs',{
      bookmarkData : bookmarkData,
      ownBookmarkIds : ownBookmarkIds,
      isAdmin : isAdmin,
      orgName : orgName,
      orgIntroduction : orgIntroduction,
      orgThumbnail : orgThumbnail,
      url : url,
      title : result.$('title').text()
    });
  });
});

router.post('/',function(req,res){
  var url = req.body.url;
  var title = req.body.title;
  var description = req.body.description;
  var orgId = req.session.org_id;
  var userId = req.session.user_id;
  var query = 'INSERT INTO `bookmarks` (`user_id`,`org_id`,`title`,`url`,`description`) VALUES(?,?,?,?,?)';
  connection.query(query,[userId,orgId,title,url,description]).then((result) => {
    res.redirect('/PHH_Bookmark/organizationPage');
  });
});

router.post('/toOrgBookmarkEdit',function(req,res){
  var bookmarkId = req.body.result;
  if(req.session.edit_org_bookmark_id){
    delete req.session.edit_org_bookmark_id;
  }
  req.session.edit_org_bookmark_id = bookmarkId;
  res.redirect('/PHH_Bookmark/orgBookmarkEdit');
});

router.post('/searchBookmark',function(req,res){
  var orgId = req.session.org_id;
  var keyWord = req.body.keyWord;
  var searchFromTitle = req.body.searchFromTitle;
  var searchFromDescription = req.body.searchFromDescription;
  //var searchFromComments = req.body.searchFromComments;
  var searchFromTextsOnSites = req.body.searchFromTextsOnSites;
  // add regular express for key word
  //var keyWords = keyWord.split(' ');
  var splitKeyWord = /[\S]+/g;
  var keyWords = keyWord.match(splitKeyWord);
  if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === undefined){
    var keyWordsForQuery = '%';
    for(var i = 0; i < keyWords.length; i++){
      if(i + 1 === keyWords.length){
        keyWordsForQuery += keyWords[i] + '%';
        var selectBookmarksByTitle = 'SELECT * FROM `bookmarks` WHERE `title` LIKE "' + keyWordsForQuery + '" AND `org_id` = ?';
        connection.query(selectBookmarksByTitle,[orgId]).then((result) => {
          var searchedBookmarks = result[0];
          res.render('organizationPage.ejs',{
            orgName : orgName,
            orgIntroduction : orgIntroduction,
            orgThumbnail : orgThumbnail,
            isAdmin : isAdmin,
            searchedBookmarks : searchedBookmarks
          });
        });
      }else{
        keyWordsForQuery += keyWords[i] + '%" AND `title` LIKE "%';
      }
    }
  }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
    var keyWordsForQuery = '%';
    for(var i = 0; i < keyWords.length; i++){
      if(i + 1 === keyWords.length){
        keyWordsForQuery += keyWords[i] + '%';
        var selectBookmarksByDescription = 'SELECT * FROM `bookmarks` WHERE `description` LIKE "' + keyWordsForQuery + '" AND `org_id` = ?';
        connection.query(selectBookmarksByDescription,[orgId]).then((err,result) => {
          var searchedBookmarks = result[0];
          res.render('organizationPage.ejs',{
            orgName : orgName,
            orgIntroduction : orgIntroduction,
            orgThumbnail : orgThumbnail,
            isAdmin : isAdmin,
            searchedBookmarks : searchedBookmarks
          });
        });
      }else{
        keyWordsForQuery += keyWords[i] + '%" AND `description` LIKE "%';
      }
    }
  }else if(searchFromTitle === undefined && searchFromDescription === undefined &&  searchFromTextsOnSites === 'on'){
    var keyWordsForQuery = '%';
    console.log(keyWords);
    var selectThisOrgBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ?';
    var createTextsTable = 'CREATE TABLE `texts` (`bookmark_id` int not null , `text` TEXT )';
    var search = () => {
      var promise = new Promise((resolve,reject) => {
        connection.query(createTextsTable).then((result) => {
          resolve();
        });
      });
      return promise;
    }().then(() => {
      var promise = new Promise((resolve,reject) => {
        connection.query(selectThisOrgBookmarks,[orgId]).then((result) => {
          var bookmarksLength = result[0].length;
          var thisOrgBookmarks = result[0];
          var values = {
            bookmarksLength : bookmarksLength,
            thisOrgBookmarks : thisOrgBookmarks
          }
          console.log(thisOrgBookmarks);
          resolve(values);
        });
      });
      return promise;
    }).then((values) => {
      var bookmarksLength = values.bookmarksLength;
      var thisOrgBookmarks = values.thisOrgBookmarks;
      var promise = new Promise((resolve,reject) => {
        var bodies = [];
        var ids = [];
        for(var i = 0; i < bookmarksLength; i++){
          var bookmarkUrl = thisOrgBookmarks[i].url;
          var bookmarkId = thisOrgBookmarks[i].bookmark_id;
          ids.push(bookmarkId);
          client.fetch(bookmarkUrl).then((result) => {
            console.log('get body of the site');
            var body = result.$('body').text().replace(/\s/g,'');
            bodies.push(body);
            if(bookmarksLength === bodies.length){
              var values = {
                ids : ids,
                bodies : bodies
              }
              resolve(values);
            }
          });
        }
      });
      return promise;
    }).then((values) => {
      var ids = values.ids;
      var bodies = values.bodies;
      var promise = new Promise((resolve,reject) => {
        console.log(ids);
        var insertBodies = 'INSERT INTO `texts` (`bookmark_id`, `text`) VALUES (?, ?)';
        for(var i = 0; i < ids.length; i++){
          connection.query(insertBodies,[ids[i],bodies[i]])
        }
        resolve();
      });
      return promise;
    }).then(() => {
      var promise = new Promise((resolve,reject) => {
        for(var i = 0; i < keyWords.length; i++){
          i + 1 === keyWords.length ? keyWordsForQuery += keyWords[i] + '%' : keyWordsForQuery += keyWords[i] + '%" AND `text` LIKE "%';
        }
        resolve(keyWordsForQuery);
      });
      return promise;
    }).then((keyWordsForQuery) => {
      var promise = new Promise((resolve,reject) => {
        var selectBookmarksByTexts = 'SELECT `bookmark_id` FROM `texts` WHERE `text` LIKE "' + keyWordsForQuery + '"';
        connection.query(selectBookmarksByTexts).then((result) => {
          var hitBookmarks = result[0];
          resolve(hitBookmarks);
        })
      })
      return promise;
    }).then((hitBookmarks) => {
      var hitBookmarks = hitBookmarks;
      var promise = new Promise((resolve,reject) => {
        var idsForQuery = '';
        for(var i = 0; i < hitBookmarks.length; i++){
          i + 1 === hitBookmarks.length ? idsForQuery += hitBookmarks[i].bookmark_id : idsForQuery += hitBookmarks[i].bookmark_id + ' OR `bookmark_id` = ';
        }
        resolve(idsForQuery);
      });
      return promise;
    }).then((idsForQuery) => {
      var promise = new Promise((resolve,reject) => {
        var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ' + idsForQuery + '';
        connection.query(selectSearchedBookmarks).then((result) => {
          console.log(selectSearchedBookmarks);
          var searchedBookmarks = result[0];
          resolve(searchedBookmarks)
        });
      });
      return promise;
    }).then((searchedBookmarks) => {
      var searchedBookmarks = searchedBookmarks;
      var promise = new Promise((resolve,reject) => {
        var dropTable = 'DROP TABLE `texts`';
        connection.query(dropTable).then(() => {
          resolve(searchedBookmarks);
        })
      })
      return promise;
    }).then((searchedBookmarks) => {
      res.render('organizationPage.ejs',{
        orgName : orgName,
        orgIntroduction : orgIntroduction,
        orgThumbnail : orgThumbnail,
        isAdmin : isAdmin,
        searchedBookmarks : searchedBookmarks
      });
    });
  }
});
module.exports = router;
