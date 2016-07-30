var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var orgId = req.session.org_id;
  var specifyOrg = 'SELECT * FROM `organizations` WHERE `id` = ?';
  var memberUserNames = [];
  var memberNickNames = [];
  connection.query(specifyOrg,[orgId],function(err,result){
    var orgName = result[0].name;
    var orgIntroduction = result[0].introduction;
    var orgThumbnail = result[0].image_path;
    var selectMembers = 'SELECT * FROM `organization_memberships` WHERE `org_id` = ?';
    connection.query(selectMembers,[orgId],function(err,result){
      for(var i = 0; i < result.length; i++){

      }
    });
  });
});

router.post('/searchUser',function(req,res){
  var searchedUser = req.body.searchedUser;
  var myId = res.session.user_id;
  var selectMyUserName = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
  connection.query(selectMyUserName,[myId],function(err,result){
    var myUserName = result[0].name;
    if(searchedUser = ''){
      res.render('organizationPage.ejs',{

      });
    }
  });
  searchedUser = new RegExp('.*' + searchedUser + '.*');
  var query = 'SELECT * FROM `users` WHERE'
});

module.exports = router;
