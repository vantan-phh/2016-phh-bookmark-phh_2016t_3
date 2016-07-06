var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : `social_bookmark`
});

module.exports = connection;
