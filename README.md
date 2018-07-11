# ProjectOne
# Moodify

https://danielpruitt.github.io/Moodify/

This is an app that reads the mood of the user and returns playlists based of the user's mood. 
APIs used:
Imgur - take the snapshot photo to post to imgur and then return the imgur url
Kairos- facial recognition software, uses the face image url from imgur and returns an object of different moods
Spotify- after sorting the moods from Kairos, the emotion with the highest value is used to return Spotify playlists    
    the Spotify playlists shows the playlist art cover, a link to open the Spotify page or app(if on mobile), and clicking the album art will trigger the embeded player


Firebase:
We are logging the max emotion from Kairos and the timestamp of that emotion in Firebase which also appends to the page to show what recent users(5) have had for their mood. 

Alternate if camera permissions is denied or not available:
We have added a search feature to search moods if there is no access to the camera. It functions as a failsafe and as a way to expand the paramaters of the Spotify API usage. 

Collabators: Richard Covington, Andrew Park, Abram Arruda, Daniel Pruitt 



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
extra imgur key:
client: 6018dc86b1d9cf7 
secret: 18d31234b612243a1ec3d6bad20c44a371143f86



