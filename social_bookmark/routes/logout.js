var express = require('express');

var router = express.Router();

router.get('/', (req, res) => {
  delete req.session.user_id;
  res.render('logout.ejs');
});

module.exports = router;
