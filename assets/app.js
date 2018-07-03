// JS goes here

document.addEventListener('DOMContentLoaded', function () {

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

        //this variable will store the base 64 image source
        var snap = takeSnapshot();

        //this is to remove the unnessesary string in the beginnning to pass through API
        var base64Snap = snap.replace("data:image/png;base64,", '');

        //Kairos app key(API key)
        var appKey = "f74c4a76f8186a5c54d2afbe34015740";

        //Kairos app ID(*This is also required)
        var appID = "5989e8db";

        // Show image. 
        image.setAttribute('src', snap);
        image.classList.add("visible");

        // Enable delete and save buttons
        delete_photo_btn.classList.remove("disabled");
        download_photo_btn.classList.remove("disabled");

        // Set the href attribute of the download button to the snap url.
        download_photo_btn.href = snap;

        // Pause video playback of stream. Comment it to keep video playing even after taking snapshot
        // video.pause();

        /////////////////////////////////////////////
        //This is the code that retrieves JSOn object by passing through the authetication and required parameters
        //This is in the format of XMLHttpRequest, which is the regular form of .ajax. 
        //Later on, lets see if we can reformat this to an ajax function

        //PLEASE NOTE: Free API key is limited to 25 transactions/min and capped at 1,500/day.
        //Try to limit the number of requests when testing, especially when we have multiple people working on this. 


        //PLEASE INSTALL THIS BEFORE USING TO AVOID CORS ISSUE: https://chrome.google.com/webstore/detail/cors-toggle/jioikioepegflmdnbocfhgmpmopmjkim?hl=en
        var request = new XMLHttpRequest();

        request.open('POST', 'https://api.kairos.com/detect');

        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('app_id', appID);
        request.setRequestHeader('app_key', appKey);

        request.onreadystatechange = function () {

            //readystate for XMLHttpRequest returns what state the request is in, "unsent", "opened", "loading", "done", etc.
            //readystate === 4 means if it is done.
            if (this.readyState === 4) {
                console.log('Status:', this.status);
                console.log('Headers:', this.getAllResponseHeaders());
                console.log('Body:', this.responseText);
            }
        };

        var body = {
            'image': base64Snap,
            'selector': 'ROLL'
        };

        request.send(JSON.stringify(body));
        //////////////////////////////////////////////////

    });


    delete_photo_btn.addEventListener("click", function (e) {

        e.preventDefault();

        // Hide image.
        image.setAttribute('src', "");
        image.classList.remove("visible");

        // Disable delete and save buttons
        delete_photo_btn.classList.add("disabled");
        download_photo_btn.classList.add("disabled");


        // Resume playback of stream.
        video.play();

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

});

