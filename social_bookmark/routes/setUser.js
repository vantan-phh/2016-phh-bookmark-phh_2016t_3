var connection = require('../mysqlConnection');

module.exports = function(req,res,next){
  var userId = req.session.user_id;
  if(userId){
    var query = 'SELECT `*` FROM `users` WHERE `user_id` = ?';
    connection.query(query,[userId], function(err,result){
      if(!err){
        res.locals.userName = result.length ? result[0].name : false;
        res.locals.nickName = result.length ? result[0].nick_name : false;
      }
    });
  }else{
    res.redirect('/PHH_Bookmark/login');
  }
  next();
}
