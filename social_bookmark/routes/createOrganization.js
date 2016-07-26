var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  res.render('createOrganization.ejs');
});
router.post('/searchUser',function(req,res){
  var invitedUser = req.body.result;
  if(invitedUser === ''){
    res.redirect('/PHH_Bookmark/createOrganization');
  }else{
    invitedUser = '.*' + invitedUser + '.*';
    var query = 'SELECT * FROM `users` WHERE `name` REGEXP ?';
    connection.query(query,[invitedUser],function(err,result){
      if(result.length >= 1){
        res.render('createOrganization',{
          userList : result
        });
      }else{
        res.render('createOrganization',{
          noUser : '該当するユーザーが見つかりません。'
        });
      }
    });
  }
});

module.exports = router;
