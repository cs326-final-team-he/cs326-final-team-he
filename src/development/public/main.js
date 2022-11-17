/**
 * Gets profile asyncorhonously for a given user (no params for now)
 * @return {JSON} Returns Profile JSON
 */
 async function get_profile() {
    const response = await fetch(`http://localhost:8000/profile`);
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
    const response = await fetch(`http://localhost:8000/chirp`);

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
    const response = await fetch(`http://localhost:8000/putProfile`, {method: 'PUT', body: JSON.stringify(profile_json)});
    if (response.ok) {
        //if went thru, update in front end
        document.getElementById('username').innerHTML = profile_json.user_name;
        document.getElementById('uid').innerHTML = profile_json.user_id;
        document.getElementById('spotify_id').innerHTML = profile_json.spotify_account;
        document.getElementById('list').innerHTML = profile_json.playlist;
        document.getElementById('song').innerHTML = profile_json.favorite_song;
    
        const friends = profileJson.friends;
        //todo: make this less ugly
        if (friends.length > 0) {
            document.getElementById('f1_user_name').innerHTML = profileJson.friends[0].user_name;
            // document.getElementById('f1_uid').innerHTML = profileJson.friends[0].user_id; // TODO: Update USERID too
            document.getElementById('f1_song').innerHTML = profileJson.friends[0].favorite_song;        
        } if (friends.length > 1) {
            document.getElementById('f2_user_name').innerHTML = profileJson.friends[1].user_name;
            // document.getElementById('f1_uid').innerHTML = profileJson.friends[0].user_id; // TODO: Update USERID too
            document.getElementById('f2_song').innerHTML = profileJson.friends[1].favorite_song;
        } if (friends.length > 2) {
            document.getElementById('f3_user_name').innerHTML = profileJson.friends[2].user_name;
            // document.getElementById('f1_uid').innerHTML = profileJson.friends[0].user_id; // TODO: Update USERID too
            document.getElementById('f3_song').innerHTML = profileJson.friends[2].favorite_song;
        }
    }

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
    const response = await fetch(`http://localhost:8000/createChirp`, {method: 'POST', body: JSON.stringify(chirp_json)});
    if (response.ok) {
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
// On load call
const profileJson = await get_profile();
const friendJson = await get_profile();
set_profile(profileJson);

const feedJson = await get_feed();
post_chirp(feedJson);
const addButton = document.getElementById('addButton');
addButton.addEventListener('click', () => {
    add_friend(profileJson, friendJson);
    console.log(profileJson.friends);
});
console.log("FINISHED LOADING");
