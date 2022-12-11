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
        return profileJson;
    }
}

/**
 * Gets chirps and displays it
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

async function setUpFriends() {
    const response = await fetch('https://music-matcher-326.herokuapp.com/userFriends');
    const friends = response.json();
    friends.then(async value => {
        if (value.length > 0) {
            const response = await fetch(`https://music-matcher-326.herokuapp.com/Profiles/${value[0].friend_id}`);
            const friend_1 = response.json()
            friend_1.then(friendInfo => {
                document.getElementById('f1_user_name').innerHTML = friendInfo[0].user_name;
                document.getElementById('f1_song').innerHTML = '';
                embed_link(friendInfo[0].favorite_song, document.getElementById('f1_song'));
            });
        }
        if (value.length > 1) {
            const response = await fetch(`https://music-matcher-326.herokuapp.com/Profiles/${value[1].friend_id}`);
            const friend_2 = response.json();
            friend_2.then(friendInfo => {
                document.getElementById('f2_user_name').innerHTML = friendInfo[0].user_name;
                document.getElementById('f2_song').innerHTML = '';                    
                embed_link(friendInfo[0].favorite_song, document.getElementById('f2_song'));
            });
        }
        if (value.length > 2) {
            const response = await fetch(`https://music-matcher-326.herokuapp.com/Profiles/${value[2].friend_id}`);
            const friend_3 = response.json();
            friend_3.then(friendInfo => {
                document.getElementById('f3_user_name').innerHTML = friendInfo[0].user_name;
                document.getElementById('f3_song').innerHTML = '';                       
                embed_link(friendInfo[0].favorite_song, document.getElementById('f3_song'));                         
            });
        }
    });
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
        await setUpFriends()
    }
    else {
        alert('error talking with server, please try again later')
    }
}

async function load_friends() {
    const response = await fetch('https://music-matcher-326.herokuapp.com/userFriends');
    if (response.ok && response.status !== 404) {
        const friends = await response.json();
        const friendsDiv = document.getElementById('friends');
        friendsDiv.innerHTML = "<h2>Friends</h2>";
        friends.forEach(friend => {
            const div = document.createElement('div');
            div.classList.add('friend')
            div.innerHTML =
                `<div class="friend_avatar">
                    <button" class="material-icons unfriend">
                        do_not_disturb_on
                    </button>
                </div>
                <div class="friend_profile">
                    <h3 id="user_name">
                        ${friend.friend_id}
                    </h3>
                    <div class="friend_favorite_song" id="friend_song${friend.favorite_song}">
                    </div>
                </div>`;
            results.appendChild(div);
            embed_link(friend.favorite_song, document.getElementById(`result_song${friend.friend_id}`));
            const closure = function () {
                const friend_id = friend.friend_id;
                return async () => {
                    const response = await fetch(`https://music-matcher-326.herokuapp.com/deleteFriend/${friend_id}`, { method: 'DELETE' });
                }
            }
            div.addEventListener('click', closure());
        })
    }
}
/**
 * @param {JSON} chirp_json JSON object containing chirp information to update chirps table with 
 */
async function update_chirp_db(chirp_json) {
    //timestamp done serverside
    const response = await fetch(`https://music-matcher-326.herokuapp.com/createChirp`, { method: 'POST', body: JSON.stringify(chirp_json) });
    return response;
}

