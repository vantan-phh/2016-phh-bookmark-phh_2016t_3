var connection = require('../mysqlConnection');

module.exports = function(req,res,next){
  var userId = req.session.user_id;
  if(userId){
    var query = 'SELECT `user_name` FROM `users` WHERE `user_id` = ?';
    connection.query(query,[userId], function(err,result){
      if(!err){
        res.locals.user = result.length? result[0]:false;
      }
    });
  }
  next();
}
