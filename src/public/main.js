/**
 * Gets profile asynchronously for a given user (no params for now)
 * @return {JSON} Returns Profile JSON
 */
 async function get_profile() {
    const response = await fetch(`https://music-matcher-326.herokuapp.com/profiles`);
    if (response.ok) {
        const profileJson = await response.json();
        console.log(profileJson);
        return profileJson;
    }
}

/**
 * Gets chirps from friends within relatively recent timespan and displays it
 * @return {JSON} Returns Chirp JSON
 */
async function get_feed() {
    const response = await fetch(`https://music-matcher-326.herokuapp.com/chirps`);

    if (response.ok) {
        const chirpJson = await response.json();
        console.log(chirpJson);
        return chirpJson;
    }
}

/**
 * Sets the profile using the profile JSON given
 * @param {JSON} profile_json Input Profile JSON
 */
async function set_profile(profile_json) {
    // Update User in DB
    const response = await fetch(`https://music-matcher-326.herokuapp.com/putProfile`, {method: 'PUT', body: JSON.stringify(profile_json)});
    if (response.ok) {
        //if went thru, update in front end

        document.getElementById('username').innerHTML = profile_json.user_name;
        document.getElementById('uid').innerHTML = profile_json.user_id;
        document.getElementById('spotify_id').innerHTML = profile_json.spotify_account;
        document.getElementById('list').innerHTML = profile_json.playlist;
        document.getElementById('song').innerHTML = profile_json.favorite_song;
    
        // commenting out for now
        // const friends = profile_json.friends;
        //todo: make this less ugly
        // if (friends.length > 0) {
        //     document.getElementById('f1_user_name').innerHTML = profileJson.friends[0].user_name;
        //     // document.getElementById('f1_uid').innerHTML = profileJson.friends[0].user_id; // TODO: Update USERID too
        //     document.getElementById('f1_song').innerHTML = profileJson.friends[0].favorite_song;        
        // } if (friends.length > 1) {
        //     document.getElementById('f2_user_name').innerHTML = profileJson.friends[1].user_name;
        //     // document.getElementById('f1_uid').innerHTML = profileJson.friends[0].user_id; // TODO: Update USERID too
        //     document.getElementById('f2_song').innerHTML = profileJson.friends[1].favorite_song;
        // } if (friends.length > 2) {
        //     document.getElementById('f3_user_name').innerHTML = profileJson.friends[2].user_name;
        //     // document.getElementById('f1_uid').innerHTML = profileJson.friends[0].user_id; // TODO: Update USERID too
        //     document.getElementById('f3_song').innerHTML = profileJson.friends[2].favorite_song;
        // }
    }

}

/**
 * @param {JSON} chirp_json JSON object containing chirp information to update chirps table with 
 */ 
async function update_chirp_db(chirp_json) {
    const response = await fetch(`https://music-matcher-326.herokuapp.com/createChirp`, {method: 'POST', body: JSON.stringify(chirp_json)});
    return response;
}

/**
 * Programatically creates a new chirp based off the given chirp_json
 * @TODO : need to integrate with spotify api for playing music
 * @param {JSON} chirp_json 
 */
async function post_chirp(chirp_json) {
    // Need to set up the feed
    // Right now we update using the ids of specific fields but that really isn't scalable for chirps and friends list. 
    // Need to figure out a way to efficiently update the fields
    
    if (response.ok && response.status !== 404) {
        const feed = document.getElementById('feed');
        //post_avatar portion
        const newPost = document.createElement('div');
        newPost.classList.add('post');
        const avatar = document.createElement('div');
        avatar.classList.add('post_avatar');
        const icon = document.createElement('span');
        icon.id =  'userProfileShare';
        icon.classList.add('material-icons');
        //unsure about this
        icon.innerHTML = 'account_circle';
        avatar.appendChild(icon);
    
        //post_body portion
        const post_body = document.createElement('div');
        post_body.classList.add('post_body');
    
        const post_header = document.createElement('div');
        post_header.classList.add('post_header');
    
        const post_headerText = document.createElement('div');
        post_headerText.classList.add('post_headerText');
    
        const user = document.createElement('h3');
        user.id = 'u1_user_name';
        //are we doing verification?
        user.innerText = chirp_json.user_name;
        post_headerText.appendChild(user);
    
        const post_headerDesc = document.createElement('div');
        post_headerDesc.classList.add('post_headerDescription');
        post_headerDesc.innerHTML = `<p id="u1_chirp"> ${chirp_json.chirp_text}</p>`;
    
        post_header.appendChild(post_headerText);
        post_header.appendChild(post_headerDesc);
    
        const song = document.createElement('div');
        //unsure
        song.classList.add('post_add_music');

        const footer = document.createElement('span');
        footer.classList.add('post_footer');

        const repeat = document.createElement('span');
        repeat.classList.add('material-icons');
        repeat.innerText = 'repeat';

        const favorite = document.createElement('span');
        favorite.classList.add('material-icons');
        favorite.innerText = 'favorite_border';

        const publish = document.createElement('span');
        publish.classList.add('material-icons');
        publish.innerText = 'publish';

        footer.appendChild(repeat);
        footer.appendChild(favorite);
        footer.appendChild(publish);

        post_body.appendChild(post_header);
        post_body.appendChild(song);
        post_body.appendChild(footer);

        newPost.appendChild(avatar);
        newPost.appendChild(post_body);

        feed.appendChild(newPost);
    } else {
        const err = await response.text();
        console.log(err)
    }
}

