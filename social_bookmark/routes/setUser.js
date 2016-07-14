var connection = require('../mysqlConnection');

module.exports = function(req,res,next){
  var userId = req.session.id;
  if(userId){
    var query = 'SELECT `user_name` FROM `users` WHERE `id` = ?';
    connection.query(query,[1], function(err,result){
      if(!err){
        res.locals.user = result.length? result[0]:false;
      }
    });
  }
  next();
}
