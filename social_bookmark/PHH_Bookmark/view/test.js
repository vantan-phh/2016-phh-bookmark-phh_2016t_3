$(function(){

  var $organization = $('#organization');
  var $myBookmark = $('#my-bookmark');
  var $search = $('#search');
  var $submitURL = $('#submit-URL');
  var $url = $('#url');
  var $name = $('#name');
//  var $title = $('#title');

  var testArr = ['1','2','3','4'];
  var testOrganization = 'PHH';

  window.onresize = window_load;
  function window_load(){
    var width = window.innerWidth - 170;
    console.log(width);
    $search.css({
      position:'absolute',
      left:width
    });
  }

  function getTitle(url,callback){
    var xhr=new XMLHttpRequest();
    xhr.onload = function() {
      var title=this.responseXML.title||"no title";
      callback(url,title);
    }
    xhr.open("GET", url ,true);
    xhr.responseType="document";
    xhr.send();
  }

  window_load();

  // for(var i = 0; i < testArr.length; i++){
  //   var $check = $('<input type="checkbox">');
  //   var $del = $('<button>削除</button>');
  //   var $edit = $('<button>編集</button>');
  //   $myBookmark.append($check);
  //   $myBookmark.append(testArr[i]);
  //   $myBookmark.append($del);
  //   $myBookmark.append($edit);
  //   $myBookmark.append('<br>');
  // }
  $organization.html(testOrganization);

  $submitURL.click(function(){
    var checkurl = $url.val();
    if(url === '' ){
      alert("なんか入れて");
    }else{
      getTitle(checkUrl, function(url, title) {
        var $title = $('<input type="text" value=' + title + '>');
      });
    }
  });
});
