$(function(){
  var myBookmarks = document.my_bookmark.elements;
  var $checkbox = $('.checkbox');
  console.log(document.my_bookmark.elements);
  $("#kurukuru").click(function(){
    var limit = myBookmarks.length;
    for(var i = 0; i < limit - 1; i++){
      //console.log($checkbox.elements[i].checked === true);
      if(document.my_bookmark.elements[i].checked === true){
        document.my_bookmark.elements[i].parentNode.parentNode.removeChild(document.my_bookmark.elements[i].parentNode)
      }
    console.log(i);
    }
  });
});
