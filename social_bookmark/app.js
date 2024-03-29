var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var path = require('path');

var topPage = require('./routes/topPage');
var createAccount = require('./routes/createAccount');
var login = require('./routes/login');
var setUser = require('./routes/setUser');
var logout = require('./routes/logout');
var myPage = require('./routes/myPage');
var myBookmarkEdit = require('./routes/myBookmarkEdit');
var myProfile = require('./routes/myProfile');
var myProfileEdit = require('./routes/myProfileEdit');
var organizationPage = require('./routes/organizationPage');
var createOrganization = require('./routes/createOrganization');
var orgBookmarkEdit = require('./routes/orgBookmarkEdit');
var membersManagement = require('./routes/membersManagement');
var bookmarkPage = require('./routes/bookmarkPage');
var submitBookmarkData = require('./routes/submitBookmarkData');
var switchAuthority = require('./routes/switchAuthority');
var organizationManagement = require('./routes/organizationManagement');
var organizationMembers = require('./routes/organizationMembers');
var accountSetting = require('./routes/accountSetting');
var otherProfile = require('./routes/otherProfile');
var welcome = require('./routes/welcome');
var left = require('./routes/left');
var error = require('./routes/error');

var app = express();

var logger = require('morgan');

var options = {
  host : 'localhost',
  port : 3306,
  user : 'root',
  database : 'phh_social_bookmark_proto',
  createDatabaseTable : true,
  schema : {
    tableName : 'sessions',
    columnNames : {
      session_id : 'session_id',
      expires : 'expires',
      data : 'data',
    },
  },
};
var sessionStore = new MySQLStore(options);


app.set('views', path.join(__dirname + '/PHH_Bookmark/view'));
app.set('view engine', 'ejs');

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.use(logger('dev'));
app.use(express.static(__dirname + '/PHH_Bookmark/view'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret : 'keyboard cat',
  store : sessionStore,
  resave : false,
  saveUninitialized : false,
  cookie : {
    maxAge : 30 * 24 * 60 * 60 * 1000, // for 30 days
  },
}));

app.use('/PHH_Bookmark', welcome);
app.use('/PHH_Bookmark/createAccount', createAccount);
app.use('/PHH_Bookmark/topPage', setUser, topPage);
app.use('/PHH_Bookmark/login', login);
app.use('/PHH_Bookmark/logout', setUser, logout);
app.use('/PHH_Bookmark/myPage', setUser, myPage);
app.use('/PHH_Bookmark/myBookmarkEdit', setUser, myBookmarkEdit);
app.use('/PHH_Bookmark/myProfile', setUser, myProfile);
app.use('/PHH_Bookmark/myProfileEdit', setUser, myProfileEdit);
app.use('/PHH_Bookmark/organizationPage', setUser, organizationPage);
app.use('/PHH_Bookmark/createOrganization', setUser, createOrganization);
app.use('/PHH_Bookmark/orgBookmarkEdit', setUser, orgBookmarkEdit);
app.use('/PHH_Bookmark/membersManagement', setUser, membersManagement);
app.use('/PHH_Bookmark/bookmarkPage', setUser, bookmarkPage);
app.use('/PHH_Bookmark/submitBookmarkData', setUser, submitBookmarkData);
app.use('/PHH_Bookmark/switchAuthority', setUser, switchAuthority);
app.use('/PHH_Bookmark/organizationManagement', setUser, organizationManagement);
app.use('/PHH_Bookmark/organizationMembers', setUser, organizationMembers);
app.use('/PHH_Bookmark/accountSetting', setUser, accountSetting);
app.use('/PHH_Bookmark/otherProfile', setUser, otherProfile);
app.use('/PHH_Bookmark/left', left);

app.use(setUser, (req, res) => {
  res.render('errorPage.ejs');
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
console.log('server starting...');
