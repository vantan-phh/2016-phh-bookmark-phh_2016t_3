var express = require('express'),
app = express();
var logger = require('morgan');
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : `test`
});
var bodyParser = require('body-parser');

app.set('views', __dirname + '/PHH_Bookmark');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/PHH_Bookmark/test');
app.set('view engine', 'ejs');



//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));
app.use(express.static(__dirname + '/PHH_Bookmark'));
app.use(express.static(__dirname + '/PHH_Bookmark/test'));
app.use(express.static(__dirname + '/index'));
app.use(function(req,res,next){
  console.log('my custom middleware!');
  next();
});

app.get('/',function(req,res){
  res.send('hello world');
});

app.get('/PHH_Bookmark',function(req,res){
  res.render('index.ejs');
});
app.post('/join', function(req,res){
  var eMail = req.body.email;
  var userName = req.body.user_name;
  var password = req.body.password;
  var query = "INSERT INTO `users(test)` (`address`,`user`,`password`) VALUES(?, ?, ?)";
  connection.query(query,[eMail,userName,password],function(err,rows){
    res.redirect('/test');
  });
});

app.get('/PHH_Bookmark/test',function(req,res){
  var a = 1;
  var query = 'SELECT * FROM `my_bookmarks` WHERE `id` = ?';
  // var q_title = 'SELECT `title` FROM `my_bookmarks` WHERE `id` = ?';
  // var q_comment = 'SELECT `comment` FROM `my_bookmarks` WHERE `id` = ?';
  // var title = connection.query(q_title,[a]);
  // var comment = connection.query(q_comment,[a]);
  connection.query(query,[a],function(err,rows){
    res.render('test.ejs',{
      list : rows
    });
  });
});
app.post('/submit',function(req,res){
  var newBookmark = req.body.new_bookmark;
  var newBookmarkTitle = req.body.title;
  var newBookmarkComment = req.body.comment;
  var query = "INSERT INTO `my_bookmarks` (`my_bookmark`,`comment`,`title`) VALUES(?, ? ,?)";
  connection.query(query,[newBookmark,newBookmarkComment,newBookmarkTitle],function(err,rows){
    res.redirect('/PHH_Bookmark/test');
  })
})


// app.get('/users/:name?',function(req,res){
//   if(req.params.name){
//     res.send('hello,' + req.params.name);
//   }else{
//     res.send('hello,nobody!');
//   }
// });
//
// app.get('/items/:id([0-9]+)',function(req,res){
//   res.send('item no: ' + req.params.id);
// });


app.listen(3000);
console.log("server starting...");
