let page = 1;

function loadMore(e){
  e.preventDefault();
  page++;
  fetch(`http://localhost:8089/api/torrents/search/game+of+thrones/${page}`, {
      method: 'get',
      mode: 'same-origin',
      headers: {'Content-Type': 'application/json' }, //sent
    })
    .then((res) => res.text())
    .then((data) => {
        document.getElementById('result-container').innerHTML += data;
      })
      console.log(test);
}
