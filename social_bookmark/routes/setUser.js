var connection = require('../mysqlConnection');

module.exports = function(req,res,next){
  var userId = req.session.user_id;
  if(userId){
    var query = 'SELECT `name` FROM `users` WHERE `user_id` = ?';
    connection.query(query,[userId], function(err,result){
      console.log(result);
      if(!err){
        res.locals.user = result.length? result[0]:false;
      }
    });
  }else{
    res.redirect('/PHH_Bookmark/login');
  }
  next();
}
