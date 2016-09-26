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
var numberOfSearchedBookmarks;

function createSelectCommentQuery(value){
  var promise = new Promise((resolve, reject) => {
    if(value.length){
      var selectCommentQuery = 'SELECT * FROM `comments` WHERE `bookmark_id` = ';
      value.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectCommentQuery += '?';
          var values = {
            bookmarkData : value,
            selectCommentQuery,
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
      if(values.selectedComments.length){
        resolve(values);
      }else{
        reject(values.bookmarkData);
      }
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
          resolve(values.bookmarkData);
        }
      });
    });
  });
  return promise;
}

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
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `org_id` = ?';
  var selectBookmarkData = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? ORDER BY `bookmark_id` DESC';
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
              resolve(allBookmarkData);
            }
          });
        });
      }else{
        allBookmarkData = [[]];
        resolve(allBookmarkData);
      }
    });
    return promise;
  }).then((value) => {
    var promise = new Promise((resolve) => {
      connection.query(selectOwnBookmarkIds, [myId, orgId]).then((result) => {
        ownBookmarkIds = result[0];
        resolve(value);
      });
    });
    return promise;
  }).catch((value) => {
    var promise = new Promise((resolve) => {
      connection.query(selectOwnBookmarkIds, [myId, orgId]).then((result) => {
        ownBookmarkIds = result[0];
        resolve(value);
      });
    });
    return promise;
  }).then((value) => {
    allBookmarkData = value;
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
    const renderOrganizationPage = () => {
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
        numberOfSearchedBookmarks,
      });
    };
    if(pageLength >= index && index > 0){
      createSelectCommentQuery(bookmarkData)
      .then(createCommentedBookmarkIds)
      .then(selectComment)
      .then(filterCommentedBookmarkIds)
      .then(createComments)
      .then(pushSelectedComments)
      .then(addNumberOfComments)
      .then(renderOrganizationPage)
      .catch(renderOrganizationPage);
    }else{
      res.redirect('/PHH_Bookmark/myPage/bookmarkList/1/searchBookmarkList/0');
    }
  }else{
    var addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
    var searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
    var searchPageLength = allSearchedBookmarkData.length;
    const renderOrganizationPage = () => {
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
        numberOfSearchedBookmarks,
      });
    };
    createSelectCommentQuery(searchedBookmarkData)
    .then(createCommentedBookmarkIds)
    .then(selectComment)
    .then(filterCommentedBookmarkIds)
    .then(createComments)
    .then(pushSelectedComments)
    .then(addNumberOfComments)
    .then(renderOrganizationPage)
    .catch(renderOrganizationPage);
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
          searchIndex,
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
  var searchedBookmarkData;
  var searchPageLength;
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

  function createSelectSearchedBookmarksByOneColumn(column){
    var promise = new Promise((resolve) => {
      var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND (`' + column + '` LIKE';
      keyWords.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectSearchedBookmarks += ' ?) ORDER BY `bookmark_id` DESC';
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
      var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND (( `' + column1 + '` LIKE';
      keyWords.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectSearchedBookmarks += ' ?) OR (`' + column2 + '` LIKE';
        }else{
          selectSearchedBookmarks += ' ? AND `' + column1 + '` LIKE';
        }
      });
      keyWords.forEach((currentValue, _index, array) => {
        if(_index + 1 === array.length){
          selectSearchedBookmarks += ' ?)) ORDER BY `bookmark_id` DESC';
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
      values.keyWordsForQuery.unshift(orgId);
      connection.query(values.selectSearchedBookmarks, values.keyWordsForQuery).then((result) => {
        numberOfSearchedBookmarks = result[0].length;
        searchedBookmarkData = result[0];
        resolve(searchedBookmarkData);
      });
    });
    return promise;
  }

  function selectNickNameAndDivideSearchedBookmarkData(value){
    searchedBookmarkData = value;
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
              resolve(allSearchedBookmarkData);
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
  }

  function renderOrganizationPage(){
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
      numberOfSearchedBookmarks,
    });
  }

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
          searchIndex,
          keyWordNotice : 'セキュリティ上の観点から「+, -, %, ;」を含んでの検索はできません',
        });
      }
    });
    return promise;
  }).then(() => {
    if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === undefined){
      createSelectSearchedBookmarksByOneColumn('title')
      .then(createKeyWordsForQueryByOneColumn)
      .then(doSelectSearchedBookmarks)
      .then(selectNickNameAndDivideSearchedBookmarkData)
      .then((value) => {
        searchedBookmarkData = value[searchIndex - 1];
        searchPageLength = value.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      }).catch(() => {
        searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      });
    }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
      createSelectSearchedBookmarksByOneColumn('description')
      .then(createKeyWordsForQueryByOneColumn)
      .then(doSelectSearchedBookmarks)
      .then(selectNickNameAndDivideSearchedBookmarkData)
      .then((value) => {
        searchedBookmarkData = value[searchIndex - 1];
        searchPageLength = value.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      }).catch(() => {
        searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      });
    }else if(searchFromTitle === undefined && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
      createSelectSearchedBookmarksByOneColumn('text')
      .then(createKeyWordsForQueryByOneColumn)
      .then(doSelectSearchedBookmarks)
      .then(selectNickNameAndDivideSearchedBookmarkData)
      .then((value) => {
        searchPageLength = value.length;
        searchedBookmarkData = value[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      }).catch(() => {
        searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === 'on' && searchFromTextsOnSites === undefined){
      createSelectSearchedBookmarksByTwoColumn('title', 'description')
      .then(createKeyWordsForQueryByTwoColumn)
      .then(doSelectSearchedBookmarks)
      .then(selectNickNameAndDivideSearchedBookmarkData)
      .then((value) => {
        searchPageLength = value.length;
        searchedBookmarkData = value[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      }).catch(() => {
        searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createCommentedBookmarkIds(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === undefined && searchFromTextsOnSites === 'on'){
      createSelectSearchedBookmarksByTwoColumn('title', 'text')
      .then(createKeyWordsForQueryByTwoColumn)
      .then(doSelectSearchedBookmarks)
      .then(selectNickNameAndDivideSearchedBookmarkData)
      .then((value) => {
        searchPageLength = value.length;
        searchedBookmarkData = value[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      }).catch(() => {
        searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      });
    }else if(searchFromTitle === undefined && searchFromDescription === 'on' && searchFromTextsOnSites === 'on'){
      createSelectSearchedBookmarksByTwoColumn('description', 'text')
      .then(createKeyWordsForQueryByTwoColumn)
      .then(doSelectSearchedBookmarks)
      .then(selectNickNameAndDivideSearchedBookmarkData)
      .then((value) => {
        searchPageLength = value.length;
        searchedBookmarkData = value[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      }).catch(() => {
        searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      });
    }else if(searchFromTitle === 'on' && searchFromDescription === 'on' && searchFromTextsOnSites === 'on'){
      (() => {
        var promise = new Promise((resolve) => {
          var selectSearchedBookmarks = 'SELECT * FROM `bookmarks` WHERE `org_id` = ? AND ((`title` LIKE';
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
              selectSearchedBookmarks += ' ?)) ORDER BY `bookmark_id` DESC';
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
      .then(selectNickNameAndDivideSearchedBookmarkData)
      .then((value) => {
        searchPageLength = value.length;
        searchedBookmarkData = value[searchIndex - 1];
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      }).catch(() => {
        searchedBookmarkData = allSearchedBookmarkData[searchIndex - 1];
        searchPageLength = allSearchedBookmarkData.length;
        addedUserNickNamesForSearched = slicedAddedUserNickNamesForSearched[searchIndex - 1];
        createSelectCommentQuery(searchedBookmarkData)
        .then(createCommentedBookmarkIds)
        .then(selectComment)
        .then(filterCommentedBookmarkIds)
        .then(createComments)
        .then(pushSelectedComments)
        .then(addNumberOfComments)
        .then(renderOrganizationPage)
        .catch(renderOrganizationPage);
      });
    }else{
      res.render('organizationPage.ejs', {
        bookmarkData,
        orgName,
        orgIntroduction,
        orgThumbnail,
        isAdmin,
        addedUserNickNames,
        addedUserNickNamesForSearched,
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
