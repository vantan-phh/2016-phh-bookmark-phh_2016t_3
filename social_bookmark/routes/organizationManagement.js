var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');
var multer = require('multer');
var upload = multer({dest:'./PHH_Bookmark/view/img/uploads/'});
var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dy4f7hul5',
  api_key: '925664739655858',
  api_secret: 'sbP8YsyWrhbf-vyZDsq4-6Izd_8'
});

router.get('/',function(req,res){
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  var checkAuthority = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
  connection.query(checkAuthority,[myId,orgId],function(err,result){
    if(result.length > 0){
      if(result[0].is_admin === 1){
        var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ?';
        connection.query(selectOrgData,[orgId],function(err,result){
          var orgName = result[0].name;
          var orgIntroduction = result[0].introduction;
          var orgThumbnail = result[0].image_path;
          res.render('organizationManagement.ejs',{
            orgName : orgName,
            orgIntroduction : orgIntroduction,
            orgThumbnail : orgThumbnail
          });
        });
      } else { // the user is not an admin
        res.redirect('/PHH_Bookmark/organizationPage');
      }
    } else { // the user is not belong to the organization
      res.redirect('/PHH_Bookmark/topPage');
    }
  });
});

router.post('/',upload.single('image_file'),function(req,res){
  var orgId = req.session.org_id;
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var orgNameExists = 'SELECT `name` FROM `organizations` WHERE `name` = ?';
  connection.query(orgNameExists,[orgName],function(err,result){
    if(result.length === 0){
      if(req.file){
        var path = req.file.path;
        cloudinary.uploader.upload(path,function(result){
          var orgThumbnail = result.url;
          var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
          connection.query(updateOrgData,[orgName,orgIntroduction,orgThumbnail,orgId],function(err,result){
            res.redirect('/PHH_Bookmark/organizationPage');
          });
        });
      } else { // when any files weren't posted
        var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
        connection.query(selectFormerThumbnail,[orgId],function(err,result){
          var orgThumbnail = result[0].image_path;
          var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
          connection.query(updateOrgData,[orgName,orgIntroduction,orgThumbnail,orgId],function(err,result){
            res.redirect('/PHH_Bookmark/organizationPage');
          });
        });
      }
    } else { // when an organization its name is the same as the posted orgName is already exists
      var selectFormerOrgName = 'SELECT `name` FROM `organizations` WHERE `id` = ?';
      connection.query(selectFormerOrgName,[orgId],function(err,result){
        if(result.length === 1){ // when an organization that have the same name as posted name is identical to this organization
          if(req.file){
            var path = req.file.path;
            cloudinary.uploader.upload(path,function(result){
              var orgThumbnail = result.url;
              var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
              connection.query(updateOrgData,[orgName,orgIntroduction,orgThumbnail,orgId]);
              res.redirect('/PHH_Bookmark/organizationPage');
            });
          } else { // when any files weren't posted
            var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
            connection.query(selectFormerThumbnail,[orgId],function(err,result){
              var orgThumbnail = result[0].image_path;
              var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
              connection.query(updateOrgData,[orgName,orgIntroduction,orgThumbnail,orgId]);
              res.redirect('/PHH_Bookmark/organizationPage');
            });
          }
        } else { // when an organization that have the same name as posted name is different from this organization
          var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
          connection.query(selectFormerThumbnail,[orgId],function(err,result){
            var orgThumbnail = result[0].image_path;
            res.render('organizationManagement.ejs',{
              orgName : orgName,
              orgIntroduction : orgIntroduction,
              orgThumbnail : orgThumbnail,
              orgNameExists : 'その名前の組織は既に存在しています。'
            });
          });
        }
      });
    }
  });
});

module.exports = router;
