var express = require('express');
var router = express.Router();

router.get('/',function(req,res,next){
  delete req.session.user_id;
  res.redirect('/PHH_Bookmark/login');
});

module.exports = router;
