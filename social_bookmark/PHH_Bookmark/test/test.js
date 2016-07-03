$(function(){

  var $organization = $('#organization');
  var $myBookmark = $('#my-bookmark');
  var $search = $('#search');
  var $submit = $('#submit');
  var $url = $('#url');
  var $name = $('#name');
  var $title = $('#title');

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

  $submit.click(function(){
    var url = $url.val();
    var title = $title.val();
    if(url === '' || title === ''){
      alert("なんか入れて");
    }else{
      //ブックマークはユーザー情報と関連付けてDBに保存？
      //そのあとDBからブックマーク情報を読み取って表示？
    }
  });
});
