document.addEventListener('DOMContentLoaded', function () {

    //Initizializing Firebase from Daniel
    var config = {
        apiKey: "AIzaSyBeZWPAnK0TAohDy9esl8V1_VCrcGB5lRM",
        authDomain: "moodify-3d415.firebaseapp.com",
        databaseURL: "https://moodify-3d415.firebaseio.com",
        projectId: "moodify-3d415",
        storageBucket: "moodify-3d415.appspot.com",
        messagingSenderId: "854313353749"
    };
    firebase.initializeApp(config);
    var database = firebase.database();


    // References to all the element we will need.
    var video = document.querySelector('#camera-stream'),
        image = document.querySelector('#snap'),
        start_camera = document.querySelector('#start-camera'),
        controls = document.querySelector('.controls'),
        take_photo_btn = document.querySelector('#take-photo'),
        delete_photo_btn = document.querySelector('#delete-photo'),
        download_photo_btn = document.querySelector('#download-photo'),
        error_message = document.querySelector('#error-message');


    // The getUserMedia interface is used for handling camera input.
    // Some browsers need a prefix so here we're covering all the options
    navigator.getMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
    );

    function takeSnapshot() {
        // Here we're using a trick that involves a hidden canvas element.  

        var hidden_canvas = document.querySelector('canvas'),
            context = hidden_canvas.getContext('2d');

        var width = video.videoWidth,
            height = video.videoHeight;

        if (width && height) {

            // Setup a canvas with the same dimensions as the video.
            hidden_canvas.width = width;
            hidden_canvas.height = height;

            // Make a copy of the current frame in the video on the canvas.
            context.drawImage(video, 0, 0, width, height);

            // Turn the canvas image into a dataURL that can be used as a src for our photo.
            return hidden_canvas.toDataURL('image/png');
        }
    }


    function displayErrorMessage(error_msg, error) {
        error = error || "";
        if (error) {
            console.error(error);
        }

        error_message.innerText = error_msg;

        hideUI();
        error_message.classList.add("visible");
    }
    function showVideo() {
        hideUI();
        video.classList.add("visible");
        controls.classList.add("visible");
    }

    function hideUI() {
        // Helper function for clearing the app UI.

        controls.classList.remove("visible");
        start_camera.classList.remove("visible");
        video.classList.remove("visible");
        // snap.classList.remove("visible");
        error_message.classList.remove("visible");
    }


    if (!navigator.getMedia) {
        displayErrorMessage("Your browser doesn't have support for the navigator.getUserMedia interface.");
    }
    else {
        // Request the camera.
        navigator.getMedia(
            {
                video: true
            },
            // Success Callback
            function (stream) {

                // Create an object URL for the video stream and
                // set it as src of our HTLM video element.
                video.src = window.URL.createObjectURL(stream);

                // Play the video element to start the stream.
                video.play();
                video.onplay = function () {
                    showVideo();
                };

            },
            // Error Callback
            function (err) {
                displayErrorMessage("There was an error with accessing the camera stream: " + err.name, err);
            }
        );
    }



    // Mobile browsers cannot play video without user input,
    // so here we're using a button to start it manually.
    start_camera.addEventListener("click", function (e) {

        e.preventDefault();

        // Start video playback manually.
        video.play();
        showVideo();

    });


    take_photo_btn.addEventListener("click", function (e) {

        e.preventDefault();

        $("#camera-stream").addClass("hide");

        //this variable will store the base 64 image source
        var snap = takeSnapshot();

        //this is to remove the unnessesary string in the beginnning to pass through API. This gives us the image in base64 string
        var base64Snap = snap.replace("data:image/png;base64,", '');

        // Show image. 
        image.setAttribute('src', snap);
        image.classList.add("visible");

        // Enable delete and save buttons
        delete_photo_btn.classList.remove("disabled");
        download_photo_btn.classList.remove("disabled");

        // Set the href attribute of the download button to the snap url.
        download_photo_btn.href = snap;

        // Pause video playback of stream. Comment it to keep video playing even after taking snapshot
        video.pause();

        ///////////////////////////
        //API CALLS///
        //////////////////////////////////////////////////

        ////Imgur API used to convert base64 to a usable image url
        $.ajax({
            url: 'https://api.imgur.com/3/image',
            type: 'POST',
            headers: {
                'Authorization': 'Client-ID c98e83d1fb7401a'
            },
            data: {
                image: base64Snap
            }
        }).then(data => {
            //Console logs imgur url of snapshot
            console.log(data.data.link);
            var imgurUrl = data.data.link;
            console.log(imgurUrl);
            ///Emotion analysis API
            $.ajax({
                url: 'https://api.kairos.com/v2/media' + '?source=' + data.data.link,
                type: 'POST',
                headers: {
                    "Content-type": "application/json",
                    "app_id": '5989e8db',
                    "app_key": 'f74c4a76f8186a5c54d2afbe34015740'
                }
            }).done(function (response) {
                //console logs array of emotions with values for each: Anger, disgust, fear, joy, sadness, suprise
                console.log(response.frames[0].people[0].emotions);
                var kairosEmotion = response.frames[0].people[0].emotions;
                database.ref().push({
                    emotion:kairosEmotion,
                    image:imgurUrl,
                    dateAdded:firebase.database.ServerValue.TIMESTAMP
                })
                
                
            });
        }).catch(err => console.log(err));


        ////////////////////////////////////////////////////
        // SPOTIFY API goes here 
        

    });
    /////////END OF TAKE SNAPSHOT CLICK HERE//////////
var client_id = '2752cb9f8d0940aeb25e5c564dd68a1e';
        var client_secret = '07c7345aa3c6424289bb28e7e27b919f';
        var access_token;

        var userMood;
        $("#submitEmotion").on("click", function (event){
            event.preventDefault();
            var submittedMood = $("#userInputMood").val().trim();
            console.log(submittedMood)

        function generateAccessToken(cb) {
            $.ajax({
                url: 'https://cors-anywhere.herokuapp.com/https://accounts.spotify.com/api/token',
                method: "POST",
                data: {
                    grant_type: "client_credentials"
                },
                headers: {
                    Authorization: "Basic " + btoa(client_id + ":" + client_secret)
                }
            }).then(res => {
                access_token = res.access_token;
                cb();
            }).catch(err => console.error(err));
        }

        function getArtist(playlist, cb) {
            $.ajax({
                method: 'GET',
                url: 'https://api.spotify.com/v1/search',
                data: {
                    q: playlist,
                    type: 'playlist'
                },
                headers: {
                    Authorization: "Bearer " + access_token
                }
            }).then(cb).catch(() => generateAccessToken(() => getArtist(playlist, cb)));
        }

        getArtist(submittedMood, function (data) {
            // console.log(data);
            var playlistArray = data.playlists.items;

            for(var i=0; i < playlistArray.length; i++){
            var mood = playlistArray[i];

            var musicEmotion= $("#musicEmotion")
            var linkDiv = $("<div class= 'hoverable card-panel playlistContainer  '>");
            var allLists = data.playlists.items[i].external_urls.spotify;

            var img = data.playlists.items[i].images[0].url;
            console.log(img)
            var playArt = $("<img>");
            playArt.addClass("albumSize");
            playArt.attr("src", img);

            var playName = data.playlists.items[i].name;
            var playlistTitle = $("<p>").prepend(playName)

            var link = $("<a>").text(data.playlists.items[i].external_urls.spotify);
            link.attr("href", allLists);
            link.text("Go to playlist!");
            link.attr("target", "blank")
            linkDiv.append(playlistTitle);
            linkDiv.append(link);
            linkDiv.append(playArt);

            //adding to the webplayer
            
            var spotUser = data.playlists.items[i].owner.id;
            var spotPlaylist = data.playlists.items[i].id;
            // console.log("playlist id: " + spotPlaylist);
            // console.log("user id: " + spotUser)
            var playerLink = "https://open.spotify.com/embed?uri=spotify:user:" + spotUser + ":playlist:" + spotPlaylist;
            // console.log ("webplayer link: " + playerLink);
            
            $("#iframe").attr("src", playerLink)

            musicEmotion.prepend(linkDiv);
            }
        });


    delete_photo_btn.addEventListener("click", function (e) {

        e.preventDefault();

        // Hide image.
        image.setAttribute('src', "");
        image.classList.remove("visible");

        // Disable delete and save buttons
        delete_photo_btn.classList.add("disabled");
        download_photo_btn.classList.add("disabled");

        $("#camera-stream").removeClass("hide");

        // Resume playback of stream.
        video.play();

    });




    });
});