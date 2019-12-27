# torrent
> - This is part of 42's last web project from main branch: Hypertube
> - PDF here (https://github.com/ablin42/torrent/blob/master/hypertube.pdf)

### Objectives
> - Create a web app allowing users to search and watch videos
> - Video playing will be integrated to the website, and they will be downloaded through BitTorrent protocol
> - Use multiple sources for finding torrents
> - Once a video is picked, it will be downloaded to the server and streamed on the video player at the same time

### Instructions
#### User
> - User can Sign up/Log in/Log out (email, password, name, profile picture)
> - Omniauth
> - Mailing
> - Select prefered language
> - Modify his informations
> - See other users' profiles

#### Library 
> - Search field
> - Thumbnails list
> - Multiple sources for torrent searching
> - Videos only
> - Search results must be displayed as thumbnails with infos, sorted by name
> - If no research has been done, show most popular torrents
> - Display at least: Video name/IMDB grade/Year/Picture
> - Differenciate seen and unseen videos
> - List must be paginated
> - List must be sortable (grade/year/name/seeders/leechers...)

#### Videos
> - Display videos informations (synopsis, casting, year, length, grade, etc...)
> - User can comment under videos
> - Video player
> - Download and stream torrent at the same time, stream only if the torrent already exists in the database
> - Downloaded torrents must be saved on the server, if it hasn't been used in a month, delete it
> - Subtitles must be available
> - Convert video if it is not natively playable

### Restrictions
> - Any frameworks as long as it doesn't create a video flux from a torrent (webtorrent, pulsar, peerflix..)
> - Compatible chrome and firefox
> - Responsive
> - Forms MUST have proper validation
> - Website must be entirely SECURE

### Bonuses
> - More omniauth strategies
> - Restful API

##### This is an API that fetch torrents based either on name, genre, or ranking from different torrent providers:
###### Depending on movie, subtitles are also available...

> - 1337x
> - yts
> - Popcorntime
> - All at the same time
