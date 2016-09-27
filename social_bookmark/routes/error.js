var express = require('express');

var router = express.Router();

router.get('/', (req, res) => {
  res.render('errorPage.ejs');
});

module.exports = router;
