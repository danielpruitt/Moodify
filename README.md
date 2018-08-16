# Moodify

https://apark5040.github.io/Moodify/
or
https://danielpruitt.github.io/Moodify/

## Overview
This is a front-end app that reads the mood of the user and returns playlists based of the user's mood using APIs. 


![Moodify_01](assets/images/moodify_01.png)



APIs used:

**Imgur - https://apidocs.imgur.com/**
Uploads the snapshot photo to imgur and then returns the imgur url. Once the process is finished, it will delete the image from Imgur.

**Kairos - https://www.kairos.com/docs/api/**
Facial recognition software which uses the snapshot image url from imgur and returns an object of different moods.

**Spotify - https://developer.spotify.com/documentation/web-api/**
After sorting the moods from Kairos, the emotion with the highest value is used to return Spotify playlists.  

The Spotify playlists shows the playlist art cover, a link to open the Spotify page or app(if on mobile), and clicking the album art will trigger the embeded player.


Collabators: Richard Covington, Abram Arruda, Andrew Park, Daniel Pruitt 







