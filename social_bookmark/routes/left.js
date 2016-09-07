var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', (req, res) => {
  res.render('left.ejs');
});

module.exports = router;
