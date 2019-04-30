function loadMore(e){
  e.preventDefault();

  fetch('http://localhost:8089/api/torrents/search/game+of+thrones/3', {
      method: 'get',
      mode: 'same-origin',
      headers: {'Content-Type': 'application/json' }, //sent
    })
    .then((res) => res.text())
    .then((data) => {
        document.getElementById('result-container').innerHTML += data;
      })
}
