var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  res.render('organizationPage.ejs');
});

module.exports = router;