function edit_chirp(post_headerDesc, song_div, chirp_id, edit_btn) {
    return () => {
        //allow edits
        post_headerDesc.innerHTML = `
        <textarea id="editBox_text" cols="500" rows="10"
        placeholder="Share a song or playlist!">${post_headerDesc.innerText}</textarea>
        `;
        song_div.innerHTML = `
        <input type="text" id="edit_url" placeholder="Enter a song or playlist url!">
        <button type="button" id="embed_button">Embed song/playlist!</button>
        <div id="embed-iframe"></div>`

        //change button onclick to finish edits
        edit_btn.innerText = 'Finish Edits';
        edit_btn.onclick = async () => {
            const text = document.getElementById('editBox_text').value;
            const song = document.getElementById('edit_url').value;
            const data = {
                'chirp_id': chirp_id,
                'text': text,
                'song': song
            };
            const response = await fetch(`https://music-matcher-326.herokuapp.com/putChirp`, {method: 'PUT', body: data});
            if (response.ok && response.status !== 404) {
                post_headerDesc.innerHTML = `<p id="u1_chirp"> ${text}</p>`
                song_div.innerHTML = '';
                embed_link(song, song_div)
                edit_btn.innerText = 'Edit';
                edit_btn.onclick = edit_chirp(post_headerDesc, song_div, chirp_id);
            } else {
                alert("Problems uploading edited chirp to database. Please try again later.")
            }
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

    if (response.ok && response.status !== 404) {
        const feed = document.getElementById('feed');
        //post_avatar portion
        const newPost = document.createElement('div');
        newPost.classList.add('post');
        const avatar = document.createElement('div');
        avatar.classList.add('post_avatar');
        const icon = document.createElement('span');
        icon.id = 'userProfileShare';
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
        if (chirp_json.isUser) {
            user.innerHTML = `
            <h3 id="u1_user_name">${chirp_json.user_name}</h3>
            <button class="editBtn" div id="${chirp_json.chirp_id}Edit">Edit</button>`;    
        } else {
            user.id = 'u1_user_name';
            user.innerText = chirp_json.user_name;    
        }

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
        const response = await fetch(`https://music-matcher-326.herokuapp.com/likedChirps/${chirp_json.chirp_id}`);
        const likedPost = response.json();
        likedPost.then(value => {
            if (value == true) {
                favorite.style.color = 'red';
            }
        });
        const likes = document.createElement('span');
        likes.innerHTML = chirp_json.like_count;
        likes.classList.add('likes');
        favorite.addEventListener('click', async () => {
            if (favorite.style.color != 'red') {
                favorite.style.color = 'red';
                const like = {
                    chirp_id: chirp_json.chirp_id
                };
                await fetch(`https://music-matcher-326.herokuapp.com/createLike`, { method: 'POST', body: JSON.stringify(like) });
                chirp_json.like_count += 1;
                likes.innerHTML = chirp_json.like_count;
            }
            else {
                favorite.style.color = 'black';
                chirp_json.like_count -= 1;
                await fetch(`https://music-matcher-326.herokuapp.com/deleteLike/${chirp_json.chirp_id}`, { method: 'DELETE' });
                likes.innerHTML = chirp_json.like_count;
            }
            const chirpEdit = {
                chirp_id: chirp_json.chirp_id,
                timestamp: chirp_json.timestamp,
                chirp_text: chirp_json.chirp_text,
                user_name: chirp_json.user_name,
                shared_song: chirp_json.shared_song,
                like_count: chirp_json.like_count,
                share_count: chirp_json.share_count,
                user_id: chirp_json.user_id
            };
            await fetch(`https://music-matcher-326.herokuapp.com/putChirp`, { method: 'PUT', body: JSON.stringify(chirpEdit) });
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
        embed_link(chirp_json.shared_song, song); // Embed spotify song/track to post

        // Check if feed child Node list length > 3(basically contains an existing chirp). If so, use insertBefore(), else, use appendCHild()
        if (feed.children.length < 3) {
            // Only contains header and sharebox
            feed.appendChild(newPost);
        }
        else {
            feed.insertBefore(newPost, feed.children[2]);
        }
        const edit_btn = document.getElementById(`${chirp_json.chirp_id}Edit`);
        edit_btn.onclick = edit_chirp(post_headerDesc, song, chirp_json.chirp_id, edit_btn);
    } else {
        const err = await response.text();
        console.log(err)
    }
}

async function search() {
    const search = document.getElementById('search').value;
    const response = await fetch(`https://music-matcher-326.herokuapp.com/search?search=${search}`);
    if (response.ok && response.status !== 404) {
        const rows = await response.json();
        const results = document.getElementById('results');
        results.innerHTML = '<h2>Search Results:</h2>';
        rows.forEach(obj => {
            const div = document.createElement('div');
            div.classList.add('result')
            div.innerHTML =
                `<div class="result_avatar">
                    <button" class="material-icons addButton" id="addUser">
                        add_circle
                    </button>
                </div>
                <div class="result_profile">
                    <h3 id="user_name">
                        ${obj.user_id}
                    </h3>
                    <div class="result_favorite_song" id="result_song${obj.user_id}">
                    </div>
                </div>`;
            results.appendChild(div);
            embed_link(obj.favorite_song, document.getElementById(`result_song${obj.user_id}`));
            const closure = function () {
                const friend_id = obj.user_id;
                return async () => {
                    await add_friend(friend_id);
                    await setUpFriends()
                }
            }
            div.addEventListener('click', closure());
        });
    }
}
async function add_friend(friend_id) {
    const result = await fetch(`https://music-matcher-326.herokuapp.com/friends/${friend_id}`);
    const findFriend = result.json()
    findFriend.then(async value => {
        if (value == true) {
            alert("You already added this friend!");
        }
        else {
            const response = await fetch(`https://music-matcher-326.herokuapp.com/createFriend/${friend_id}`, {method: 'POST'});
            alert("Friend Added!");
            return response;
        }
    });
}

async function post_chirp_wrapper() {
    console.log("In post_chirp_wrapper");
    const chirp = {
        user_name: document.getElementById("username").innerText,
        user_id: document.getElementById('uid').innerText,
        chirp_text: document.getElementById("sharebox_text").value,
        shared_song: document.getElementById("shared_spotify_url").value,
        like_count: 0,
        share_count: 0
    };
    const response = await update_chirp_db(chirp); // Separating out updating chirp and posting chirp
    if (response.ok && response.status !== 404) {
        const json = await response.json();
        chirp.isUser = true;
        chirp.chirp_id = json.id;
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
document.getElementById('searchButton').addEventListener('click', search);
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