async function add_friend(profile_json, friend_json) {
    const friend =             
    {
        user_name: friend_json.user_name,
        user_id: friend_json.user_id,
        favorite_song: friend_json.favorite_song,
        recent_shared: {
            shared_song: 'WAHT IS EVEN GOING ON HAHAHAHHA'
        }
    }
    await set_profile(profile_json);
}

async function post_chirp_wrapper() {
    console.log("In post_chirp_wrapper");
    const chirp = { user_name: document.getElementById("username").value, 
                    chirp_text: document.getElementById("sharebox_text").value, 
                    shared_song: document.getElementById("shared_spotify_url").value, 
                    like_count: 0, 
                    share_count: 0 };
    // assumes song name field doesn't exist
    // chirp["user_name"] = document.getElementById("username").value;
    // chirp["chirp_text"] = document.getElementsByClassName("sharebox_text")[0].value;
    // chirp["shared_song"] = document.getElementsByClassName("shared_spotify_url")[0].value;
    // chirp["like_count"] = 0;
    // chirp["share_count"] = 0; // Consider making object for a chirp and the feed to keep count of individual chirps' like and share count
    console.log(chirp);
    const response = await update_chirp_db(chirp); // Separating out updating chirp and posting chirp
    await post_chirp(response); 
    alert("Posting chirp");
}

const addButton = document.getElementById('addButton');
addButton.addEventListener('click', () => {
    add_friend(profileJson, friendJson);
    console.log(profileJson.friends);
}); 
// Basic app functionalities

// When 'share!' button is clicked the chirp should be posted on feed
document.getElementById("sharebox_shareButton").addEventListener('click', () => {
    console.log("TEST");
})
document.getElementById("sharebox_shareButton").addEventListener('click', (post_chirp_wrapper));

// Automatically converts to embedded spotify playable when spotify url put in
document.getElementById('shared_spotify_url').addEventListener("keyup", () => {
    // Parse input first
    const shared_spotify_url = document.getElementById('shared_spotify_url').value;
    if (/https:\/\/open.spotify.com\/track\/.*/.test(shared_spotify_url)) {
        // matches track/playlist spotify link 'structure'
        const shareBoxDiv = document.getElementsByClassName("shareBox")[0];
        // Source: Spotify API Embed website. 
        // If this doesn't work we can try using oEmbded API
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
            let element = document.getElementById('embed-iframe');
            let options = {
                uri: 'spotify:track:' + shared_spotify_url.split("/")[4].split("?")[0] // Gets id of song
              };
            let callback = (EmbedController) => {};
            IFrameAPI.createController(element, options, callback);
            // if this creates div element then append that
            //TODO: Add check here so don't add more than one
            shareBoxDiv.appendChild(IFrameAPI);
        };
    }
    else if (/https:\/\/open.spotify.com\/playlist\/.*/.test(shared_spotify_url)) {
        const shareBoxDiv = document.getElementsByClassName("shareBox")[0];
        // Source: Spotify API Embed website. 
        // If this doesn't work we can try using oEmbded API
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
            let element = document.getElementById('embed-iframe');
            let options = {
                uri: 'spotify:playlist:' + shared_spotify_url.split("/")[4].split("?")[0] // Gets id of playlist
              };
            let callback = (EmbedController) => {};
            IFrameAPI.createController(element, options, callback);
            // if this creates div element then append that
            //TODO: Add check here so don't add more than one
            shareBoxDiv.appendChild(IFrameAPI);
        };
    }
    else {
        // throw error, url doesn't match format
        alert("Spotify song/playlist url is invalid. Please enter a valid url!");

        //TODO: Somehow handle case for when the specific song with id cannot be found
    }
});

//On load

// Test onload table creation
const response = await fetch(`https://music-matcher-326.herokuapp.com/loadFeed`);

if (response.ok) {
    const chirpsJsonArr = await response.json();
    console.log(chirpsJsonArr);
    
    // Update the feed
    for (let i = 0; i < chirpsJsonArr.length; i++) {
        await post_chirp(chirpsJsonArr[i]);
    }
    
}

// Try setting profile
const profile = await get_profile();
// console.log(profile);
const profile_json = {
    user_name: "Stanley",
    user_id: "staraki",
    spotify_account: "stanleya0820",
    playlist: "https://open.spotify.com/album/4b9nOSXSf1LROzgfYFxdxI?si=uvsN2ufRTnK37ho8upGvWQ",
    favorite_genre: "J-POP",
    favorite_artist: "ZUTOMAYO",
    favorite_song: "https://open.spotify.com/track/6BV77pE4JyUQUtaqnXeKa5?si=40743dee036c46c0"
}; // Removing friends field for now

// console.log(profile_json);

// const result = await set_profile(profile_json);

console.log("FINISHED LOADING");