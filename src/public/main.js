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
 * Loads the current session profile
 */
async function load_profile() {
    const response = await fetch('https://music-matcher-326.herokuapp.com/sessionProfile');
    if (response.ok && response.status !== 404) {
        const json = await response.json();
        const profile = json[0]
        document.getElementById('username').innerText = profile.user_name;
        document.getElementById('uid').innerText = profile.user_id;
        document.getElementById('spotify_id').innerText = profile.spotify_account;
        embed_link(profile.playlist, document.getElementById("list"));
        embed_link(profile.favorite_song, document.getElementById("song"));
        embed_link(profile.favorite_artist, document.getElementById("artist"));
        document.getElementById('genre').innerText = profile.favorite_genre;
    }
    else {
        alert('error talking with server, please try again later')
    }
}
/**
 * @param {JSON} chirp_json JSON object containing chirp information to update chirps table with 
 */ 
async function update_chirp_db(chirp_json) {
    //timestamp done serverside
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
        embed_link(chirp_json.shared_song, newPost); // Embed spotify song/track to post

        // Check if feed child Node list length > 3(basically contains an existing chirp). If so, use insertBefore(), else, use appendCHild()
        if (feed.children.length < 3) {
            // Only contains header and sharebox
            feed.appendChild(newPost);
        }
        else {
            feed.insertBefore(newPost, feed.children[2]);
        }
    } else {
        const err = await response.text();
        console.log(err)
    }
}

async function add_friend(profile_json, friend_json) {
    const friendConnection =             
    {
        user_id: profile_json.user_id,
        friend_json: friend_json.user_id
    }
    await update_friends_db(friendConnection);
}

/**
 * Will add new friend to database
 */
async function update_friends_db(friendConnection) {
    const response = await fetch(`https://music-matcher-326.herokuapp.com/createFriend`, {method: 'POST', body: JSON.stringify(friendConnection)});
    return response;
}

async function post_chirp_wrapper() {
    console.log("In post_chirp_wrapper");
    const chirp = { user_name: document.getElementById("username").innerText, 
                    user_id: document.getElementById('uid').innerText,
                    chirp_text: document.getElementById("sharebox_text").value, 
                    shared_song: document.getElementById("shared_spotify_url").value, 
                    like_count: 0, 
                    share_count: 0 };
    const response = await update_chirp_db(chirp); // Separating out updating chirp and posting chirp
    if (response.ok && response.status !== 404) {
        await post_chirp(chirp); 
    }
    alert("Posting chirp");
}

/**
 * 
 * @param {String} spotify_url The url of the spotify playlist/song to embed
 * @param {HTMLelement} divElem The div elem to add the embedded link to
 */
function embed_link(spotify_url, divElem) {
    if (/https:\/\/open.spotify.com\/track\/.*/.test(spotify_url)) {
        // matches track/playlist spotify link 'structure'
        // const shareBoxDiv = document.getElementsByClassName("shareBox")[0];
        

        const iframe = document.createElement("iframe"); 

        console.log("Setting up iframe styling");

        iframe.src = "https://open.spotify.com/embed?uri=spotify:track:" + spotify_url.split("/")[4].split("?")[0];
        iframe.width = "300";
        iframe.height = "200";
        iframe.allowTransparency = "true";
        iframe.allow = "encrypted-media";

        divElem.appendChild(iframe);
    }
    else if (/https:\/\/open.spotify.com\/playlist\/.*/.test(spotify_url)) {
        // const shareBoxDiv = document.getElementsByClassName("shareBox")[0];

        const iframe = document.createElement("iframe"); 

        console.log("Setting up iframe styling");

        iframe.src = "https://open.spotify.com/embed?uri=spotify:playlist:" + spotify_url.split("/")[4].split("?")[0];
        iframe.width = "300";
        iframe.height = "200";
        iframe.allowTransparency = "true";
        iframe.allow = "encrypted-media";

        divElem.appendChild(iframe);
    }
    else if (/https:\/\/open.spotify.com\/album\/.*/.test(spotify_url)) {
        const iframe = document.createElement("iframe"); 

        console.log("Setting up iframe styling");

        iframe.src = "https://open.spotify.com/embed?uri=spotify:album:" + spotify_url.split("/")[4].split("?")[0];
        iframe.width = "300";
        iframe.height = "200";
        iframe.allowTransparency = "true";
        iframe.allow = "encrypted-media";

        divElem.appendChild(iframe);
    }
    else if (/https:\/\/open.spotify.com\/artist\/.*/.test(spotify_url)) {
        const iframe = document.createElement("iframe"); 

        console.log("Setting up iframe styling");

        iframe.src = "https://open.spotify.com/embed?uri=spotify:artist:" + spotify_url.split("/")[4].split("?")[0];
        iframe.width = "300";
        iframe.height = "200";
        iframe.allowTransparency = "true";
        iframe.allow = "encrypted-media";

        divElem.appendChild(iframe);
    }
    else if (spotify_url.length === 0) {
        // Do nothing
    }
    else {
        // throw error, url doesn't match format
        alert("Spotify song/playlist url is invalid. Please enter a valid url!");

        //TODO: Somehow handle case for when the specific song with id cannot be found
    }
}

const addButton = document.getElementById('addButton');
addButton.addEventListener('click', () => {
    add_friend(profileJson, friendJson);
    console.log(profileJson.friends);
}); 
// Basic app functionalities

// When 'share!' button is clicked the chirp should be posted on feed

document.getElementById("sharebox_shareButton").addEventListener('click', (post_chirp_wrapper));

// Automatically converts to embedded spotify playable when spotify url put in
document.getElementById('embed_button').addEventListener("click", () => {
    // Parse input first
    const shared_spotify_url = document.getElementById('shared_spotify_url').value;
    console.log("Starting spotify link embed");
    const shareBoxDiv = document.getElementsByClassName("shareBox")[0];
    embed_link(shared_spotify_url, shareBoxDiv);
});
//On load

// Try setting profile
await load_profile();

// Test onload table creation
const response = await fetch(`https://music-matcher-326.herokuapp.com/loadFeed`);

if (response.ok) {
    const chirpsJsonArr = await response.json();
    console.log(chirpsJsonArr);
    
    for (let i = 0; i < chirpsJsonArr.length; i++) {
        await post_chirp(chirpsJsonArr[i]);
    }
}

console.log("FINISHED LOADING");
