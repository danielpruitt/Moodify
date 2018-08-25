// Initialize Firebase
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
//Materialize tabs will initiate when page loads
$(document).ready(function () {
    $('.tabs').tabs();
});



// References to all the element we will need.
var video = document.querySelector('#camera-stream'),
    start_camera = document.querySelector('#start-camera'),
    controls = document.querySelector('.controls'),
    take_photo_btn = document.querySelector('#take-photo'),
    delete_photo_btn = document.querySelector('#delete-photo'),
    download_photo_btn = document.querySelector('#download-photo'),
    error_message = document.querySelector('#error-message');




database.ref().on("value", function (snapshot) {

    // Log the value of the various properties
    var client_id = snapshot.val().client_id;

    var access_token;

    var client_id = snapshot.val().client_id;
    var client_secret = snapshot.val().client_secret;

    var imgur_id = snapshot.val().imgur_id;
    var kairos_id = snapshot.val().kairos_id;
    var kairos_key = snapshot.val().kairos_key;

    function generateAccessToken(cb) {
        $.ajax({
            url: 'https://cors-anywhere.herokuapp.com/https://accounts.spotify.com/api/token',
            method: "POST",
            data: {
                grant_type: "client_credentials"
            },
            headers: {

                //adds API key and API secret
                Authorization: "Basic " + btoa(client_id + ":" + client_secret)
            }
        }).then(res => {

            //grabs access token from response and stores in variable
            access_token = res.access_token;
            cb();

            //console logs error message
        }).catch(err => console.error(err));
    };

    function getArtist(playlist, cb) {
        $.ajax({
            method: 'GET',
            url: 'https://api.spotify.com/v1/search',
            data: {
                q: playlist,
                type: 'playlist'
            },
            headers: {
                //uses access token and adds it to authorization header
                Authorization: "Bearer " + access_token
            }

            //when catched, uses access token and use the getArtist function
        }).then(cb).catch(() => generateAccessToken(() => getArtist(playlist, cb)));
    };

    take_photo_btn.addEventListener("click", function (e) {

        e.preventDefault();

        //shows the loading animation
        $("#loading").removeClass("hide");

        //this variable will store the base 64 image source
        var snap = takeSnapshot();

        //this is to remove the unnessesary string in the beginnning to pass through API. This gives us the image in base64 string
        var base64Snap = snap.replace("data:image/png;base64,", '');

        // console.log(base64Snap);

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
                'Authorization': imgur_id
            },
            data: {
                image: base64Snap
            }
        }).then(data => {
            console.log(data)
            //gets imgur url
            var imgurUrl = data.data.link;
            console.log("IMGUR url: " + imgurUrl);

            ///Emotion analysis API. Uses imgur url as input along with API key and ID
            $.ajax({
                url: 'https://api.kairos.com/v2/media' + '?source=' + data.data.link,
                type: 'POST',
                headers: {
                    "Content-type": "application/json",
                    "app_id": kairos_id,
                    "app_key": kairos_key
                }
            }).done(function (response) {
                console.log(response);

                //emotion object
                var emote = response.frames[0].people[0];

                //reveals modal if there is no emotion object. This is to check if the picture is taken well or if there are no faces
                if (emote == undefined) {

                    //initiates and shows modal
                    $(document).ready(function () {
                        $('.modal').modal();
                        $(".modal").modal("open");
                    });

                    //hides the loading animation
                    $("#loading").addClass("hide");

                    return
                }
                else {

                    //Object of the 6 emotions with values for each: anger, disgust, fear, joy, sadness, and surprise. 
                    var kairosEmotion = response.frames[0].people[0].emotions;

                    //this is to check if all values are 0. 
                    if (kairosEmotion.anger === 0 && kairosEmotion.disgust === 0 && kairosEmotion.fear === 0 && kairosEmotion.joy === 0 && kairosEmotion.sadness === 0 && kairosEmotion.surprise === 0) {
                        maxEmotion = "neutral";
                    }
                    else {
                        var emotionSorted = Object.keys(kairosEmotion).sort(function (a, b) { return kairosEmotion[a] - kairosEmotion[b] });
                        var maxEmotion = emotionSorted[5];
                    };
                };



                $("#photoMood").text("You current mood is " + maxEmotion);


                ///gets artist and creates carousel and Spotify iframe
                getArtist(maxEmotion, function (data) {

                    var playlistArray = data.playlists.items;

                    //emptys div to prevent more additions
                    $("#musicEmotion").empty();

                    //gets all the spotify playlist and puts them in the carousel
                    for (var i = 0; i < playlistArray.length; i++) {

                        var musicEmotion = $("#musicEmotion");

                        //creates div for each item in carousel
                        var linkDiv = $("<div class='carousel-item'>");
                        var allLists = data.playlists.items[i].external_urls.spotify;

                        var img = data.playlists.items[i].images[0].url;

                        //adds playlist art
                        var playArt = $("<img>");
                        playArt.attr("src", img);
                        playArt.addClass("album")

                        var playName = data.playlists.items[i].name;
                        var playlistTitle = $("<a>").prepend(playName);

                        playlistTitle.attr("href", allLists);
                        playlistTitle.attr("target", "blank");

                        linkDiv.append(playlistTitle);
                        linkDiv.append(playArt);

                        $("#exportedMood").text("Your " + maxEmotion + " playlists are here! ");


                        //adding the page animation when loaded
                        document.getElementById("myDiv").style.display = "block";
                        document.getElementById("loadedPlayer").style.display = "block";

                        //adding to the webplayer
                        var uri = "https://open.spotify.com/embed?uri=" + data.playlists.items[i].uri;

                        playArt.attr("value", uri);

                        $("#userInputMood").val('');

                        musicEmotion.append(linkDiv);

                        //carousel initiate
                        $("#musicEmotion").ready(function () {
                            $('.carousel').carousel();
                        });

                    }

                });

                //removes loading circle when everything is done
                $("#loading").addClass("hide");

                //Another Imgur ajax to delete the uploaded image
                $.ajax({
                    url: 'https://api.imgur.com/3/image/' + imgurDelete,
                    type: 'DELETE',
                    headers: {
                        'Authorization': keys.imgur_id
                    }
                }).then(data => {

                    console.log("Image deleted from Imgur");

                });

            });
        }).catch(err => console.log(err));

        // Enable delete and save buttons
        delete_photo_btn.classList.remove("disabled");
        download_photo_btn.classList.remove("disabled");

    });


    //function for submit earch button
    $("#submitEmotion").on("click", function (event) {
        event.preventDefault();

        //input from form
        var submittedMood = $("#userInputMood").val().trim();

        //checks if there is any blanks
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

                    playArt.attr("value", uri);


                    $("#userInputMood").val('');

                    musicEmotion.append(linkDiv);

                    $("#musicEmotion").ready(function () {
                        $('.carousel').carousel();
                    });

                    $("#loading").addClass("hide");

                };

            });
        }

    });

});


