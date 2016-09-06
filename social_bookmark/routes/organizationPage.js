'use strict';
var express = require('express');

var router = express.Router();
var client = require('cheerio-httpcli');
var connection = require('../mysqlConnection');

var isAdmin;
var allBookmarkData;
var ownBookmarkIds;
var orgName;
var orgIntroduction;
var orgThumbnail;
var slicedAddedUserNickNames;
var slicedAddedUserNickNamesForSearched;
var index;
var allSearchedBookmarkData;
var searchIndex;

router.post('/submitOrgId', (req, res) => {
  var orgId = req.body.result;
  if(req.session.org_id){
    delete req.session.org_id;
  }
  req.session.org_id = orgId;
  res.redirect('/PHH_Bookmark/organizationPage');
});

router.param('index', (req, res, next, value) => {
  index = value;
  next();
});

router.param('searchIndex', (req, res, next, value) => {
  searchIndex = value;
  next();
});

router.get('/', (req, res) => {
  var myId = req.session.user_id;
  var orgId = req.session.org_id;
  var checkMembership = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `org_id` = ?';
  var selectOwnBookmarkIds = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND `org_id` = ?';
  (() => {
    var promise = new Promise((resolve) => {
      connection.query(checkMembership, [myId, orgId]).then((result) => {
        if(result[0].length > 0){
          isAdmin = result[0][0].is_admin === 1;
          resolve();
        }else{
          res.redirect('/PHH_Bookmark/topPage');
        }
      });
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      connection.query(specifyOrg, [orgId]).then((result) => {
        orgName = result[0][0].name;
        orgIntroduction = result[0][0].introduction;
        orgThumbnail = result[0][0].image_path;
        resolve();
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      connection.query(selectBookmarkData, [orgId]).then((result) => {
        var bookmarkData = result[0];
        resolve(bookmarkData);
      });
    });
    return promise;
  }).then((bookmarkData) => {
    var promise = new Promise((resolve) => {
      var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
      if(bookmarkData.length > 0){
        var addedUserNickNames = [];
        bookmarkData.forEach((currentValue, _index, array) => {
          connection.query(selectNickName, [currentValue.user_id]).then((result) => {
            addedUserNickNames.push(result[0][0].nick_name);
            if(array.length === addedUserNickNames.length){
              var n = 12;
              allBookmarkData = [];
              for (let i = 0; i < bookmarkData.length; i += n) {
                allBookmarkData.push(bookmarkData.slice(i, i + n));
              }
              slicedAddedUserNickNames = [];
              for (var i = 0; i < addedUserNickNames.length; i += n) {
                slicedAddedUserNickNames.push(addedUserNickNames.slice(i, i + n));
              }
              resolve();
            }
          });
        });
      }else{
        allBookmarkData = [[]];
        resolve();
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      connection.query(selectOwnBookmarkIds, [myId, orgId]).then((result) => {
        ownBookmarkIds = result[0];
        resolve();
      });
    });
    return promise;
  }).then(() => {
    res.redirect('/PHH_Bookmark/organizationPage/bookmarkList/1/searchBookmarkList/0');
  });
});

router.get('/bookmarkList/:index/searchBookmarkList/:searchIndex', (req, res) => {
  var pageLength = allBookmarkData.length;
  var bookmarkData;
  var addedUserNickNames;
  index = parseInt(index, 10);
  searchIndex = parseInt(searchIndex, 10);
  if(allBookmarkData[0].length === 0){
    bookmarkData = [];
  }else{
    bookmarkData = allBookmarkData[index - 1];
    addedUserNickNames = slicedAddedUserNickNames[index - 1];
  }
  if(searchIndex === 0){
    if(pageLength >= index && index > 0){
      res.render('organizationPage.ejs', {
        bookmarkData,
        orgName,
        orgIntroduction,
        orgThumbnail,
        ownBookmarkIds,
        isAdmin,
        addedUserNickNames,
        pageLength,
        index,
        searchIndex,
      });
    }else{
      res.redirect('/PHH_Bookmark/myPage/bookmarkList/1/searchBookmarkList/0');
    }
  }else{
    var addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
    var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
    var searchPageLength = allSearchedBookmarkData.length;
    res.render('organizationPage.ejs', {
      bookmarkData,
      searchedBookmarkData,
      orgName,
      orgIntroduction,
      orgThumbnail,
      ownBookmarkIds,
      isAdmin,
      addedUserNickNames,
      addedUserNickNamesForSearched,
      pageLength,
      index,
      searchIndex,
      searchPageLength,
    });
  }
});

router.post('/bookmarkList/:index/submitUrl', (req, res) => {
  var url = req.body.result;
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  var pageLength = allBookmarkData.length;
  var bookmarkData;
  var addedUserNickNames;
  index = parseInt(index, 10);
  searchIndex = 0;
  if(allBookmarkData[0].length === 0){
    bookmarkData = [];
  }else{
    bookmarkData = allBookmarkData[index - 1];
    addedUserNickNames = slicedAddedUserNickNames[index - 1];
  }
  (() => {
    var promise = new Promise((resolve) => {
      if(pageLength >= index && index > 0){
        resolve();
      }else{
        res.redirect('/PHH_Bookmark/organizationPage/bookmarkList/1');
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(checkUrl.test(url)){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          addedUserNickNames,
          pageLength,
          index,
          searchIndex,
          urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください',
        });
      }
    });
    return promise;
  }).then(() => {
    client.fetch(url).then((result) => {
      res.render('organizationPage.ejs', {
        bookmarkData,
        ownBookmarkIds,
        isAdmin,
        orgName,
        orgIntroduction,
        orgThumbnail,
        url,
        addedUserNickNames,
        pageLength,
        index,
        searchIndex,
        title : result.$('title').text(),
      });
    }, () => {
      res.render('organizationPage.ejs', {
        orgName,
        orgIntroduction,
        orgThumbnail,
        bookmarkData,
        ownBookmarkIds,
        isAdmin,
        addedUserNickNames,
        pageLength,
        index,
        searchIndex,
        networkNotice : 'URLが正しいかをご確認の上、ネットワーク接続をお確かめください。',
      });
    });
  });
});

router.post('/bookmarkList/:index', (req, res) => {
  var url = req.body.url;
  var title = req.body.title;
  var description = req.body.description;
  var orgId = req.session.org_id;
  var userId = req.session.user_id;
  var pageLength = allBookmarkData.length;
  var bookmarkData;
  var addedUserNickNames;
  index = parseInt(index, 10);
  if(allBookmarkData[0].length === 0){
    bookmarkData = [];
  }else{
    bookmarkData = allBookmarkData[index - 1];
    addedUserNickNames = slicedAddedUserNickNames[index - 1];
  }
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  (() => {
    var promise = new Promise((resolve) => {
      if(checkUrl.test(url)){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          url,
          title,
          description,
          addedUserNickNames,
          pageLength,
          index,
          urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください',
        });
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(checkSpace.test(title)){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          url,
          title,
          description,
          addedUserNickNames,
          pageLength,
          index,
          titleNotice : 'タイトルを入力してください',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(title)){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          url,
          title,
          description,
          addedUserNickNames,
          pageLength,
          index,
          titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(description)){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          url,
          title,
          description,
          addedUserNickNames,
          pageLength,
          index,
          descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(title.length <= 32){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          url,
          title,
          description,
          addedUserNickNames,
          pageLength,
          index,
          titleNotice : 'タイトルは32文字以下です',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(description.length <= 128){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          url,
          title,
          description,
          addedUserNickNames,
          pageLength,
          index,
          descriptionNotice : '説明文は128文字以下です',
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      client.fetch(url).then((result) => {
        var text = result.$('body').text().replace(/\s/g, '');
        resolve(text);
      }, () => {
        res.render('organizationPage.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          bookmarkData,
          ownBookmarkIds,
          isAdmin,
          addedUserNickNames,
          pageLength,
          index,
          networkNotice : 'URLが正しいかをご確認の上、ネットワーク接続をお確かめください。',
        });
      });
    });
    return promise;
  }).then((value) => {
    var text = value;
    var query = 'INSERT INTO `bookmarks` (`user_id`, `org_id`, `title`, `url`, `description`, `text`) VALUES(?, ?, ?, ?, ?, ?)';
    connection.query(query, [userId, orgId, title, url, description, text]).then(() => {
      res.redirect('/PHH_Bookmark/organizationPage');
    });
  });
});

router.post('/toOrgBookmarkEdit', (req, res) => {
  var bookmarkId = req.body.result;
  if(req.session.edit_org_bookmark_id){
    delete req.session.edit_org_bookmark_id;
  }
  req.session.edit_org_bookmark_id = bookmarkId;
  res.redirect('/PHH_Bookmark/orgBookmarkEdit');
});

router.post('/bookmarkList/:index/searchBookmarkList/:searchIndex', (req, res) => {
  var orgId = req.session.org_id;
  var keyWord = req.body.keyWord;
  var searchFromTitle = req.body.searchFromTitle;
  var searchFromDescription = req.body.searchFromDescription;
  var searchFromTextsOnSites = req.body.searchFromTextsOnSites;
  var pageLength = allBookmarkData.length;
  var bookmarkData;
  var addedUserNickNames;
  index = parseInt(index, 10);
  searchIndex = parseInt(searchIndex, 10);
  if(allBookmarkData[0].length === 0){
    bookmarkData = [];
  }else{
    bookmarkData = allBookmarkData[index - 1];
    addedUserNickNames = slicedAddedUserNickNames[index - 1];
  }
  var checkInjection = /[%;+-]+/g;
  var splitKeyWord = /[\S]+/g;
  var checkSpace = /[\S]+/g;
  var keyWords = keyWord.match(splitKeyWord);
  var keyWordsForQuery;
  var addedUserNickNamesForSearched = [];
  (() => {
    var promise = new Promise((resolve) => {
      if(checkSpace.test(keyWord)){
        resolve();
      }else{
        res.redirect('/PHH_Bookmark/organizationPage');
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(keyWord)){
        resolve();
      }else{
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          addedUserNickNames,
          pageLength,
          index,
          keyWordNotice : 'セキュリティ上の観点から「+, -, %, ;」を含んでの検索はできません',
        });
      }
    });
    return promise;
  }).then(() => {
    if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === undefined){
      (() => {
        var promise = new Promise((resolve) => {
          keyWordsForQuery = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQuery += currentValue;
              resolve(keyWordsForQuery);
            }else{
              keyWordsForQuery += currentValue + '%" AND `title` LIKE "%';
            }
          });
        });
        return promise;
      })().then((value) => {
        keyWordsForQuery = value;
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND ( `title` LIKE "' + keyWordsForQuery + '%" )';
          connection.query(selectSearchedBookmarks, [orgId]).then((result) => {
            var searchedBookmarkData = result[0];
            resolve(searchedBookmarkData);
          });
        });
        return promise;
      }).then((searchedBookmarkData) => {
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
          if(searchedBookmarkData.length > 0){
            searchedBookmarkData.forEach((currentValue) => {
              connection.query(selectNickName, [currentValue.user_id]).then((result) => {
                addedUserNickNamesForSearched.push(result[0][0].nick_name);
                if(searchedBookmarkData.length === addedUserNickNamesForSearched.length){
                  var n = 12;
                  allSearchedBookmarkData = [];
                  for (let i = 0; i < searchedBookmarkData.length; i += n) {
                    allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
                  }
                  slicedAddedUserNickNamesForSearched = [];
                  for (let i = 0; i < addedUserNickNamesForSearched.length; i += n) {
                    slicedAddedUserNickNamesForSearched.push(addedUserNickNamesForSearched.slice(i, i + n));
                  }
                  resolve();
                }
              });
            });
          }else{
            allSearchedBookmarkData = [[]];
            slicedAddedUserNickNamesForSearched = [[]];
            resolve();
          }
        });
        return promise;
      }).then(() => {
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        var searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          searchedBookmarkData,
          addedUserNickNames,
          addedUserNickNamesForSearched,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
      (() => {
        var promise = new Promise((resolve) => {
          keyWordsForQuery = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQuery += currentValue;
              resolve(keyWordsForQuery);
            }else{
              keyWordsForQuery += currentValue + '%" AND `description` LIKE "%';
            }
          });
        });
        return promise;
      })().then((value) => {
        keyWordsForQuery = value;
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND ( `description` LIKE "' + keyWordsForQuery + '%" )';
          connection.query(selectSearchedBookmarks, [orgId]).then((result) => {
            var searchedBookmarkData = result[0];
            resolve(searchedBookmarkData);
          });
        });
        return promise;
      }).then((searchedBookmarkData) => {
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
          if(searchedBookmarkData.length > 0){
            searchedBookmarkData.forEach((currentValue) => {
              connection.query(selectNickName, [currentValue.user_id]).then((result) => {
                addedUserNickNamesForSearched.push(result[0][0].nick_name);
                if(searchedBookmarkData.length === addedUserNickNamesForSearched.length){
                  var n = 12;
                  allSearchedBookmarkData = [];
                  for (let i = 0; i < searchedBookmarkData.length; i += n) {
                    allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
                  }
                  slicedAddedUserNickNamesForSearched = [];
                  for (let i = 0; i < addedUserNickNamesForSearched.length; i += n) {
                    slicedAddedUserNickNamesForSearched.push(addedUserNickNamesForSearched.slice(i, i + n));
                  }
                  resolve();
                }
              });
            });
          }else{
            allSearchedBookmarkData = [[]];
            slicedAddedUserNickNamesForSearched = [[]];
            resolve();
          }
        });
        return promise;
      }).then(() => {
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        var searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          searchedBookmarkData,
          addedUserNickNames,
          addedUserNickNamesForSearched,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }else if(searchFromTitle === undefined && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
      keyWordsForQuery = '%';
      (() => { // create table for inserting text of the site and select searchedBookmarkData.
        var promise = new Promise((resolve) => {
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQuery += currentValue;
              resolve(keyWordsForQuery);
            }else{
              keyWordsForQuery += currentValue + '%" AND `text` LIKE "%';
            }
          });
        });
        return promise;
      })().then((value) => { // select this org bookmarks to insert `texts` table only bookmarks that is this orgs'
        keyWordsForQuery = value;
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND ( `text` LIKE "' + keyWordsForQuery + '%")';
          connection.query(selectSearchedBookmarks, [orgId]).then((result) => {
            var searchedBookmarkData = result[0];
            resolve(searchedBookmarkData);
          });
        });
        return promise;
      }).then((searchedBookmarkData) => {
        var promise = new Promise((resolve) => {
          if(searchedBookmarkData.length > 0){
            var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
            searchedBookmarkData.forEach((currentValue) => {
              connection.query(selectNickName, [currentValue.user_id]).then((result) => {
                addedUserNickNamesForSearched.push(result[0][0].nick_name);
                if(searchedBookmarkData.length === addedUserNickNamesForSearched.length){
                  var n = 12;
                  allSearchedBookmarkData = [];
                  for (let i = 0; i < searchedBookmarkData.length; i += n) {
                    allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
                  }
                  slicedAddedUserNickNamesForSearched = [];
                  for (let i = 0; i < addedUserNickNamesForSearched.length; i += n) {
                    slicedAddedUserNickNamesForSearched.push(addedUserNickNamesForSearched.slice(i, i + n));
                  }
                  resolve();
                }
              });
            });
          }else{
            allSearchedBookmarkData = [[]];
            slicedAddedUserNickNamesForSearched = [[]];
            resolve();
          }
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          searchedBookmarkData,
          addedUserNickNames,
          addedUserNickNamesForSearched,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
      (() => {
        var promise = new Promise((resolve) => {
          var keyWordsForQueryByTitle = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryByTitle += currentValue;
              resolve(keyWordsForQueryByTitle);
            }else{
              keyWordsForQueryByTitle += currentValue + '%" AND `title` LIKE "%';
            }
          });
        });
        return promise;
      })().then((value) => {
        var keyWordsForQueryByTitle = value;
        var promise = new Promise((resolve) => {
          var keyWordsForQueryByDescription = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryByDescription += currentValue;
              var values = {
                keyWordsForQueryByDescription,
                keyWordsForQueryByTitle,
              };
              resolve(values);
            }else{
              keyWordsForQueryByDescription += currentValue + '%" AND `description` LIKE "%';
            }
          });
        });
        return promise;
      }).then((values) => {
        var keyWordsForQueryByTitle = values.keyWordsForQueryByTitle;
        var keyWordsForQueryByDescription = values.keyWordsForQueryByDescription;
        var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND (( `title` LIKE "' + keyWordsForQueryByTitle + '%" ) OR ( `description` LIKE "' + keyWordsForQueryByDescription + '%"))';
        var promise = new Promise((resolve) => {
          connection.query(selectSearchedBookmarks, [orgId]).then((result) => {
            var searchedBookmarkData = result[0];
            resolve(searchedBookmarkData);
          });
        });
        return promise;
      }).then((searchedBookmarkData) => {
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
          if(searchedBookmarkData.length > 0){
            searchedBookmarkData.forEach((currentValue) => {
              connection.query(selectNickName, [currentValue.user_id]).then((result) => {
                addedUserNickNamesForSearched.push(result[0][0].nick_name);
                if(searchedBookmarkData.length === addedUserNickNamesForSearched.length){
                  var n = 12;
                  allSearchedBookmarkData = [];
                  for (let i = 0; i < searchedBookmarkData.length; i += n) {
                    allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
                  }
                  slicedAddedUserNickNamesForSearched = [];
                  for (let i = 0; i < addedUserNickNamesForSearched.length; i += n) {
                    slicedAddedUserNickNamesForSearched.push(addedUserNickNamesForSearched.slice(i, i + n));
                  }
                  resolve();
                }
              });
            });
          }else{
            allSearchedBookmarkData = [[]];
            slicedAddedUserNickNamesForSearched = [[]];
            resolve();
          }
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          searchedBookmarkData,
          addedUserNickNames,
          addedUserNickNamesForSearched,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
      (() => {
        var promise = new Promise((resolve) => {
          var keyWordsForQueryWithTitle = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryWithTitle += currentValue;
              resolve(keyWordsForQueryWithTitle);
            }else{
              keyWordsForQueryWithTitle += currentValue + '%" AND `title` LIKE "%';
            }
          });
        });
        return promise;
      })().then((value) => {
        var keyWordsForQueryWithTitle = value;
        var promise = new Promise((resolve) => {
          var keyWordsForQueryWithText = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryWithText += currentValue;
              var values = {
                keyWordsForQueryWithText,
                keyWordsForQueryWithTitle,
              };
              resolve(values);
            }else{
              keyWordsForQueryWithText += currentValue + '%" AND `text` LIKE "%';
            }
          });
        });
        return promise;
      }).then((values) => {
        var keyWordsForQueryWithText = values.keyWordsForQueryWithText;
        var keyWordsForQueryWithTitle = values.keyWordsForQueryWithTitle;
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND (( `title` LIKE "' + keyWordsForQueryWithTitle + '%" ) OR ( `text` LIKE "' + keyWordsForQueryWithText + '%" ))';
          connection.query(selectSearchedBookmarks, [orgId]).then((result) => {
            var searchedBookmarkData = result[0];
            resolve(searchedBookmarkData);
          });
        });
        return promise;
      }).then((searchedBookmarkData) => {
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
          if(searchedBookmarkData.length > 0){
            searchedBookmarkData.forEach((currentValue) => {
              connection.query(selectNickName, [currentValue.user_id]).then((result) => {
                addedUserNickNamesForSearched.push(result[0][0].nick_name);
                if(searchedBookmarkData.length === addedUserNickNamesForSearched.length){
                  var n = 12;
                  allSearchedBookmarkData = [];
                  for (let i = 0; i < searchedBookmarkData.length; i += n) {
                    allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
                  }
                  slicedAddedUserNickNamesForSearched = [];
                  for (let i = 0; i < addedUserNickNamesForSearched.length; i += n) {
                    slicedAddedUserNickNamesForSearched.push(addedUserNickNamesForSearched.slice(i, i + n));
                  }
                  resolve();
                }
              });
            });
          }else{
            allSearchedBookmarkData = [[]];
            slicedAddedUserNickNamesForSearched = [[]];
            resolve();
          }
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          searchedBookmarkData,
          addedUserNickNames,
          addedUserNickNamesForSearched,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === 'on'){
      (() => {
        var promise = new Promise((resolve) => {
          var keyWordsForQueryWithDescription = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryWithDescription += currentValue;
              resolve(keyWordsForQueryWithDescription);
            }else{
              keyWordsForQueryWithDescription += currentValue + '%" AND `description` LIKE "';
            }
          });
        });
        return promise;
      })().then((value) => {
        var keyWordsForQueryWithDescription = value;
        var promise = new Promise((resolve) => {
          var keyWordsForQueryWithText = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryWithText += currentValue;
              var values = {
                keyWordsForQueryWithText,
                keyWordsForQueryWithDescription,
              };
              resolve(values);
            }else{
              keyWordsForQueryWithText += currentValue + '%" `text` LIKE "%';
            }
          });
        });
        return promise;
      }).then((values) => {
        var keyWordsForQueryWithText = values.keyWordsForQueryWithText;
        var keyWordsForQueryWithDescription = values.keyWordsForQueryWithDescription;
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND (( `description` LIKE "' + keyWordsForQueryWithDescription + '%" ) OR ( "' + keyWordsForQueryWithText + '%" ))';
          connection.query(selectSearchedBookmarks, [orgId]).then((result) => {
            var searchedBookmarkData = result[0];
            resolve(searchedBookmarkData);
          });
        });
        return promise;
      }).then((searchedBookmarkData) => {
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
          if(searchedBookmarkData.length > 0){
            searchedBookmarkData.forEach((currentValue) => {
              connection.query(selectNickName, [currentValue.user_id]).then((result) => {
                addedUserNickNamesForSearched.push(result[0][0].nick_name);
                if(searchedBookmarkData.length === addedUserNickNamesForSearched.length){
                  var n = 12;
                  allSearchedBookmarkData = [];
                  for (let i = 0; i < searchedBookmarkData.length; i += n) {
                    allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
                  }
                  slicedAddedUserNickNamesForSearched = [];
                  for (let i = 0; i < addedUserNickNamesForSearched.length; i += n) {
                    slicedAddedUserNickNamesForSearched.push(addedUserNickNamesForSearched.slice(i, i + n));
                  }
                  resolve();
                }
              });
            });
          }else{
            allSearchedBookmarkData = [[]];
            slicedAddedUserNickNamesForSearched = [[]];
            resolve();
          }
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          searchedBookmarkData,
          addedUserNickNames,
          addedUserNickNamesForSearched,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === 'on' && searchFromTextsOnSites === 'on'){
      (() => {
        var promise = new Promise((resolve) => {
          var keyWordsForQueryWithTitle = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryWithTitle += currentValue;
              resolve(keyWordsForQueryWithTitle);
            }else{
              keyWordsForQueryWithTitle += currentValue + '%" AND `title` LIKE "%';
            }
          });
        });
        return promise;
      })().then((value) => {
        var keyWordsForQueryWithTitle = value;
        var promise = new Promise((resolve) => {
          var keyWordsForQueryWithDescription = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryWithDescription += currentValue;
              var values = {
                keyWordsForQueryWithTitle,
                keyWordsForQueryWithDescription,
              };
              resolve(values);
            }else{
              keyWordsForQueryWithDescription += currentValue + '%" AND `description` LIKE "%';
            }
          });
        });
        return promise;
      }).then((values) => {
        var keyWordsForQueryWithDescription = values.keyWordsForQueryWithDescription;
        var keyWordsForQueryWithTitle = values.keyWordsForQueryWithTitle;
        var promise = new Promise((resolve) => {
          var keyWordsForQueryWithText = '%';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              keyWordsForQueryWithText += currentValue;
              values = {
                keyWordsForQueryWithText,
                keyWordsForQueryWithTitle,
                keyWordsForQueryWithDescription,
              };
              resolve(values);
            }else{
              keyWordsForQueryWithText += currentValue + '%" AND `text` LIKE "%';
            }
          });
        });
        return promise;
      }).then((values) => {
        var keyWordsForQueryWithText = values.keyWordsForQueryWithText;
        var keyWordsForQueryWithTitle = values.keyWordsForQueryWithTitle;
        var keyWordsForQueryWithDescription = values.keyWordsForQueryWithDescription;
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND (( `title` LIKE "' + keyWordsForQueryWithTitle + '%" ) OR ( `description` LIKE "' + keyWordsForQueryWithDescription + '%" ) OR ( `text` LIKE "' + keyWordsForQueryWithText + '%" ))';
          connection.query(selectSearchedBookmarks, [orgId]).then((result) => {
            var searchedBookmarkData = result[0];
            resolve(searchedBookmarkData);
          });
        });
        return promise;
      }).then((searchedBookmarkData) => {
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `user_id` = ?';
          if(searchedBookmarkData.length > 0){
            searchedBookmarkData.forEach((currentValue) => {
              connection.query(selectNickName, [currentValue.user_id]).then((result) => {
                addedUserNickNamesForSearched.push(result[0][0].nick_name);
                if(searchedBookmarkData.length === addedUserNickNamesForSearched.length){
                  var n = 12;
                  allSearchedBookmarkData = [];
                  for (let i = 0; i < searchedBookmarkData.length; i += n) {
                    allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
                  }
                  slicedAddedUserNickNamesForSearched = [];
                  for (let i = 0; i < addedUserNickNamesForSearched.length; i += n) {
                    slicedAddedUserNickNamesForSearched.push(addedUserNickNamesForSearched.slice(i, i + n));
                  }
                  resolve();
                }
              });
            });
          }else{
            allSearchedBookmarkData = [[]];
            slicedAddedUserNickNamesForSearched = [[]];
            resolve();
          }
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        res.render('organizationPage.ejs', {
          bookmarkData,
          orgName,
          orgIntroduction,
          orgThumbnail,
          isAdmin,
          searchedBookmarkData,
          addedUserNickNames,
          addedUserNickNamesForSearched,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }
  });
});
module.exports = router;
