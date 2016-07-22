var express = require('express');
var router = express.Router();
var multer = require('multer');
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  res.render('myProfileEdit.ejs');
});

module.exports = router;