// The getUserMedia interface is used for handling camera input.
// Some browsers need a prefix so here we're covering all the options
navigator.getMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
);


//Shows the camera and the buttons
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
};


function displayErrorMessage(error_msg, error) {
    error = error || "";
    if (error) {
        console.error(error);
    }

    error_message.innerText = error_msg;

    hideUI();
    error_message.classList.add("visible");
};

function hideUI() {
    // Helper function for clearing the app UI.

    controls.classList.remove("visible");
    start_camera.classList.remove("visible");
    video.classList.remove("visible");
    error_message.classList.remove("visible");
};

//Access token for Spotify


//Gets artist from Spotify


//error message for when browser doesn't support the media interface
if (!navigator.getMedia) {
    displayErrorMessage("Your browser doesn't have support for the navigator.getUserMedia interface.");

}

//gets the camera to display on the div
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


//click function for when modal appears on screen. Hides modal and remove the loading animation
$("#returnPage").on("click", function () {
    $(".modal").hide();
    $("#loading").addClass("hide");
});



// Mobile browsers cannot play video without user input,
// so here we're using a button to start it manually.
//not sure if this is nessesary, but just in case. 
start_camera.addEventListener("click", function (e) {

    e.preventDefault();

    // Start video playback manually.
    video.play();
    showVideo();

});


/////////END OF TAKE SNAPSHOT CLICK HERE//////////



//button deletes photo and restarts camerea
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

//Event click function for DOM playlist art when created from submit or snapshot button
$(document).on("click", "img", clicky);
