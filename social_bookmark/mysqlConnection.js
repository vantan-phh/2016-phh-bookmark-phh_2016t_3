var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : `phh_social_bookmark_proto`
});

module.exports = connection;
