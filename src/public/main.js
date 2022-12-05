// Try setting profile
const profile = await get_profile();
// console.log(profile);
const profile_json = {
    user_name: "Stanley",
    user_id: "saraki0820",
    spotify_account: "stanleya0820",
    playlist: "https://open.spotify.com/album/4b9nOSXSf1LROzgfYFxdxI?si=uvsN2ufRTnK37ho8upGvWQ",
    favorite_genre: "J-POP",
    favorite_artist: "ZUTOMAYO",
    favorite_song: "https://open.spotify.com/track/6BV77pE4JyUQUtaqnXeKa5?si=40743dee036c46c0"
}; // Removing friends field for now
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

        document.getElementById('username').value = profile_json.user_name;
        document.getElementById('uid').value = profile_json.user_id;
        document.getElementById('spotify_id').value = profile_json.spotify_account;
        document.getElementById('list').value = profile_json.playlist;
        embed_link(profile_json.playlist, document.getElementsByClassName("playlist")[0]);
        document.getElementById('song').value = profile_json.favorite_song;
        embed_link(profile_json.favorite_song, document.getElementsByClassName("favorite_song")[0]);
        const response = await fetch(`https://music-matcher-326.herokuapp.com/Friends/${profile_json.user_id}`);
        const friends = response.json();
        friends.then(async value => {
            if (value.length > 0) {
                const response = await fetch(`https://music-matcher-326.herokuapp.com/Profiles/${value[0].friend_id}`);
                const friend_1 = response.json();
                friend_1.then(friendInfo => {
                    document.getElementById('f1_user_name').innerHTML = friendInfo[0].user_name;
                    document.getElementById('f1_uid').innerHTML = friendInfo[0].user_id;
                    document.getElementById('f1_song').innerHTML = friendInfo[0].favorite_song; 
                });
            }
            if (value.length > 1) {
                const response = await fetch(`https://music-matcher-326-herokuapp.com/Profiles/${value[1].friend_id}`);
                const friend_2 = response.json();
                friend_2.then(friendInfo => {
                    document.getElementById('f2_user_name').innerHTML = friendInfo[0].user_name;
                    document.getElementById('f2_uid').innerHTML = friendInfo[0].user_id;
                    document.getElementById('f2_song').innerHTML = friendInfo[0].favorite_song;                     
                });
            }
            if (value.length > 2) {
                const response = await fetch(`https://music-matcher-326-herokuapp.com/Profiles/${value[2].friend_id}`);
                const friend_3 = response.json();
                friend_3.then(friendInfo => {
                    document.getElementById('f3_user_name').innerHTML = friendInfo[0].user_name;
                    document.getElementById('f3_uid').innerHTML = friendInfo[0].user_id;
                    document.getElementById('f3_song').innerHTML = friendInfo[0].favorite_song;                           
                });
            }
        });
        // commenting out for now
        //todo: make this less ugly
        // if (friends.length > 0) {
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
 * Adds a profile to the database given the populated fields in the sidebar
 */
