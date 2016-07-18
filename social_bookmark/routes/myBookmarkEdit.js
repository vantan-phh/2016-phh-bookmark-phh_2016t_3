var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  console.log(req.session.url);
  res.render('myBookmarkEdit.ejs');
});
router.post('/',function(req,res){

});

module.exports = router;
