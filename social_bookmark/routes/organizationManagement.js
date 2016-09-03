var express = require('express');

var router = express.Router();
var connection = require('../mysqlConnection');
var multer = require('multer');

var upload = multer({ dest : './PHH_Bookmark/view/img/uploads/' });
var cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name : 'dy4f7hul5',
  api_key : '925664739655858',
  api_secret : 'sbP8YsyWrhbf-vyZDsq4-6Izd_8',
});

router.get('/', (req, res) => {
  var orgId = req.session.org_id;
  var myId = req.session.user_id;
  (() => {
    var promise = new Promise((resolve) => {
      var checkAuthority = 'SELECT `is_admin` FROM `organization_memberships` WHERE `user_id` = ? AND `org_id` = ?';
      connection.query(checkAuthority, [myId, orgId]).then((result) => {
        if(result[0].length > 0){
          resolve(result[0][0].is_admin);
        }else{
          res.redirect('/PHH_Bookmark/topPage');
        }
      });
    });
    return promise;
  })().then((value) => {
    var promise = new Promise((resolve) => {
      if(value === 1){
        var selectOrgData = 'SELECT * FROM `organizations` WHERE `id` = ?';
        connection.query(selectOrgData, [orgId]).then((result) => {
          var orgName = result[0][0].name;
          var orgIntroduction = result[0][0].introduction;
          var orgThumbnail = result[0][0].image_path;
          var values = {
            orgName,
            orgIntroduction,
            orgThumbnail,
          };
          resolve(values);
        });
      }else{
        res.redirect('/PHH_Bookmark/organizationPage');
      }
    });
    return promise;
  }).then((values) => {
    var orgName = values.orgName;
    var orgIntroduction = values.orgIntroduction;
    var orgThumbnail = values.orgThumbnail;
    res.render('organizationManagement.ejs', {
      orgName,
      orgIntroduction,
      orgThumbnail,
    });
  });
});