async function add_profile() {
    const profile = {};
    profile.user_name = document.getElementById('username').value;
    profile.user_id = document.getElementById('uid').value;
    profile.spotify_account = document.getElementById('spotify_id').value;
    profile.playlist = document.getElementById('list').value;
    profile.favorite_song = document.getElementById('song').value;
    profile.favorite_artist = document.getElementById('artist').value;
    profile.favorite_genre = document.getElementById('genre').value;

    embed_link(profile_json.playlist, document.getElementsByClassName("playlist")[0]);
    embed_link(profile_json.favorite_song, document.getElementsByClassName("favorite_song")[0]);

    const response = await fetch('https://music-matcher-326.herokuapp.com/createProfile', {method: 'POST', body: JSON.stringify(profile)})
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
        favorite.classList.add('like_button');
        favorite.innerText = 'favorite_border';
        const response = await fetch(`https://music-matcher-326.herokuapp.com/likedChirps/${profile_json.user_id}/${chirp_json.chirp_id}`);
        const likedPost = response.json();
        likedPost.then(value => {
            if(value == true) {
                favorite.style.color = 'red';
            }
        });
        const likes = document.createElement('div');
        likes.innerHTML = chirp_json.like_count;
        likes.classList.add('likes');
        favorite.addEventListener('click', async () => {
            if (favorite.style.color != 'red') {
                favorite.style.color = 'red';
                const like = {
                    user_id: profile_json.user_id,
                    chirp_id: chirp_json.chirp_id
                };
                await fetch(`https://music-matcher-326.herokuapp.com/createLike`, {method: 'POST', body: JSON.stringify(like)});
                chirp_json.like_count+=1;
                likes.innerHTML = chirp_json.like_count;
            }
            else {
                favorite.style.color = 'black';
                chirp_json.like_count-=1;
                await fetch(`https://music-matcher-326.herokuapp.com/deleteLike/${profile_json.user_id}/${chirp_json.chirp_id}`, {method: 'DELETE'});
                likes.innerHTML = chirp_json.like_count;
            }
            const chirpEdit = {
                chirp_id: chirp_json.chirp_id,
                timestamp: chirp_json.timestamp,
                user_name: chirp_json.user_name,
                chirp_text: chirp_json.chirp_text,
                shared_song: chirp_json.shared_song,
                like_count: chirp_json.like_count,
                share_count: chirp_json.share_count,
                user_id: chirp_json.user_id
            };
            await fetch(`https://music-matcher-326.herokuapp.com/putChirp`, {method: 'PUT', body: JSON.stringify(chirpEdit)});
        });
        const publish = document.createElement('span');
        publish.classList.add('material-icons');
        publish.innerText = 'publish';

        footer.appendChild(repeat);
        footer.appendChild(favorite);
        footer.appendChild(likes);
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

async function add_friends() { //Adds 3 friends from database
    const response = await fetch(`https://music-matcher-326.herokuapp.com/Friends/${profile_json.user_id}`);
    const current_friends = response.json();
    current_friends.then(async friendsList => {
        if(friendsList.length != 3) {
            const responseProfiles = await fetch(`https://music-matcher-326.herokuapp.com/Profiles`);
            const all_Profiles = responseProfiles.json();
            all_Profiles.then(async profileList => {
                let i = 0;
                let k = 0;
                while(i < 3 && k < profileList.length) {
                    if (profile_json.user_id != profileList[i].user_id) {
                        let friendConnection = 
                        {
                            user_id: profile_json.user_id,
                            friend_id: profileList[i].user_id
                        }
                        await update_friends_db(friendConnection);
                        i++;
                    }
                    k++;
                }

            });
        }    

    })
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
    const chirp = { user_name: document.getElementById("username").value, 
                    user_id: document.getElementById('uid').value,
                    chirp_text: document.getElementById("sharebox_text").value, 
                    shared_song: document.getElementById("shared_spotify_url").value, 
                    like_count: 0, 
                    share_count: 0 };
    const response = await update_chirp_db(chirp); // Separating out updating chirp and posting chirp
    await post_chirp(response); 
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

    add_friends();
    console.log(profile_json.friends);
}); 
// Basic app functionalities

// When 'share!' button is clicked the chirp should be posted on feed
document.getElementById("sharebox_shareButton").addEventListener('click', () => {
    console.log("TEST");
})
document.getElementById("sharebox_shareButton").addEventListener('click', (post_chirp_wrapper));

document.getElementById("sharebox_shareButton").addEventListener('click', add_profile);

// Automatically converts to embedded spotify playable when spotify url put in
document.getElementById('embed_button').addEventListener("click", () => {
    // Parse input first
    const shared_spotify_url = document.getElementById('shared_spotify_url').value;
    console.log("Starting spotify link embed");
    const shareBoxDiv = document.getElementsByClassName("shareBox")[0];
    embed_link(shared_spotify_url, shareBoxDiv);
});

//On load

// Test onload table creation
const response = await fetch(`https://music-matcher-326.herokuapp.com/loadFeed`);

if (response.ok) {
    const chirpsJsonArr = await response.json();
    
    for (let i = 0; i < chirpsJsonArr.length; i++) {
        await post_chirp(chirpsJsonArr[i]);
    }
}

// console.log(profile_json);

const result = await set_profile(profile_json);

console.log("FINISHED LOADING");
