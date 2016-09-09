'use strict';
var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');
var client = require('cheerio-httpcli');

var allBookmarkData;
var orgData;
var index;
var allSearchedBookmarkData;
var searchIndex;

router.param('index', (req, res, next, value) => {
  index = value;
  next();
});

router.param('searchIndex', (req, res, next, value) => {
  searchIndex = value;
  next();
});

router.get('/', (req, res) => {
  var userId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var selectBelongOrg = 'SELECT `org_id` FROM `organization_memberships` WHERE `user_id` = ?';
      connection.query(selectBelongOrg, [userId]).then((result) => {
        var selectedBelongOrgIds = result[0];
        resolve(selectedBelongOrgIds);
      });
    });
    return promise;
  })().then((value) => {
    var selectedBelongOrgIds = value;
    var promise = new Promise((resolve) => {
      if(selectedBelongOrgIds.length){
        let belongOrgIdsForQuery = '';
        selectedBelongOrgIds.forEach((currentValue, _index, array) => {
          if(_index + 1 === array.length){
            belongOrgIdsForQuery += currentValue.org_id;
            resolve(belongOrgIdsForQuery);
          }else{
            belongOrgIdsForQuery += currentValue.org_id + ' OR `id` = ';
          }
        });
      }else{
        var belongOrgIdsForQuery = false;
        resolve(belongOrgIdsForQuery);
      }
    });
    return promise;
  }).then((value) => {
    var belongOrgIdsForQuery = value;
    var promise = new Promise((resolve) => {
      if(belongOrgIdsForQuery){
        var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ' + belongOrgIdsForQuery;
        connection.query(selectOrgData).then((result) => {
          orgData = result[0];
          resolve();
        });
      }else{
        orgData = {};
        resolve();
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
      connection.query(query, [userId]).then((result) => {
        var n = 12;
        allBookmarkData = [];
        for (var i = 0; i < result[0].length; i += n) {
          allBookmarkData.push(result[0].slice(i, i + n));
          if(i + n > result[0].length){
            resolve(allBookmarkData);
          }
        }
      });
    });
    return promise;
  }).then((value) => {
    var promise = new Promise((resolve) => {
      var bookmarkIdsForQuery = '';
      value.forEach((currentValue, _index, array) => {
        currentValue.forEach((_currentValue, __index, _array) => {
          if(_index + 1 === array.length && __index + 1 === _array.length){
            bookmarkIdsForQuery += _currentValue.bookmark_id;
            var values = {
              allBookmarkData : value,
              bookmarkIdsForQuery,
            };
            resolve(values);
          }else{
            bookmarkIdsForQuery += _currentValue.bookmark_id + ' OR `bookmark_id` = ';
          }
        });
      });
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
    var promise = new Promise((resolve) => {
      var commentedBookmarkIds = [];
      values.selectedComments.forEach((currentValue, _index, array) => {
        commentedBookmarkIds.push(currentValue.bookmark_id);
        if(_index + 1 === array.length){
          values.commentedBookmarkIds = commentedBookmarkIds;
          resolve(values);
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
      values.commentedBookmarkIds.forEach((currentValue, _index, array) => {
        comments[currentValue] = [];
        if(_index + 1 === array.length){
          values.comments = comments;
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.selectedComments.forEach((currentValue, _index, array) => {
        for(var key in values.comments){
          if(key === currentValue.bookmark_id.toString()){
            values.comments[key].push(currentValue);
          }
          if(_index + 1 === array.length) resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.allBookmarkData.forEach((currentValue, _index, array) => {
        currentValue.forEach((_currentValue, __index, _array) => {
          for(var key in values.comments){
            if(key === _currentValue.bookmark_id.toString()){
              if(values.comments[key].length){
                _currentValue.numberOfComments = values.comments[key].length;
              }else{
                _currentValue.numberOfComments = 0;
              }
            }
            if(_index + 1 === array.length && __index + 1 === _array.length){
              resolve(values);
            }
          }
        });
      });
    });
    return promise;
  }).then((values) => {
    allBookmarkData = values.allBookmarkData;
    res.redirect('/PHH_Bookmark/myPage/bookmarkList/1/searchBookmarkList/0');
  });
});

router.get('/bookmarkList/:index/searchBookmarkList/:searchIndex', (req, res) => {
  var pageLength = allBookmarkData.length;
  var bookmarkData;
  index = parseInt(index, 10);
  searchIndex = parseInt(searchIndex, 10);
  if(allBookmarkData.length){
    bookmarkData = allBookmarkData[index - 1];
  }else{
    bookmarkData = [];
  }
  if(searchIndex === 0){
    if(pageLength >= index && index > 0){
      res.render('myPage.ejs', {
        bookmarkData,
        orgData,
        pageLength,
        index,
        searchIndex,
      });
    }else{
      res.redirect('/PHH_Bookmark/myPage/bookmarkList/1/searchBookmarkList/0');
    }
  }else{
    var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
    var searchPageLength = allSearchedBookmarkData.length;
    res.render('myPage.ejs', {
      bookmarkData,
      searchedBookmarkData,
      orgData,
      pageLength,
      searchPageLength,
      index,
      searchIndex,
    });
  }
});

router.post('/bookmarkList/:index', (req, res) => {
  var userId = req.session.user_id;
  var url = req.body.url;
  var title = req.body.title;
  var description = req.body.description;
  var pageLength = allBookmarkData.length;
  index = parseInt(index, 10);
  var bookmarkData = allBookmarkData[index - 1];
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  var checkInjection = /[%;+-]+/g;
  (() => {
    var promise = new Promise((resolve) => {
      if(checkUrl.test(url)){
        resolve();
      }else{
        res.render('myPage.ejs', {
          bookmarkData,
          urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください',
          orgData,
          pageLength,
          index,
        });
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(title)){
        resolve();
      }else{
        res.render('myPage.ejs', {
          bookmarkData,
          url,
          title,
          description,
          titleNotice : 'セキュリティ上の観点からタイトルに「+, -, %, ;」は使えません',
          orgData,
          pageLength,
          index,
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(description)){
        resolve();
      }else{
        res.render('myPage.ejs', {
          bookmarkData,
          url,
          title,
          description,
          descriptionNotice : 'セキュリティ上の観点から説明文に「+, -, %, ;」は使えません',
          orgData,
          pageLength,
          index,
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(title.length <= 32){
        resolve();
      }else{
        res.render('myPage.ejs', {
          bookmarkData,
          url,
          title,
          description,
          titleNotice : 'タイトルは32文字以内です',
          orgData,
          pageLength,
          index,
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(description.length <= 128){
        resolve();
      }else{
        res.render('myPage.ejs', {
          bookmarkData,
          url,
          title,
          description,
          descriptionNotice : '説明文は128文字以内です',
          orgData,
          pageLength,
          index,
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
          bookmarkData,
          url,
          title,
          description,
          networkNotice : 'URLが正しいかどうかをご確認の上、ネットワーク接続をお確かめ下さい。',
          orgData,
          pageLength,
          index,
        });
      });
    });
    return promise;
  }).then((value) => {
    var text = value;
    var createBookmark = 'INSERT INTO `bookmarks` (`user_id`, `title`, `url`, `description`, `text`) VALUES (?, ?, ?, ?, ?)';
    connection.query(createBookmark, [userId, title, url, description, text]).then(() => {
      res.redirect('/PHH_Bookmark/myPage');
    });
  });
});

router.post('/bookmarkList/:index/submitUrl', (req, res) => {
  var url = req.body.result;
  var checkUrl = /^(https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
  var pageLength = allBookmarkData.length;
  var bookmarkData;
  index = parseInt(index, 10);
  searchIndex = 0;
  if(allBookmarkData.length){
    bookmarkData = allBookmarkData[index - 1];
  }else{
    bookmarkData = [];
  }
  (() => {
    var promise = new Promise((resolve) => {
      if(pageLength >= index && index > 0){
        resolve();
      }else{
        res.redirect('/PHH_Bookmark/myPage/bookmarkList/1');
      }
    });
    return promise;
  })().then(() => {
    if(checkUrl.test(url)){
      client.fetch(url).then((result) => {
        res.render('myPage.ejs', {
          bookmarkData,
          title : result.$('title').text(),
          url,
          orgData,
          pageLength,
          index,
          searchIndex,
        });
      }, () => {
        res.render('myPage.ejs', {
          bookmarkData,
          networkNotice : 'URLが正しいかをご確認の上、ネットワーク接続をお確かめください。',
          orgData,
          pageLength,
          index,
          searchIndex,
        });
      });
    }else{
      res.render('myPage.ejs', {
        bookmarkData,
        urlNotice : 'http://もしくはhttp://から始まる正しいURLを入力してください',
        orgData,
        pageLength,
        index,
        searchIndex,
      });
    }
  });
});

router.post('/delete', (req, res) => {
  var ids = req.body;
  (() => {
    var promise = new Promise((resolve) => {
      for(var x in ids){
        var query = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ?';
        connection.query(query, [x]);
      }
      resolve();
    });
    return promise;
  })().then(() => {
    res.redirect('/PHH_Bookmark/myPage');
  });
});

router.post('/bookmarkList/:index/searchBookmarkList/:searchIndex', (req, res) => {
  var myId = req.session.user_id;
  var keyWord = req.body.keyWord;
  var searchFromTitle = req.body.searchFromTitle;
  var searchFromDescription = req.body.searchFromDescription;
  var searchFromTextsOnSites = req.body.searchFromTextsOnSites;
  var pageLength = allBookmarkData.length;
  index = parseInt(index, 10);
  searchIndex = parseInt(searchIndex, 10);
  var bookmarkData;
  if(allBookmarkData.length){
    bookmarkData = allBookmarkData[index - 1];
  }else{
    bookmarkData = [];
  }
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  var splitKeyWord = /[\S]+/g;
  var keyWords = keyWord.match(splitKeyWord);
  var keyWordsForQuery;
  (() => {
    var promise = new Promise((resolve) => {
      if(checkSpace.test(keyWord)){
        resolve();
      }else{
        res.redirect('/PHH_Bookmark/myPage');
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(keyWord)){
        resolve();
      }else{
        res.render('myPage.ejs', {
          orgData,
          bookmarkData,
          keyWordNotice : 'セキュリティ上の観点から「+, -, %, ;」を含んでの検索はできません',
          pageLength,
          index,
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
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND ( `title` LIKE "' + keyWordsForQuery + '%" )';
          connection.query(selectSearchedBookmarks, [myId]).then((result) => {
            var n = 12;
            allSearchedBookmarkData = [];
            if(result[0].length === 0){
              allSearchedBookmarkData.push([]);
            }else{
              for (var i = 0; i < result[0].length; i += n) {
                allSearchedBookmarkData.push(result[0].slice(i, i + n));
              }
            }
            resolve();
          });
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        res.render('myPage.ejs', {
          bookmarkData,
          searchedBookmarkData,
          orgData,
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
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND ( `description` LIKE "' + keyWordsForQuery + '%" )';
          connection.query(selectSearchedBookmarks, [myId]).then((result) => {
            var n = 12;
            allSearchedBookmarkData = [];
            if(result[0].length === 0){
              allSearchedBookmarkData.push([]);
            }else{
              for (var i = 0; i < result[0].length; i += n) {
                allSearchedBookmarkData.push(result[0].slice(i, i + n));
              }
            }
            resolve();
          });
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        res.render('myPage.ejs', {
          bookmarkData,
          searchedBookmarkData,
          orgData,
          pageLength,
          searchPageLength,
          index,
          searchIndex,
        });
      });
    }else if(searchFromTitle === undefined && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
      keyWordsForQuery = '%';
      (() => { // create table for inserting text of the site and select searchedBookmarks.
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
        var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND ( `text` LIKE "' + keyWordsForQuery + '%")';
        connection.query(selectSearchedBookmarks, [myId]).then((result) => {
          var n = 12;
          allSearchedBookmarkData = [];
          if(result[0].length === 0){
            allSearchedBookmarkData.push([]);
          }else{
            for (var i = 0; i < result[0].length; i += n) {
              allSearchedBookmarkData.push(result[0].slice(i, i + n));
            }
          }
          var searchPageLength = allSearchedBookmarkData.length;
          var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
          });
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
        var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND (( `title` LIKE "' + keyWordsForQueryByTitle + '%" ) OR ( `description` LIKE "' + keyWordsForQueryByDescription + '%"))';
        var promise = new Promise((resolve) => {
          connection.query(selectSearchedBookmarks, [myId]).then((result) => {
            var n = 12;
            allSearchedBookmarkData = [];
            if(result[0].length === 0){
              allSearchedBookmarkData.push([]);
            }else{
              for (var i = 0; i < result[0].length; i += n) {
                allSearchedBookmarkData.push(result[0].slice(i, i + n));
              }
            }
            resolve();
          });
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        res.render('myPage.ejs', {
          bookmarkData,
          searchedBookmarkData,
          orgData,
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
        var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND (( `title` LIKE "' + keyWordsForQueryWithTitle + '%" ) OR ( `text` LIKE "' + keyWordsForQueryWithText + '%" ))';
        connection.query(selectSearchedBookmarks, [myId]).then((result) => {
          var n = 12;
          allSearchedBookmarkData = [];
          if(result[0].length === 0){
            allSearchedBookmarkData.push([]);
          }else{
            for (var i = 0; i < result[0].length; i += n) {
              allSearchedBookmarkData.push(result[0].slice(i, i + n));
            }
          }
          var searchPageLength = allSearchedBookmarkData.length;
          var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
          });
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
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND (( `description` LIKE "' + keyWordsForQueryWithDescription + '%" ) OR ( "' + keyWordsForQueryWithText + '%" ))';
          connection.query(selectSearchedBookmarks, [myId]).then((result) => {
            var n = 12;
            allSearchedBookmarkData = [];
            if(result[0].length === 0){
              allSearchedBookmarkData.push([]);
            }else{
              for (var i = 0; i < result[0].length; i += n) {
                allSearchedBookmarkData.push(result[0].slice(i, i + n));
              }
            }
            resolve();
          });
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        res.render('myPage.ejs', {
          bookmarkData,
          searchedBookmarkData,
          orgData,
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
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND (( `title` LIKE "' + keyWordsForQueryWithTitle + '%" ) OR ( `description` LIKE "' + keyWordsForQueryWithDescription + '%" ) OR ( `text` LIKE "' + keyWordsForQueryWithText + '%" ))';
          connection.query(selectSearchedBookmarks, [myId]).then((result) => {
            var n = 12;
            allSearchedBookmarkData = [];
            if(result[0].length === 0){
              allSearchedBookmarkData.push([]);
            }else{
              for (var i = 0; i < result[0].length; i += n) {
                allSearchedBookmarkData.push(result[0].slice(i, i + n));
              }
            }
            resolve();
          });
        });
        return promise;
      }).then(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        res.render('myPage.ejs', {
          bookmarkData,
          searchedBookmarkData,
          orgData,
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
