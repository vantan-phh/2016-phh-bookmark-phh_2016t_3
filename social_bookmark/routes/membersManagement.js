var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

var selectedUserNames = [];
var selectedNickNames = [];
var memberUserNames = [];
var memberNickNames = [];
var myUserName;

router.get('/', (req, res) => {
  selectedUserNames = [];
  selectedNickNames = [];
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var checkAuthority = 'SELECT `user_id` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ? AND `is_admin` = true';
      connection.query(checkAuthority, [myId, orgId]).then((result) => {
        if(result[0].length === 1){
          resolve();
        }else{
          res.redirect('/PHH_Bookmark/organizationPage');
        }
      });
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      var checkMembership = 'SELECT `user_id` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
      connection.query(checkMembership, [myId, orgId]).then((result) => {
        if(result[0].length > 0){
          resolve();
        }else{
          res.redirect('/PHH_Bookmark/topPage');
        }
      });
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
      memberUserNames = [];
      memberNickNames = [];
      connection.query(specifyOrg, [orgId]).then((result) => {
        var orgName = result[0][0].name;
        var orgIntroduction = result[0][0].introduction;
        var orgThumbnail = result[0][0].image_path;
        var values = {
          orgName,
          orgThumbnail,
          orgIntroduction,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgThumbnail = values.orgThumbnail;
    var orgIntroduction = values.orgIntroduction;
    var promise = new Promise((resolve) => {
      var selectMembers = 'SELECT `user_id` FROM `organization_memberships` WHERE `org_id` = ?';
      connection.query(selectMembers, [orgId]).then((result) => {
        var belongMembers = result[0];
        values = {
          orgName,
          orgThumbnail,
          orgIntroduction,
          belongMembers,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgThumbnail = values.orgThumbnail;
    var orgIntroduction = values.orgIntroduction;
    var belongMembers = values.belongMembers;
    var promise = new Promise((resolve) => {
      var idsForQuery = '';
      belongMembers.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          idsForQuery += currentValue.user_id;
          values = {
            orgName,
            orgThumbnail,
            orgIntroduction,
            idsForQuery,
          };
          resolve(values);
        }else{
          idsForQuery += currentValue.user_id + ' OR `user_id` = ';
        }
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var idsForQuery = values.idsForQuery;
    var promise = new Promise((resolve) => {
      var selectMemberData = 'SELECT * FROM `users` WHERE `user_id` = ' + idsForQuery;
      connection.query(selectMemberData).then((result) => {
        var selectedData = result[0];
        values = {
          orgName,
          orgIntroduction,
          orgThumbnail,
          selectedData,
        };
        resolve(values);
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var selectedData = values.selectedData;
    var promise = new Promise((resolve) => {
      selectedData.forEach((currentValue, index, array) => {
        memberUserNames.push(currentValue.name);
        memberNickNames.push(currentValue.nick_name);
        if(index + 1 === array.length){
          values = {
            orgName,
            orgIntroduction,
            orgThumbnail,
          };
          resolve(values);
        }
      });
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
    connection.query(selectMyUserName, [myId]).then((result) => {
      myUserName = result[0][0].name;
      res.render('membersManagement.ejs', {
        memberUserNames,
        memberNickNames,
        orgName,
        orgThumbnail,
        orgIntroduction,
        myUserName,
      });
    });
  });
});

router.post('/searchUser', (req, res) => {
  var orgId = req.session.org_id;
  var searchedUser = req.body.searchedUser;
  var myId = req.session.user_id;
  var checkForm = /^[a-zA-Z0-9]+$/;
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
      if(checkForm.test(searchedUser)){
        resolve(values);
      }else{
        res.render('membersManagement.ejs', {
          memberUserNames,
          memberNickNames,
          selectedUserNames,
          selectedNickNames,
          orgName,
          orgIntroduction,
          orgThumbnail,
          notice : 'ユーザー名は半角英数です',
          myUserName,
        });
      }
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    if(selectedUserNames.length > 0){
      (() => {
        var promise = new Promise((resolve) => {
          var excludeUsers = [];
          memberUserNames.forEach((currentValue, index, array) => {
            excludeUsers.push(currentValue);
            if(index + 1 === array.length){
              values = {
                orgName,
                orgIntroduction,
                orgThumbnail,
                excludeUsers,
              };
              resolve(values);
            }
          });
        });
        return promise;
      })().then((_values) => {
        var excludeUsers = _values.excludeUsers;
        excludeUsers = excludeUsers.concat(selectedUserNames);
        var promise = new Promise((resolve) => {
          var exclude = 'SELECT `name` FROM `users` WHERE `name` NOT IN (?)';
          connection.query(exclude, [excludeUsers]).then((result) => {
            if(result[0].length > 0){
              _values.selectedUsers = result[0];
              resolve(_values);
            }else{
              res.render('membersManagement.ejs', {
                orgName,
                orgIntroduction,
                orgThumbnail,
                selectedUserNames,
                selectedNickNames,
                memberUserNames,
                memberNickNames,
                notice : '該当するユーザーが見つかりません。',
                myUserName,
              });
            }
          });
        });
        return promise;
      }).then((_values) => {
        var selectedUsers = _values.selectedUsers;
        var promise = new Promise((resolve) => {
          var searchedUserNames = [];
          searchedUser = new RegExp('.*' + searchedUser + '.*');
          selectedUsers.forEach((currentValue, index, array) => {
            if(searchedUser.test(currentValue.name)){
              searchedUserNames.push(currentValue.name);
            }
            if(index + 1 === array.length){
              _values.searchedUserNames = searchedUserNames;
              resolve(_values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        var searchedUserNames = _values.searchedUserNames;
        var promise = new Promise((resolve) => {
          if(searchedUserNames.length > 0){
            var userNamesForQuery = '';
            searchedUserNames.forEach((currentValue, index, array) => {
              if(index + 1 === array.length){
                userNamesForQuery += '"' + currentValue + '"';
                _values.userNamesForQuery = userNamesForQuery;
                resolve(_values);
              }else{
                userNamesForQuery += '"' + currentValue + '" OR `name` = ';
              }
            });
          }else{
            res.render('membersManagement.ejs', {
              memberUserNames,
              memberNickNames,
              selectedUserNames,
              selectedNickNames,
              orgName,
              orgIntroduction,
              orgThumbnail,
              notice : '該当するユーザーが見つかりません。',
              myUserName,
            });
          }
        });
        return promise;
      }).then((_values) => {
        var userNamesForQuery = _values.userNamesForQuery;
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ' + userNamesForQuery;
          connection.query(selectNickName).then((result) => {
            _values.hitNickNames = result[0];
            resolve(_values);
          });
        });
        return promise;
      }).then((_values) => {
        var hitNickNames = _values.hitNickNames;
        var promise = new Promise((resolve) => {
          var searchedNickNames = [];
          hitNickNames.forEach((currentValue, index, array) => {
            searchedNickNames.push(currentValue.nick_name);
            if(index + 1 === array.length){
              _values.searchedNickNames = searchedNickNames;
              resolve(_values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        orgName = _values.orgName;
        orgIntroduction = _values.orgIntroduction;
        orgThumbnail = _values.orgThumbnail;
        var searchedUserNames = _values.searchedUserNames;
        var searchedNickNames = _values.searchedNickNames;
        res.render('membersManagement.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          memberUserNames,
          memberNickNames,
          searchedNickNames,
          searchedUserNames,
          selectedUserNames,
          selectedNickNames,
          myUserName,
        });
      });
    }else{
      (() => {
        var promise = new Promise((resolve) => {
          var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
          connection.query(selectMyUserName, [myId]).then((result) => {
            myUserName = result[0][0].name;
            values = {
              orgName,
              orgIntroduction,
              orgThumbnail,
              myUserName,
            };
            resolve(values);
          });
        });
        return promise;
      })().then((_values) => {
        myUserName = _values.myUserName;
        var promise = new Promise((resolve) => {
          var excludeUsers = [];
          memberUserNames.forEach((currentValue, index, array) => {
            excludeUsers.push(currentValue);
            if(index + 1 === array.length){
              _values.excludeUsers = excludeUsers;
              resolve(_values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        orgName = _values.orgName;
        orgIntroduction = _values.orgIntroduction;
        orgThumbnail = _values.orgThumbnail;
        var excludeUsers = _values.excludeUsers;
        var promise = new Promise((resolve) => {
          var exclude = 'SELECT `name` FROM `users` WHERE `name` NOT IN (?)';
          connection.query(exclude, [excludeUsers]).then((result) => {
            if(result[0].length){
              _values.hitUserNames = result[0];
              resolve(_values);
            }else{
              res.render('membersManagement.ejs', {
                orgName,
                orgIntroduction,
                orgThumbnail,
                selectedUserNames,
                selectedNickNames,
                notice : '該当するユーザーが見つかりません。',
                memberUserNames,
                memberNickNames,
                myUserName,
              });
            }
          });
        });
        return promise;
      }).then((_values) => {
        var hitUserNames = _values.hitUserNames;
        var promise = new Promise((resolve) => {
          var searchedUserNames = [];
          searchedUser = new RegExp('.*' + searchedUser + '.*');
          hitUserNames.forEach((currentValue, index, array) => {
            if(searchedUser.test(currentValue.name)){
              searchedUserNames.push(currentValue.name);
            }
            if(index + 1 === array.length){
              _values.searchedUserNames = searchedUserNames;
              resolve(_values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        var searchedUserNames = _values.searchedUserNames;
        var promise = new Promise((resolve) => {
          if(searchedUserNames.length > 0){
            resolve(_values);
          }else{
            res.render('membersManagement.ejs', {
              memberUserNames,
              memberNickNames,
              selectedUserNames,
              selectedNickNames,
              orgName,
              orgIntroduction,
              orgThumbnail,
              notice : '該当するユーザーが見つかりません。',
              myUserName,
            });
          }
        });
        return promise;
      }).then((_values) => {
        var searchedUserNames = _values.searchedUserNames;
        var promise = new Promise((resolve) => {
          var userNamesForQuery = '';
          searchedUserNames.forEach((currentValue, index, array) => {
            if(index + 1 === array.length){
              userNamesForQuery += '"' + currentValue + '"';
              _values.userNamesForQuery = userNamesForQuery;
              resolve(_values);
            }else {
              userNamesForQuery += '"' + currentValue + '" OR `name` = ';
            }
          });
        });
        return promise;
      }).then((_values) => {
        var userNamesForQuery = _values.userNamesForQuery;
        var promise = new Promise((resolve) => {
          var selectNickName = 'SELECT `nick_name` FROM `users` WHERE `name` = ' + userNamesForQuery;
          connection.query(selectNickName).then((result) => {
            var hitNickNames = result[0];
            _values.hitNickNames = hitNickNames;
            resolve(_values);
          });
        });
        return promise;
      }).then((_values) => {
        var hitNickNames = _values.hitNickNames;
        var promise = new Promise((resolve) => {
          var searchedNickNames = [];
          hitNickNames.forEach((currentValue, index, array) => {
            searchedNickNames.push(currentValue.nick_name);
            if(index + 1 === array.length){
              _values.searchedNickNames = searchedNickNames;
              resolve(_values);
            }
          });
        });
        return promise;
      }).then((_values) => {
        orgName = _values.orgName;
        orgIntroduction = _values.orgIntroduction;
        orgThumbnail = _values.orgThumbnail;
        var searchedNickNames = _values.searchedNickNames;
        var searchedUserNames = _values.searchedUserNames;
        res.render('membersManagement.ejs', {
          orgName,
          orgIntroduction,
          orgThumbnail,
          searchedUserNames,
          searchedNickNames,
          memberUserNames,
          memberNickNames,
          selectedUserNames,
          selectedNickNames,
          myUserName,
        });
      });
    }
  });
});

router.post('/selectUser', (req, res) => {
  var results = req.body.result;
  results = results.split(',');
  var selectedUserName = results[0];
  var selectedNickName = results[1];
  selectedUserNames.push(selectedUserName);
  selectedNickNames.push(selectedNickName);
  var orgId = req.session.org_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  connection.query(specifyOrg, [orgId]).then((result) => {
    var orgName = result[0][0].name;
    var orgIntroduction = result[0][0].introduction;
    var orgThumbnail = result[0][0].image_path;
    res.render('membersManagement.ejs', {
      orgName,
      orgIntroduction,
      orgThumbnail,
      selectedUserNames,
      selectedNickNames,
      memberNickNames,
      memberUserNames,
      myUserName,
    });
  });
});

router.post('/excludeUser', (req, res) => {
  var results = req.body.result;
  results = results.split(',');
  var excludeUserName = results[0];
  var excludeNickName = results[1];
  var orgId = req.session.org_id;
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
    var promise = new Promise((resolve) => {
      selectedUserNames.some((currentValue, index) => {
        if(currentValue === excludeUserName){
          selectedUserNames.splice(index, 1);
        }
      });
      resolve(values);
    });
    return promise;
  }).then((values) => {
    var promise = new Promise((resolve) => {
      selectedNickNames.some((currentValue, index) => {
        if(currentValue === excludeNickName){
          selectedNickNames.splice(index, 1);
        }
      });
      resolve(values);
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    res.render('membersManagement.ejs', {
      orgName,
      orgIntroduction,
      orgThumbnail,
      selectedUserNames,
      selectedNickNames,
      memberUserNames,
      memberNickNames,
      myUserName,
    });
  });
});

router.post('/makeJoin', (req, res) => {
  var orgId = req.session.org_id;
  (() => {
    var promise = new Promise((resolve) => {
      var userNamesForQuery = '';
      selectedUserNames.forEach((currentValue, index, array) => {
        if(index + 1 === array.length){
          userNamesForQuery += '"' + currentValue + '"';
          resolve(userNamesForQuery);
        }else{
          userNamesForQuery += '"' + currentValue + '" OR `name` = ';
        }
      });
    });
    return promise;
  })().then((value) => {
    var userNamesForQuery = value;
    var promise = new Promise((resolve) => {
      var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ' + userNamesForQuery;
      connection.query(selectUserId).then((result) => {
        var selectedUserIds = result[0];
        resolve(selectedUserIds);
      });
    });
    return promise;
  }).then((value) => {
    var selectedUserIds = value;
    var promise = new Promise((resolve) => {
      var makeJoin = 'INSERT INTO `organization_memberships` (`user_id`, `org_id`, `is_admin`) VALUES (?, ?, ?)';
      selectedUserIds.forEach((currentValue, index, array) => {
        connection.query(makeJoin, [currentValue.user_id, orgId, false]).then(() => {
          if(index + 1 === array.length){
            resolve();
          }
        });
      });
    });
    return promise;
  }).then(() => {
    res.redirect('/PHH_Bookmark/membersManagement');
  });
});

router.post('/expelUser', (req, res) => {
  var orgId = req.session.org_id;
  var expelUserName = req.body.result;
  (() => {
    var promise = new Promise((resolve) => {
      var selectUserId = 'SELECT `user_id` FROM `users` WHERE `name` = ?';
      connection.query(selectUserId, [expelUserName]).then((result) => {
        var expelUserId = result[0][0].user_id;
        resolve(expelUserId);
      });
    });
    return promise;
  })().then((value) => {
    var expelUserId = value;
    var expelUser = 'DELETE FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
    connection.query(expelUser, [expelUserId, orgId]).then(() => {
      res.redirect('/PHH_Bookmark/membersManagement');
    });
  });
});

router.post('/leave', (req, res) => {
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var leave = 'DELETE FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  connection.query(leave, [myId, orgId]).then(() => {
    res.redirect('/PHH_Bookmark/topPage');
  });
});
module.exports = router;
