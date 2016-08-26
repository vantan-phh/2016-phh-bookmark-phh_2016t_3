var connection = require('mysql-promise')();

connection.configure({
  host : 'localhost',
  user : 'root',
  database : 'phh_social_bookmark_proto',
});

module.exports = connection;
