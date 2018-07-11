document.addEventListener('DOMContentLoaded', function () {

    $(document).ready(function () {
        $('.tabs').tabs();
    });

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


    //Spotify API key and access token    
    var client_id = '2752cb9f8d0940aeb25e5c564dd68a1e';
    var client_secret = '07c7345aa3c6424289bb28e7e27b919f';
    var access_token;

    // The getUserMedia interface is used for handling camera input.
    // Some browsers need a prefix so here we're covering all the options
    navigator.getMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
    );

    //Firebase data retrieve
    database.ref().limitToLast(5).orderByChild("dateAdded").on("child_added", function (snapshot) {
        var sv = snapshot.val();

        console.log(sv.MaxEmotion);
        var time = moment(sv.dateAdded).format("MMM Do, YYYY hh:mm:ss")
        var newSearches = $("<p>");
        newSearches.append(sv.MaxEmotion + ": " + time);
        $("#firebaseSearches").prepend(newSearches);

    });

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

    function showVideo() {
        hideUI();
        video.classList.add("visible");
        controls.classList.add("visible");
    }

    function takeSnapshot() {
        // Here we're using a trick that involves a hidden canvas element.  

        var hidden_canvas = document.querySelector('canvas'),
            context = hidden_canvas.getContext('2d');
        take_photo_btn.classList.add("disabled");

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

    function hideUI() {
        // Helper function for clearing the app UI.

        controls.classList.remove("visible");
        start_camera.classList.remove("visible");
        video.classList.remove("visible");
        // snap.classList.remove("visible");
        error_message.classList.remove("visible");
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


    //Access token for Spotify
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
    };

    //Gets artist from Spotify
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
    };


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
                take_photo_btn.classList.add("disabled");
            }
        );
    }

    $("#returnPage").on("click", function(){
        $(".modal").hide();
        $("#loading").addClass("hide");
    });



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

        $("#loading").removeClass("hide");

        //this variable will store the base 64 image source
        var snap = takeSnapshot();

        //this is to remove the unnessesary string in the beginnning to pass through API. This gives us the image in base64 string
        var base64Snap = snap.replace("data:image/png;base64,", '');

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
            // console.log(data.data.link);
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
                console.log(response);

                var emote = response.frames[0].people[0];

                if (emote == undefined) {

                    $(document).ready(function () {
                        $('.modal').modal();
                        $(".modal").modal("open");
                    });

                    $("#loading").addClass("hide");

                    return
                }
                else {
                    var kairosEmotion = response.frames[0].people[0].emotions;

                    if (kairosEmotion.anger === 0 && kairosEmotion.disgust === 0 && kairosEmotion.fear === 0 && kairosEmotion.joy === 0 && kairosEmotion.sadness === 0 && kairosEmotion.surprise === 0) {
                        maxEmotion = "neutral";
                        console.log(maxEmotion);
                    }
                    else {
                        var emotionSorted = Object.keys(kairosEmotion).sort(function (a, b) { return kairosEmotion[a] - kairosEmotion[b] });
                        console.log(emotionSorted);
                        var maxEmotion = emotionSorted[5];
                        console.log(maxEmotion);
                    };
                }



                $("#photoMood").text("You current mood is " + maxEmotion);
                database.ref().push({
                    emotion: kairosEmotion,
                    MaxEmotion: maxEmotion,
                    dateAdded: firebase.database.ServerValue.TIMESTAMP


                });


                ///Spotify API call after Kairos API

                getArtist(maxEmotion, function (data) {
                    var playlistArray = data.playlists.items;

                    $("#musicEmotion").empty();

                    for (var i = 0; i < playlistArray.length; i++) {

                        var musicEmotion = $("#musicEmotion");

                        var linkDiv = $("<div class='carousel-item'>");
                        var allLists = data.playlists.items[i].external_urls.spotify;

                        var img = data.playlists.items[i].images[0].url;

                        var playArt = $("<img>");
                        playArt.attr("src", img);
                        playArt.addClass("album")

                        var playName = data.playlists.items[i].name;
                        var playlistTitle = $("<a>").prepend(playName);

                        playlistTitle.attr("href", allLists);
                        playlistTitle.attr("target", "blank");

                        // link.attr("href", allLists);
                        // link.text("Go to playlist!");
                        // link.attr("target", "blank");
                        linkDiv.append(playlistTitle);
                        // linkDiv.append(link);
                        linkDiv.append(playArt);

                        $("#exportedMood").text("Your " + maxEmotion + " playlists are here! ");


                        //adding the page animation when loaded
                        document.getElementById("myDiv").style.display = "block";
                        document.getElementById("loadedPlayer").style.display = "block";

                        //adding to the webplayer
                        var uri = "https://open.spotify.com/embed?uri=" + data.playlists.items[i].uri;
                        console.log(uri);

                        playArt.attr("value", uri);

                        $("#userInputMood").val('');

                        musicEmotion.append(linkDiv);

                        $("#musicEmotion").ready(function () {
                            $('.carousel').carousel(); //carousel init
                        });

                    }

                });

                //removes loading circle when everything is done
                $("#loading").addClass("hide");

            });
        }).catch(err => console.log(err));

        // Enable delete and save buttons
        delete_photo_btn.classList.remove("disabled");
        download_photo_btn.classList.remove("disabled");

    });
    /////////END OF TAKE SNAPSHOT CLICK HERE//////////

    ////////////////////////////////////////////////////
    // SPOTIFY API goes here 


    $("#submitEmotion").on("click", function (event) {
        event.preventDefault();



        var submittedMood = $("#userInputMood").val().trim();
        console.log(submittedMood);

        if (submittedMood === '') {
            return
        }
        else {
            $("#loading").removeClass("hide");

            $("#exportedMood").text("Your " + submittedMood + " playlists are here! ");

            getArtist(submittedMood, function (data) {
                var playlistArray = data.playlists.items;

                $("#musicEmotion").empty();

                for (var i = 0; i < playlistArray.length; i++) {

                    var musicEmotion = $("#musicEmotion");

                    var linkDiv = $("<div class='carousel-item'>");
                    var allLists = data.playlists.items[i].external_urls.spotify;

                    var img = data.playlists.items[i].images[0].url;

                    var playArt = $("<img>");
                    playArt.attr("src", img);
                    playArt.addClass("album")

                    var playName = data.playlists.items[i].name;
                    var playlistTitle = $("<a>").prepend(playName);

                    playlistTitle.attr("href", allLists);
                    playlistTitle.attr("target", "blank");

                    //appends title and artwork to page
                    linkDiv.append(playlistTitle);
                    linkDiv.append(playArt);

                    //adding the page animation when loaded
                    document.getElementById("myDiv").style.display = "block";
                    document.getElementById("loadedPlayer").style.display = "block";

                    var uri = "https://open.spotify.com/embed?uri=" + data.playlists.items[i].uri;
                    console.log(uri);

                    playArt.attr("value", uri);


                    $("#userInputMood").val('');

                    musicEmotion.append(linkDiv);

                    $("#musicEmotion").ready(function () {
                        $('.carousel').carousel(); //carousel init
                    });

                    $("#loading").addClass("hide");


                };

            });
        }




    });


    delete_photo_btn.addEventListener("click", function (e) {

        e.preventDefault();

        // Disable delete and save buttons
        delete_photo_btn.classList.add("disabled");
        download_photo_btn.classList.add("disabled");
        take_photo_btn.classList.remove("disabled");

        $("#camera-stream").removeClass("hide");

        // Resume playback of stream.
        video.play();

    });

    //adding to the webplayer
    function clicky() {
        var webLink = $(this).attr("value");
        $("#iframe").attr("src", webLink);
    };

    $(document).on("click", "img", clicky);
});