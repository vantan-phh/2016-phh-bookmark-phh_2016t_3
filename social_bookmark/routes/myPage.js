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
var numberOfSearchedBookmarks;

function createSelectCommentQuery(value){
  var promise = new Promise((resolve, reject) => {
    if(value.length){
      var selectCommentQuery = 'SELECT * FROM `comments` WHERE `bookmark_id` = ';
      value.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectCommentQuery += '?';
          var values = {
            selectCommentQuery,
            bookmarkData : value,
          };
          resolve(values);
        }else{
          selectCommentQuery += '? OR `bookmark_id` = ';
        }
      });
    }else{
      reject(value);
    }
  });
  return promise;
}

function createCommentedBookmarkIds(values){
  var promise = new Promise((resolve) => {
    var commentedBookmarkIds = [];
    values.bookmarkData.forEach((currentValue, _index, array) => {
      commentedBookmarkIds.push(currentValue.bookmark_id);
      if(_index + 1 === array.length){
        values.commentedBookmarkIds = commentedBookmarkIds;
        resolve(values);
      }
    });
  });
  return promise;
}

function selectComment(values){
  var promise = new Promise((resolve, reject) => {
    connection.query(values.selectCommentQuery, values.commentedBookmarkIds).then((result) => {
      values.selectedComments = result[0];
      values.selectedComments.length ? resolve(values) : reject(values.bookmarkData);
    });
  });
  return promise;
}

function filterCommentedBookmarkIds(values){
  var promise = new Promise((resolve, reject) => {
    if(values.commentedBookmarkIds.length){
      values.commentedBookmarkIds = values.commentedBookmarkIds.filter((currentValue, _index, array) => array.indexOf(currentValue) === _index);
      resolve(values);
    }else{
      reject(values.bookmarkData);
    }
  });
  return promise;
}

function createComments(values){
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
}

function pushSelectedComments(values){
  'use strict';
  var promise = new Promise((resolve) => {
    values.commentsKeys = Object.keys(values.comments);
    values.selectedComments.forEach((currentValue, _index, array) => {
      values.commentsKeys.forEach((_currentValue, __index, _array) => {
        if(_currentValue === currentValue.bookmark_id.toString()){
          values.comments[_currentValue].push(currentValue);
        }
        if(_index + 1 === array.length && __index + 1 === _array.length){
          resolve(values);
        }
      });
    });
  });
  return promise;
}

