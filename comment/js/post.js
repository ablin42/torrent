$(document).ready(function(){
$('#submit_comment').on('submit', function(e){
  let content = $('#content').val();
  let user = $('#username').val();
       e.preventDefault();
       $.ajax({
           url: '/addcomment',
           method: 'POST',
           contentType: 'application/json',
           data: JSON.stringify({"content": content, "creator": user}),//use userid
           success: function(html) {
              //alert('data sent!');
           }
       });
       return false;
   });
})
