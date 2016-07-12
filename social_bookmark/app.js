var express = require('express');
var session = require('express-session');
var path = require('path');

var topPage = require('./routes/topPage.js');
//var users = require('./routes/users.js');
var createAccount = require('./routes/createAccount.js');
var login = require('./routes/login.js');

var app = express();

var logger = require('morgan');

var bodyParser = require('body-parser');

app.set('views', path.join(__dirname + '/PHH_Bookmark/view'));
app.set('view engine', 'ejs');

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));
//app.use(express.static(__dirname + '/PHH_Bookmark'));
app.use(express.static(__dirname + '/PHH_Bookmark/view'));
// app.use(express.static(path.join(__dirname,'public')));
// app.use(session({
//   secret: 'keyboard cat',
//   resave: false,
//   saveUninitialized: true
// }));
app.use('/PHH_Bookmark',createAccount);
app.use('/PHH_Bookmark/topPage',topPage);
app.use('/PHH_Bookmark/login',login);
app.use(function(req,res,next){
  console.log('my custom middleware!');
  next();
});


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
