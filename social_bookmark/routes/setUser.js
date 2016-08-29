var connection = require('../mysqlConnection');

module.exports = (req, res, next) => {
  var userId = req.session.user_id;
  if(userId){
    var query = 'SELECT * FROM `users` WHERE `user_id` = ?';
    connection.query(query, [userId]).then((result) => {
      res.locals.userName = result[0].length ? result[0][0].name : false;
      res.locals.nickName = result[0].length ? result[0][0].nick_name : false;
      res.locals.thumbnail = result[0].length ? result[0][0].image_path : false;
      next();
    });
  }else{
    res.redirect('/PHH_Bookmark/login');
  }
};