router.post('/', upload.single('image_file'), (req, res) => {
  var orgId = req.session.org_id;
  var orgName = req.body.orgName;
  var orgIntroduction = req.body.orgIntroduction;
  var checkInjection = /[%;+-]+/g;
  var checkSpace = /[\S]+/g;
  (() => {
    var promise = new Promise((resolve) => {
      if(checkSpace.test(orgName)){
        resolve();
      }else{
        var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
        connection.query(selectFormerThumbnail, [orgId]).then((result) => {
          var orgThumbnail = result[0][0].image_path;
          res.render('organizationManagement.ejs', {
            orgName,
            orgIntroduction,
            orgThumbnail,
            orgNameNotice : '組織名を入力してください',
          });
        });
      }
    });
    return promise;
  })().then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(orgIntroduction)){
        resolve();
      }else{
        var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
        connection.query(selectFormerThumbnail, [orgId]).then((result) => {
          var orgThumbnail = result[0][0].image_path;
          res.render('organizationManagement.ejs', {
            orgName,
            orgIntroduction,
            orgThumbnail,
            orgIntroductionNotice : 'セキュリティ上の観点から紹介文に「+, -, %, ;」は使えません',
          });
        });
      }
    });
    return promise;
  }).then(() => {
    var promise = new Promise((resolve) => {
      if(!checkInjection.test(orgName)){
        resolve();
      }else{
        var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
        connection.query(selectFormerThumbnail, [orgId]).then((result) => {
          var orgThumbnail = result[0][0].image_path;
          res.render('organizationManagement.ejs', {
            orgName,
            orgIntroduction,
            orgThumbnail,
            orgNameNotice : 'セキュリティ上の観点から組織名に「+, -, %, ;」は使えません',
          });
        });
      }
    });
    return promise;
  }).then(() => {
    var orgNameExists = 'SELECT `name` FROM `organizations` WHERE `name` = ?';
    connection.query(orgNameExists, [orgName]).then((result) => {
      if(result[0].length === 0){
        if(req.file){
          (() => {
            var promise = new Promise((resolve) => {
              var path = req.file.path;
              cloudinary.uploader.upload(path, (cloudinaryResult) => {
                var orgThumbnail = cloudinaryResult.url;
                if(orgThumbnail === undefined){
                  res.render('organizationManagement.ejs', {
                    orgName,
                    orgIntroduction,
                    thumbailNotice : '画像ファイルが正しく読み込めませんでした。',
                  });
                }else{
                  resolve(orgThumbnail);
                }
              });
            });
            return promise;
          })().then((value) => {
            var orgThumbnail = value;
            var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
            connection.query(updateOrgData, [orgName, orgIntroduction, orgThumbnail, orgId]).then(() => {
              res.redirect('/PHH_Bookmark/organizationPage');
            });
          });
        }else{
          (() => {
            var promise = new Promise((resolve) => {
              var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
              connection.query(selectFormerThumbnail, [orgId]).then((result2) => {
                var orgThumbnail = result2[0][0].image_path;
                resolve(orgThumbnail);
              });
            });
            return promise;
          })().then((value) => {
            var orgThumbnail = value;
            var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
            connection.query(updateOrgData, [orgName, orgIntroduction, orgThumbnail, orgId]).then(() => {
              res.redirect('/PHH_Bookmark/organizationPage');
            });
          });
        }
      }else{
        var selectFormerOrgName = 'SELECT `name` FROM `organizations` WHERE `id` = ?';
        connection.query(selectFormerOrgName, [orgId]).then((result2) => {
          if(result2[0][0].name === orgName){
            if(req.file){
              (() => {
                var promise = new Promise((resolve) => {
                  var path = req.file.path;
                  cloudinary.uploader.upload(path, (cloudinaryResult) => {
                    var orgThumbnail = cloudinaryResult.url;
                    if(orgThumbnail === undefined){
                      res.render('organizationManagement.ejs', {
                        orgName,
                        orgIntroduction,
                        thumbailNotice : '画像ファイルが正しく読み込めませんでした。',
                      });
                    }else{
                      resolve(orgThumbnail);
                    }
                  });
                });
                return promise;
              })().then((value) => {
                var orgThumbnail = value;
                var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
                connection.query(updateOrgData, [orgName, orgIntroduction, orgThumbnail, orgId]).then(() => {
                  res.redirect('/PHH_Bookmark/organizationPage');
                });
              });
            }else{
              (() => {
                var promise = new Promise((resolve) => {
                  var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
                  connection.query(selectFormerThumbnail, [orgId]).then((result3) => {
                    var orgThumbnail = result3[0][0].image_path;
                    resolve(orgThumbnail);
                  });
                });
                return promise;
              })().then((value) => {
                var orgThumbnail = value;
                var updateOrgData = 'UPDATE `organizations` SET `name` = ?, `introduction` = ?, `image_path` = ? WHERE `id` = ?';
                connection.query(updateOrgData, [orgName, orgIntroduction, orgThumbnail, orgId]).then(() => {
                  res.redirect('/PHH_Bookmark/organizationPage');
                });
              });
            }
          }else{
            var selectFormerThumbnail = 'SELECT `image_path` FROM `organizations` WHERE `id` = ?';
            connection.query(selectFormerThumbnail, [orgId]).then((result3) => {
              var orgThumbnail = result3[0][0].image_path;
              res.render('organizationManagement.ejs', {
                orgName,
                orgIntroduction,
                orgThumbnail,
                orgNameNotice : 'その名前の組織は既に存在しています。',
              });
            });
          }
        });
      }
    });
  });
});

router.post('/dissolve', (req, res) => {
  var orgId = req.session.orgId;
  var dissolve = 'DELETE FROM `organizations` WHERE `id` = ?';
  connection.query(dissolve, [orgId]).then(() => {
    res.redirect('/PHH_Bookmark/topPage');
  });
});

module.exports = router;
