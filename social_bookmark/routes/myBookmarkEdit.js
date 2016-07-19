var express = require('express');
var client = require('cheerio-httpcli');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/',function(req,res){
  var checkUrl = req.session.url;
  checkUrl.toString();
  client.fetch(checkUrl).then(function (result) {
    res.render('myBookmarkEdit.ejs',{
      title : result.$('title').text()
    });
  });
});
router.post('/',function(req,res){

});

module.exports = router;