function addNumberOfComments(values){
  var promise = new Promise((resolve) => {
    values.bookmarkData.forEach((currentValue, _index, array) => {
      values.commentsKeys.forEach((_currentValue, __index, _array) => {
        if(_currentValue === currentValue.bookmark_id.toString()){
          if(values.comments[_currentValue].length){
            currentValue.numberOfComments = values.comments[_currentValue].length;
          }else{
            currentValue.numberOfComments = 0;
          }
        }
        if(_index + 1 === array.length && __index + 1 === _array.length){
          resolve();
        }
      });
    });
  });
  return promise;
}

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
    var promise = new Promise((resolve, reject) => {
      var selectBelongOrg = 'SELECT `org_id` FROM `organization_memberships` WHERE `user_id` = ?';
      connection.query(selectBelongOrg, [userId]).then((result) => {
        result[0].length ? resolve(result[0]) : reject();
      });
    });
    return promise;
  })().then((value) => {
    var selectedBelongOrgIds = value;
    var promise = new Promise((resolve) => {
      let selectOrgData = 'SELECT * FROM `organizations` WHERE `org_id` = ';
      selectedBelongOrgIds.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectOrgData += '?';
          var values = {
            selectedBelongOrgIds,
            selectOrgData,
          };
          resolve(values);
        }else{
          selectOrgData += '? OR `org_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      values.orgIds = [];
      values.selectedBelongOrgIds.forEach((currentValue, _index, array) => {
        values.orgIds.push(currentValue.org_id);
        if(_index + 1 === array.length) resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      connection.query(values.selectOrgData, values.orgIds).then((result) => {
        orgData = result[0];
        resolve();
      });
    });
    return promise;
  }).catch(() => {
    var promise = new Promise((resolve) => {
      orgData = [];
      resolve();
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var query = 'SELECT * FROM `bookmarks` WHERE `user_id` = ?';
      connection.query(query, [userId]).then((result) => {
        var n = 12;
        allBookmarkData = [];
        if(result[0].length){
          for (var i = 0; i < result[0].length; i += n) {
            allBookmarkData.push(result[0].slice(i, i + n));
            if(i + n > result[0].length){
              resolve(allBookmarkData);
            }
          }
        }else{
          allBookmarkData = [[]];
          resolve(allBookmarkData);
        }
      });
    });
    return promise;
  }).then((value) => {
    allBookmarkData = value;
    res.redirect('/PHH_Bookmark/myPage/bookmarkList/1/searchBookmarkList/0');
  })
  .catch((value) => {
    allBookmarkData = value;
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
      createSelectCommentQuery(bookmarkData)
      .then(createCommentedBookmarkIds)
      .then(selectComment)
      .then(filterCommentedBookmarkIds)
      .then(createComments)
      .then(pushSelectedComments)
      .then(addNumberOfComments)
      .then(() => {
        res.render('myPage.ejs', {
          bookmarkData,
          orgData,
          pageLength,
          index,
          searchIndex,
          numberOfSearchedBookmarks,
        });
      }).catch(() => {
        res.render('myPage.ejs', {
          bookmarkData,
          orgData,
          pageLength,
          index,
          searchIndex,
          numberOfSearchedBookmarks,
        });
      });
    }else{
      res.redirect('/PHH_Bookmark/myPage/bookmarkList/1/searchBookmarkList/0');
    }
  }else{
    var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
    var searchPageLength = allSearchedBookmarkData.length;
    createSelectCommentQuery(searchedBookmarkData)
    .then(createCommentedBookmarkIds)
    .then(selectComment)
    .then(filterCommentedBookmarkIds)
    .then(createComments)
    .then(pushSelectedComments)
    .then(addNumberOfComments)
    .then(() => {
      res.render('myPage.ejs', {
        bookmarkData,
        searchedBookmarkData,
        orgData,
        pageLength,
        searchPageLength,
        index,
        searchIndex,
        numberOfSearchedBookmarks,
      });
    }).catch(() => {
      res.render('myPage.ejs', {
        bookmarkData,
        searchedBookmarkData,
        orgData,
        pageLength,
        searchPageLength,
        index,
        searchIndex,
        numberOfSearchedBookmarks,
      });
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
      ids = Object.keys(ids);
      var query = 'DELETE FROM `bookmarks` WHERE `bookmark_id` = ';
      ids.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          query += '?';
          var values = {
            ids,
            query,
          };
          resolve(values);
        }else{
          query += '? OR `bookmark_id` =';
        }
      });
    });
    return promise;
  })().then((values) => {
    var promise = new Promise((resolve) => {
      connection.query(values.query, values.ids).then(() => {
        resolve();
      });
    });
    return promise;
  }).then(() => {
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

  function createSelectSearchedBookmarksByOneColumn(column){
    var promise = new Promise((resolve) => {
      var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND (`' + column + '` LIKE';
      keyWords.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectSearchedBookmarks += ' ?)';
          resolve(selectSearchedBookmarks);
        }else{
          selectSearchedBookmarks += ' ? AND `' + column + '` LIKE';
        }
      });
    });
    return promise;
  }

  function createSelectSearchedBookmarksByTwoColumn(column1, column2){
    var promise = new Promise((resolve) => {
      var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND (( `' + column1 + '` LIKE';
      keyWords.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectSearchedBookmarks += ' ?) OR (`' + column2 + '` LIKE';
        }else{
          selectSearchedBookmarks += ' ? AND `' + column1 + '` LIKE';
        }
      });
      keyWords.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectSearchedBookmarks += ' ?))';
          resolve(selectSearchedBookmarks);
        }else{
          selectSearchedBookmarks += ' ? AND `' + column2 + '` LIKE';
        }
      });
    });
    return promise;
  }

  function createKeyWordsForQueryByOneColumn(value){
    var promise = new Promise((resolve) => {
      keyWordsForQuery = [];
      keyWords.forEach((currentValue, _index, array) => {
        keyWordsForQuery.push('%' + currentValue + '%');
        if(_index + 1 === array.length){
          var values = {
            selectSearchedBookmarks : value,
            keyWordsForQuery,
          };
          resolve(values);
        }
      });
    });
    return promise;
  }

  function createKeyWordsForQueryByTwoColumn(value){
    var promise = new Promise((resolve) => {
      keyWordsForQuery = [];
      keyWords.forEach((currentValue) => {
        keyWordsForQuery.push('%' + currentValue + '%');
      });
      keyWords.forEach((currentValue, _index, array) => {
        keyWordsForQuery.push('%' + currentValue + '%');
        if(_index + 1 === array.length){
          var values = {
            selectSearchedBookmarks : value,
            keyWordsForQuery,
          };
          resolve(values);
        }
      });
    });
    return promise;
  }

  function doSelectSearchedBookmarks(values){
    var promise = new Promise((resolve) => {
      values.keyWordsForQuery.unshift(myId);
      connection.query(values.selectSearchedBookmarks, values.keyWordsForQuery).then((result) => {
        numberOfSearchedBookmarks = result[0].length;
        var searchedBookmarkData = result[0];
        resolve(searchedBookmarkData);
      });
    });
    return promise;
  }

  function divideSearchedBookmarkData(value){
    var promise = new Promise((resolve) => {
      var searchedBookmarkData = value;
      var n = 12;
      allSearchedBookmarkData = [];
      numberOfSearchedBookmarks = searchedBookmarkData.length;
      if(searchedBookmarkData.length === 0){
        allSearchedBookmarkData.push([]);
      }else{
        for (var i = 0; i < searchedBookmarkData.length; i += n) {
          allSearchedBookmarkData.push(searchedBookmarkData.slice(i, i + n));
        }
      }
      resolve(allSearchedBookmarkData);
    });
    return promise;
  }

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
          searchIndex,
        });
      }
    });
    return promise;
  }).then(() => {
    if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === undefined){
      createSelectSearchedBookmarksByOneColumn('title')
      .then(createKeyWordsForQueryByOneColumn)
      .then(doSelectSearchedBookmarks)
      .then(divideSearchedBookmarkData)
      .catch(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      }).then((value) => {
        var searchPageLength = value.length;
        var searchedBookmarkData = value[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      });
    }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
      createSelectSearchedBookmarksByOneColumn('description')
      .then(createKeyWordsForQueryByOneColumn)
      .then(doSelectSearchedBookmarks)
      .then(divideSearchedBookmarkData)
      .catch(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      }).then((value) => {
        var searchPageLength = value.length;
        var searchedBookmarkData = value[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      });
    }else if(searchFromTitle === undefined && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
      createSelectSearchedBookmarksByOneColumn('text')
      .then(createKeyWordsForQueryByOneColumn)
      .then(doSelectSearchedBookmarks)
      .then(divideSearchedBookmarkData)
      .catch(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      }).then((value) => {
        var searchPageLength = value.length;
        var searchedBookmarkData = value[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
      createSelectSearchedBookmarksByTwoColumn('title', 'description')
      .then(createKeyWordsForQueryByTwoColumn)
      .then(doSelectSearchedBookmarks)
      .then(divideSearchedBookmarkData)
      .catch(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      }).then((value) => {
        var searchPageLength = value.length;
        var searchedBookmarkData = value[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
      createSelectSearchedBookmarksByTwoColumn('title', 'text')
      .then(createKeyWordsForQueryByTwoColumn)
      .then(doSelectSearchedBookmarks)
      .then(divideSearchedBookmarkData)
      .catch(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      }).then((value) => {
        var searchPageLength = value.length;
        var searchedBookmarkData = value[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      });
    }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === 'on'){
      createSelectSearchedBookmarksByTwoColumn('description', 'text')
      .then(createKeyWordsForQueryByTwoColumn)
      .then(doSelectSearchedBookmarks)
      .then(divideSearchedBookmarkData)
      .catch(() => {
        var searchPageLength = allSearchedBookmarkData.length;
        var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      }).then((value) => {
        var searchPageLength = value.length;
        var searchedBookmarkData = value[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === 'on' && searchFromTextsOnSites === 'on'){
      (() => {
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `user_id` = ? AND ((`title` LIKE';
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              selectSearchedBookmarks += ' ?) OR (`description` LIKE';
              resolve(selectSearchedBookmarks);
            }else{
              selectSearchedBookmarks += ' ? AND `title` LIKE';
            }
          });
        });
        return promise;
      })().then((value) => {
        var selectSearchedBookmarks = value;
        var promise = new Promise((resolve) => {
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              selectSearchedBookmarks += ' ?) OR (`text` LIKE';
              resolve(selectSearchedBookmarks);
            }else{
              selectSearchedBookmarks += ' ? AND `description` LIKE';
            }
          });
        });
        return promise;
      }).then((value) => {
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = value;
          keyWords.forEach((currentValue, _index, array) => {
            if(_index + 1 === array.length){
              selectSearchedBookmarks += ' ?))';
              resolve(selectSearchedBookmarks);
            }else{
              selectSearchedBookmarks += ' ? AND `text` LIKE';
            }
          });
        });
        return promise;
      }).then((value) => {
        var promise = new Promise((resolve) => {
          keyWordsForQuery = [];
          keyWords.forEach((currentValue) => {
            keyWordsForQuery.push('%' + currentValue + '%');
          });
          keyWords.forEach((currentValue) => {
            keyWordsForQuery.push('%' + currentValue + '%');
          });
          keyWords.forEach((currentValue, _index, array) => {
            keyWordsForQuery.push('%' + currentValue + '%');
            if(_index + 1 === array.length){
              var values = {
                selectSearchedBookmarks : value,
                keyWordsForQuery,
              };
              resolve(values);
            }
          });
        });
        return promise;
      }).then(doSelectSearchedBookmarks)
      .then(divideSearchedBookmarkData)
      .then(createSelectCommentQuery)
      .then(createCommentedBookmarkIds)
      .then(selectComment)
      .then(filterCommentedBookmarkIds)
      .then(createComments)
      .then(pushSelectedComments)
      .then(addNumberOfComments)
      .catch(() => {
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
          numberOfSearchedBookmarks,
        });
      })
      .then((value) => {
        var searchPageLength = value.length;
        var searchedBookmarkData = value[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        }).catch(() => {
          res.render('myPage.ejs', {
            bookmarkData,
            searchedBookmarkData,
            orgData,
            pageLength,
            searchPageLength,
            index,
            searchIndex,
            numberOfSearchedBookmarks,
          });
        });
      });
    }else{
      res.render('myPage.ejs', {
        bookmarkData,
        orgData,
        pageLength,
        index,
        searchIndex,
        numberOfSearchedBookmarks,
        checkNotice : '検索したい項目にチェックを入れてください',
      });
    }
  });
});

module.exports = router;
