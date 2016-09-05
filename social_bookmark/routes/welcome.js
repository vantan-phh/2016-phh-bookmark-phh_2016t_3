var express = require('express');

var router = express.Router();

router.get('/', (req, res) => {
  if(req.session.user_id){
    res.redirect('/PHH_Bookmark/topPage');
  }else{
    res.render('welcome.ejs');
  }
});

module.exports = router;
