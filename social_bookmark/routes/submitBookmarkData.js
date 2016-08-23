var express = require('express');

var router = express.Router();

router.post('/', (req, res) => {
  var id = req.body.result;
  id = id.split('bookmarkId');
  id = id[1];
  req.session.bookmark_id = id;
  res.redirect('/PHH_Bookmark/bookmarkPage');
});
module.exports = router;
