var express = require('express');

var router = express.Router();
var client = require('cheerio-httpcli');
// var connection = require('../mysqlConnection');
var connection = require('mysql-promise')();

connection.configure({
  host : 'localhost',
  user : 'root',
  database : 'phh_social_bookmark_proto',
});
var isAdmin;
var bookmarkData;
var ownBookmarkIds;
var orgName;
var orgIntroduction;
var orgThumbnail;

router.get('/',(req,res) => {
  var myId = req.session.user_id;
  var orgId = req.session.org_id;
  var checkMembership = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `org_id` = ?';
  var selectOwnBookmarkIds = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND `org_id` = ?';
  (() => {
    var promise = new Promise((resolve) => {
      connection.query(checkMembership,[myId,orgId]).then((result) => {
        isAdmin = result[0][0].is_admin === 1;
        resolve();
      });
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      connection.query(specifyOrg,[orgId]).then((result) => {
        orgName = result[0][0].name;
        orgIntroduction = result[0][0].introduction;
        orgThumbnail = result[0][0].image_path;
        resolve();
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      connection.query(selectBookmarkData,[orgId]).then((result) => {
        bookmarkData = result[0];
        resolve();
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      connection.query(selectOwnBookmarkIds,[myId,orgId]).then((result) => {
        ownBookmarkIds = result[0];
        resolve();
      });
    });
    return promise;
  }).then(() => {
    res.render('organizationPage.ejs',{
      orgName,
      orgIntroduction,
      orgThumbnail,
      bookmarkData,
      ownBookmarkIds,
      isAdmin,
    });
  });
});

router.post('/submitUrl',(req,res) => {
  var url = req.body.result;
  client.fetch(url).then((result) => {
    res.render('organizationPage.ejs',{
      bookmarkData,
      ownBookmarkIds,
      isAdmin,
      orgName,
      orgIntroduction,
      orgThumbnail,
      url,
      title : result.$('title').text(),
    });
  });
});

router.post('/',(req,res) => {
  var url = req.body.url;
  var title = req.body.title;
  var description = req.body.description;
  var orgId = req.session.org_id;
  var userId = req.session.user_id;
  var query = 'INSERT INTO `bookmarks` (`user_id`,`org_id`,`title`,`url`,`description`) VALUES(?,?,?,?,?)';
  connection.query(query,[userId,orgId,title,url,description]).then(() => {
    res.redirect('/PHH_Bookmark/organizationPage');
  });
});

router.post('/toOrgBookmarkEdit',(req,res) => {
  var bookmarkId = req.body.result;
  if(req.session.edit_org_bookmark_id){
    delete req.session.edit_org_bookmark_id;
  }
  req.session.edit_org_bookmark_id = bookmarkId;
  res.redirect('/PHH_Bookmark/orgBookmarkEdit');
});

router.post('/searchBookmark',(req,res) => {
  var orgId = req.session.org_id;
  var keyWord = req.body.keyWord;
  var searchFromTitle = req.body.searchFromTitle;
  var searchFromDescription = req.body.searchFromDescription;
  // var searchFromComments = req.body.searchFromComments;
  var searchFromTextsOnSites = req.body.searchFromTextsOnSites;
  // add regular express for key word
  // var keyWords = keyWord.split(' ');
  var splitKeyWord = /[\S]+/g;
  var keyWords = keyWord.match(splitKeyWord);
  var keyWordsForQuery;
  if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === undefined){
    keyWordsForQuery = '%';
    for(var i = 0; i < keyWords.length; i++){
      if(i + 1 === keyWords.length){
        keyWordsForQuery += keyWords[i] + '%';
        var selectBookmarksByTitle = 'SELECT * FROM `bookmarks` WHERE `title` LIKE "' + keyWordsForQuery + '" AND `org_id` = ?';
        connection.query(selectBookmarksByTitle,[orgId]).then((result) => {
          var searchedBookmarks = result[0];
          res.render('organizationPage.ejs',{
            orgName,
            orgIntroduction,
            orgThumbnail,
            isAdmin,
            searchedBookmarks,
          });
        });
      }else{
        keyWordsForQuery += keyWords[i] + '%" AND `title` LIKE "%';
      }
    }
  }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
    keyWordsForQuery = '%';
    for(var i = 0; i < keyWords.length; i++){
      if(i + 1 === keyWords.length){
        keyWordsForQuery += keyWords[i] + '%';
        var selectBookmarksByDescription = 'SELECT * FROM `bookmarks` WHERE `description` LIKE "' + keyWordsForQuery + '" AND `org_id` = ?';
        connection.query(selectBookmarksByDescription,[orgId]).then((result) => {
          var searchedBookmarks = result[0];
          res.render('organizationPage.ejs',{
            orgName,
            orgIntroduction,
            orgThumbnail,
            isAdmin,
            searchedBookmarks,
          });
        });
      }else{
        keyWordsForQuery += keyWords[i] + '%" AND `description` LIKE "%';
      }
    }
  }else if(searchFromTitle === undefined && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
    keyWordsForQuery = '%';
    var selectThisOrgBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ?';
    var createTextsTable = 'CREATE TABLE `texts` (`bookmark_id` int not null , `text` TEXT )';
    (() => {
      var promise = new Promise((resolve) => {
        connection.query(createTextsTable).then(() => {
          resolve();
        });
      });
      return promise;
    })().then(() => {
      var promise = new Promise((resolve) => {
        connection.query(selectThisOrgBookmarks,[orgId]).then((result) => {
          var bookmarksLength = result[0].length;
          var thisOrgBookmarks = result[0];
          var values = {
            bookmarksLength,
            thisOrgBookmarks,
          };
          resolve(values);
        });
      });
      return promise;
    }).then((values) => {
      var bookmarksLength = values.bookmarksLength;
      var thisOrgBookmarks = values.thisOrgBookmarks;
      var promise = new Promise((resolve) => {
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
              values = {
                ids,
                bodies,
              };
              resolve(values);
            }
          });
        }
      });
      return promise;
    }).then((values) => {
      var ids = values.ids;
      var bodies = values.bodies;
      var promise = new Promise((resolve) => {
        console.log(ids);
        var insertBodies = 'INSERT INTO `texts` (`bookmark_id`, `text`) VALUES (?, ?)';
        for(var i = 0; i < ids.length; i++){
          connection.query(insertBodies,[ids[i],bodies[i]]);
        }
        resolve();
      });
      return promise;
    }).then(() => {
      var promise = new Promise((resolve) => {
        for(var i = 0; i < keyWords.length; i++){
          i + 1 === keyWords.length ? keyWordsForQuery += keyWords[i] + '%' : keyWordsForQuery += keyWords[i] + '%" AND `text` LIKE "%';
        }
        resolve(keyWordsForQuery);
      });
      return promise;
    }).then((keyWordsForQuery) => {
      var promise = new Promise((resolve) => {
        var selectBookmarksByTexts = 'SELECT `bookmark_id` FROM `texts` WHERE `text` LIKE "' + keyWordsForQuery + '"';
        connection.query(selectBookmarksByTexts).then((result) => {
          var hitBookmarks = result[0];
          resolve(hitBookmarks);
        });
      });
      return promise;
    }).then((hitBookmarks) => {
      var hitBookmarks = hitBookmarks;
      var promise = new Promise((resolve) => {
        var idsForQuery = '';
        for(var i = 0; i < hitBookmarks.length; i++){
          i + 1 === hitBookmarks.length ? idsForQuery += hitBookmarks[i].bookmark_id : idsForQuery += hitBookmarks[i].bookmark_id + ' OR `bookmark_id` = ';
        }
        resolve(idsForQuery);
      });
      return promise;
    }).then((idsForQuery) => {
      var promise = new Promise((resolve) => {
        var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `bookmark_id` = ' + idsForQuery + '';
        connection.query(selectSearchedBookmarks).then((result) => {
          console.log(selectSearchedBookmarks);
          var searchedBookmarks = result[0];
          resolve(searchedBookmarks);
        });
      });
      return promise;
    }).then((searchedBookmarks) => {
      var searchedBookmarks = searchedBookmarks;
      var promise = new Promise((resolve) => {
        var dropTable = 'DROP TABLE `texts`';
        connection.query(dropTable).then(() => {
          resolve(searchedBookmarks);
        });
      });
      return promise;
    }).then((searchedBookmarks) => {
      res.render('organizationPage.ejs',{
        orgName,
        orgIntroduction,
        orgThumbnail,
        isAdmin,
        searchedBookmarks,
      });
    });
  }else if(searchFromTitle === 'on' && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
    (() => {
      var promise = new Promise((resolve) => {
        var keyWordsForQueryByTitle = '`title` LIKE "%';
        for(var i = 0; i < keyWords.length; i++){
          i + 1 === keyWords.length ? keyWordsForQueryByTitle += keyWords[i] + '%' : keyWordsForQueryByTitle += keyWords[i] + '%" AND `title` LIKE "%';
        }
        resolve(keyWordsForQueryByTitle);
      });
      return promise;
    })().then((keyWordsForQueryByTitle) => {
      var keyWordsForQueryByTitle = keyWordsForQueryByTitle;
      var promise = new Promise((resolve) => {
        var keyWordsForQueryByDescription = '`description` LIKE "%';
        for(var i = 0; i < keyWords.length; i++){
          i + 1 === keyWords.length ? keyWordsForQueryByDescription += keyWords[i] + '%' : keyWordsForQueryByDescription += keyWords[i] + '%" AND `description` LIKE "%';
        }
        var values = {
          keyWordsForQueryByTitle,
          keyWordsForQueryByDescription,
        };
        resolve(values);
      });
      return promise;
    }).then((values) => {
      var keyWordsForQueryByTitle = values.keyWordsForQueryByTitle;
      var keyWordsForQueryByDescription = values.keyWordsForQueryByDescription;
      var selectBookmarksByTitleAndDescription = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND ((' + keyWordsForQueryByTitle + '") OR (' + keyWordsForQueryByDescription + '"))';
      var promise = new Promise((resolve) => {
        connection.query(selectBookmarksByTitleAndDescription,[orgId]).then((result) => {
          var searchedBookmarks = result[0];
          resolve(searchedBookmarks);
        });
      });
      return promise;
    }).then((searchedBookmarks) => {
      res.render('organizationPage.ejs',{
        orgName,
        orgIntroduction,
        orgThumbnail,
        isAdmin,
        searchedBookmarks,
      });
    });
  }else if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
    (() => {
      var promise = new Promise((resolve) => {
        var keyWordsForQuery = '%';
        for(var i = 0; i < keyWords.length; i++){
          i + 1 === keyWords.length ? keyWordsForQuery += keyWords[i] + '%' : keyWordsForQuery += keyWords[i] + '%" AND `title` LIKE "%';
        }
        resolve(keyWordsForQuery);
      });
      return promise;
    })().then((keyWordsForQuery) => {
      var keyWordsForQuery = keyWordsForQuery;
      var promise = new Promise((resolve) => {
        var selectBookmarksByTitle = 'SELECT `bookmark_id` FROM `bookmarks` WHERE `title` LIKE "' + keyWordsForQuery + '" AND `org_id` = ?';
        connection.query(selectBookmarksByTitle,[orgId]).then((result) => {
          var searchedByTitleBookmarkIds = result[0];
          resolve(searchedByTitleBookmarkIds);
        });
      });
      return promise;
    }).then((searchedByTitleBookmarkIds) => {
      var searchedByTitleBookmarkIds = searchedByTitleBookmarkIds;
      var promise = new Promise((resolve) => {
        var createTextsTable = 'CREATE TABLE `texts` (`id` int not null auto_increment, `bookmark_id` int, `text` TEXT ,primary key (`id`))';
        connection.query(createTextsTable).then(() => {
          resolve(searchedByTitleBookmarkIds);
        });
      });
      return promise;
    }).then((searchedByTitleBookmarkIds) => {
      var searchedByTitleBookmarkIds = searchedByTitleBookmarkIds;
      var idsForSelect = [];
      var promise = new Promise((resolve) => {
        for(var i = 0; i < searchedByTitleBookmarkIds.length; i++){
          idsForSelect.push(searchedByTitleBookmarkIds[i].bookmark_id);
        }
        resolve(idsForSelect);
      });
      return promise;
    }).then((idsForSelect) => {
      var idsForSelect = idsForSelect;
      var promise = new Promise((resolve) => {
        var selectThisOrgBookmarkIds = 'SELECT `bookmark_id` FROM `bookmarks` WHERE `org_id` = ? AND `bookmark_id` NOT IN (?)';
        connection.query(selectThisOrgBookmarkIds,[orgId,idsForSelect]).then((result) => {
          var selectedBookmarkIds = result[0];
          var values = {
            idsFromTitle : idsForSelect,
            selectedBookmarkIds,
          };
          resolve(values);
        },() => {
          var selectedThisOrgBookmarkIds = 'SELECT `bookmark_id` FROM `bookmarks` WHERE `org_id` = ?';
          connection.query(selectedThisOrgBookmarkIds,[orgId]).then((result) => {
            var selectedBookmarkIds = result[0];
            var values = {
              idsFromTitle : idsForSelect,
              selectedBookmarkIds,
            };
            resolve(values);
          });
        });
      });
      return promise;
    }).then((values) => {
      var selectedBookmarkIds = values.selectedBookmarkIds;
      var idsFromTitle = values.idsFromTitle;
      var promise = new Promise((resolve) => {
        var idsFromOther = [];
        for(var i = 0; i < selectedBookmarkIds.length; i++){
          idsFromOther.push(selectedBookmarkIds[i].bookmark_id);
        }
        var values = {
          idsFromTitle,
          idsFromOther,
        };
        resolve(values);
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var idsFromOther = values.idsFromOther;
      var promise = new Promise((resolve) => {
        for(var i = 0; i < idsFromOther.length; i++){
          var insertIds = 'INSERT INTO `texts` (`bookmark_id`) VALUES(null)';
          (() => {
            var a = i;
            connection.query(insertIds).then(() => {
              if(a + 1 === idsFromOther.length){
                values = {
                  idsFromOther,
                  idsFromTitle,
                };
                resolve(values);
              }
            });
          })();
        }
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var idsFromOther = values.idsFromOther;
      var promise = new Promise((resolve) => {
        var insertIds = 'UPDATE `texts` SET `bookmark_id` = ? WHERE `id` = ?';
        for(var i = 0; i < idsFromOther.length; i++){
          (() => {
            var a = i;
            connection.query(insertIds,[idsFromOther[a],a+1]);
            if(a + 1 === idsFromOther.length){
              var values = {
                idsFromOther,
                idsFromTitle,
              };
              resolve(values);
            }
          })();
        }
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var idsFromOther = values.idsFromOther;
      var promise = new Promise((resolve) => {
        var queryForGettingUrl = '';
        for(var i = 0; i < idsFromOther.length; i++){
          i + 1 === idsFromOther.length ? queryForGettingUrl += idsFromOther[i] : queryForGettingUrl += idsFromOther[i] + ' OR `bookmark_id` = ';
        }
        values = {
          idsFromTitle,
          idsFromOther,
          queryForGettingUrl,
        };
        resolve(values);
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var idsFromOther = values.idsFromOther;
      var queryForGettingUrl = values.queryForGettingUrl;
      var promise = new Promise((resolve) => {
        var selectUrl = 'SELECT `url` FROM `bookmarks` WHERE (`bookmark_id` = ' + queryForGettingUrl + ') AND `org_id` = ?';
        connection.query(selectUrl,[orgId]).then((result) => {
          var selectedUrls = result[0];
          values = {
            idsFromTitle,
            idsFromOther,
            selectedUrls,
          };
          resolve(values);
        });
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var idsFromOther = values.idsFromOther;
      var selectedUrls = values.selectedUrls;
      var promise = new Promise((resolve) => {
        var bodies = [];
        var interval;
        var i = 0;
        interval = setInterval(() => {
          (() => {
            var a = i;
            console.log('fetch前' + a);
            client.fetch(selectedUrls[a].url).then((result) => {
              console.log(selectedUrls);
              bodies.push(result.$('body').text().replace(/\s/g,''));
              console.log('waiting....');
              console.log('fetch後' + a);
              if(a + 1 === selectedUrls.length){
                clearInterval(interval);
                values = {
                  idsFromTitle,
                  idsFromOther,
                  bodies,
                };
                resolve(values);
              }
            });
          })();
          i++;
        },3000);
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var idsFromOther = values.idsFromOther;
      var bodies = values.bodies;
      var promise = new Promise((resolve) => {
        var updateTexts = 'UPDATE `texts` SET `text` = ? WHERE `id` = ? AND `bookmark_id` = ?';
        for(var i = 0; i < bodies.length; i++){
          (() => {
            var a = i;
            connection.query(updateTexts,[bodies[a], a + 1, idsFromOther[a]]).then(() => {
              if(a + 1 === bodies.length){
                resolve(idsFromTitle);
              }
            });
          })();
        }
      });
      return promise;
    }).then((idsFromTitle) => {
      var idsFromTitle = idsFromTitle;
      var promise = new Promise((resolve) => {
        var keyWordsForQuery = '%';
        for(var i = 0; i < keyWords.length; i++){
          i + 1 === keyWords.length ? keyWordsForQuery += keyWords[i] : keyWordsForQuery += keyWords[i] + '%" AND `text` LIKE "%'
        }
        var values = {
          idsFromTitle,
          keyWordsForQuery,
        };
        resolve(values);
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var keyWordsForQuery = values.keyWordsForQuery;
      var promise = new Promise((resolve) => {
        var selectIdsFromText = 'SELECT `bookmark_id` FROM `texts` WHERE `text` LIKE "' + keyWordsForQuery + '%"';
        connection.query(selectIdsFromText).then((result) => {
          var selectedIdsFromText = result[0];
          values = {
            idsFromTitle,
            selectedIdsFromText,
          };
          resolve(values);
        });
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var selectedIdsFromText = values.selectedIdsFromText;
      var promise = new Promise((resolve) => {
        var idsFromText = [];
        for(var i = 0; i < selectedIdsFromText.length; i++){
          idsFromText.push(selectedIdsFromText[i].bookmark_id);
        }
        values = {
          idsFromText,
          idsFromTitle,
        };
        resolve(values);
      });
      return promise;
    }).then((values) => {
      var idsFromTitle = values.idsFromTitle;
      var idsFromText = values.idsFromText;
      var promise = new Promise((resolve) => {
        var searchedIds = idsFromTitle.concat(idsFromText);
        resolve(searchedIds);
      });
      return promise;
    }).then((searchedIds) => {
      var searchedIds = searchedIds;
      var promise = new Promise((resolve) => {
        var idsForQuery = '';
        if(searchedIds.length > 0){
          for(var i = 0; i < searchedIds.length; i++){
            i + 1 === searchedIds.length ? idsForQuery += searchedIds[i] : idsForQuery += searchedIds[i] + ') OR (`bookmark_id` = ';
          }
        }
        resolve(idsForQuery);
      });
      return promise;
    }).then((idsForQuery) => {
      var idsForQuery = idsForQuery;
      var promise = new Promise((resolve) => {
        var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND ((`bookmark_id` = ' + idsForQuery + '))';
        connection.query(selectSearchedBookmarks,[orgId]).then((result) => {
          var searchedBookmarks = result[0];
          resolve(searchedBookmarks);
        },() => {
          resolve([]);
        });
      });
      return promise;
    }).then((searchedBookmarks) => {
      var searchedBookmarks = searchedBookmarks;
      var promise = new Promise((resolve) => {
        var dropTable = 'DROP TABLE `texts`';
        connection.query(dropTable).then(() => {
          resolve(searchedBookmarks);
        });
      });
      return promise;
    }).then((searchedBookmarks) => {
      res.render('organizationPage.ejs',{
        orgName,
        orgIntroduction,
        orgThumbnail,
        isAdmin,
        searchedBookmarks,
      });
    });
  }
});
module.exports = router;
