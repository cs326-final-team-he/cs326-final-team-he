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
 * A function that retrieves all the friends from the database given the session user, and programmatically appends them to the
 * friends list side bar of the main view. Also gives each one an unfriend option.
 */
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
                    <div class="friend_favorite_song" id="friend_song${friend.friend_id}">
                    </div>
                </div>`;
            friendsDiv.appendChild(div);
            embed_link(friend.favorite_song, document.getElementById(`friend_song${friend.friend_id}`));
            const closure = function () {
                const friend_id = friend.friend_id;
                return async () => {
                    const response = await fetch(`https://music-matcher-326.herokuapp.com/deleteFriend/${friend_id}`, { method: 'DELETE' });
                }
            }
            div.addEventListener('click', closure());
        });
    }
}

/**
 * A function to load all the chirps in the database and programmatically post them to the feed.
 */
async function load_feed() {
    const response = await fetch(`https://music-matcher-326.herokuapp.com/loadFeed`);
    if (response.ok) {
        const chirpsJsonArr = await response.json();
        console.log(chirpsJsonArr);

        for (let i = 0; i < chirpsJsonArr.length; i++) {
            await post_chirp(chirpsJsonArr[i]);
        }
    }
}

/**
 * A function that creates the environment for the actual on click edit chirp function to exist in.
 * We hard code innerHTML because of time constraints and because it is essentially the same as the share box.
 * WARNING: PLEASE DO NOT EDIT MORE THAN ONE POST AT A TIME. BAD THINGS MAY HAPPEN IF YOU DO
 * @param {HTMLDivElement} post_headerDesc the div element containing the body of the post
 * @param {HTMLDivElement} song_div  the div element containing the embeded song of the post
 * @param {*} chirp_id the id of the chirp
 * @param {HTMLElement} edit_btn the edit button that is used on click
 * @returns a closure that completes the edit. Used as an onclick function
 */
function edit_chirp(post_headerDesc, song_div, chirp_id, edit_btn) {
    return () => {
        //allow edits
        post_headerDesc.innerHTML = `
        <textarea id="editBox_text" cols="500" rows="10"
        placeholder="Share a song or playlist!">${post_headerDesc.innerText}</textarea>
        `;
        song_div.innerHTML = `
        <input type="text" id="edit_url" placeholder="Enter a song or playlist url!">
        <button type="button" id="embed_button_edit">Embed song/playlist!</button>
        <div id="embed-iframe"></div>`

        // Automatically converts to embedded spotify playable when spotify url put in
        document.getElementById('embed_button_edit').addEventListener("click", () => {
            // Parse input first
            const shared_spotify_url = document.getElementById('edit_url').value;
            const shareBoxDiv = document.getElementById("embed-iframe");
            embed_link(shared_spotify_url, shareBoxDiv);
        });

        //change button onclick to finish edits
        edit_btn.innerText = 'Finish Edits';
        edit_btn.onclick = async () => {
            /**
             * The function that will complete the edit and query the database.
             */
            const text = document.getElementById('editBox_text').value;
            const song = document.getElementById('edit_url').value;
            const data = {
                'chirp_id': chirp_id,
                'text': text,
                'song': song
            };
            const response = await fetch(`https://music-matcher-326.herokuapp.com/putChirp`, { method: 'PUT', body: JSON.stringify(data) });

            //If edit went through, update the local html. Else don't do anything
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

function delete_chirp(post, chirp_id) {
    return async () => {
        const response = await fetch(`https://music-matcher-326.herokuapp.com/deleteChirp/${chirp_id}`, { method: 'DELETE' });
        if (response.ok && response.status !== 404) {
            post.remove();
        }
        else {
            alert('Error deleting chirp, please try again');
        }
    }
}

/**
 * Updates the database with a new chirp. Used in tandem of post_chirp to create new chirps.
 * @param {JSON} chirp_json JSON object containing chirp information to update chirps table with 
 */
async function update_chirp_db(chirp_json) {
    //timestamp done serverside
    const response = await fetch(`https://music-matcher-326.herokuapp.com/createChirp`, { method: 'POST', body: JSON.stringify(chirp_json) });
    return response;
}

/**
 * Programatically creates a new chirp based off the given chirp_json
 * Since chirps are highly variant and pretty dense, there's a lot to unpack.
 * All the front facing functionality you see for a specific chirp, this function implements.
 * @param {JSON} chirp_json 
 */
async function post_chirp(chirp_json) {
    /**
     * First, we create the skeleton of the post given our post structure
     */
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

    /**
     * This is the header and main text of the post. 
     * Contains the userid, edit button delete button, and main text of post
     */
    const post_body = document.createElement('div');
    post_body.classList.add('post_body');

    const post_header = document.createElement('div');
    post_header.classList.add('post_header');

    //Contains the buttons and user
    const post_headerText = document.createElement('div');
    post_headerText.classList.add('post_headerText');

    const user = document.createElement('h3');
    user.id = 'u1_user_name';
    user.innerText = chirp_json.user_name;
    post_headerText.appendChild(user);
    //If this chirp was posted by the session user, add the edit and delete buttons
    if (chirp_json.isUser) {
        const editBtn = document.createElement('button');
        editBtn.classList.add('editBtn');
        editBtn.id = `${chirp_json.chirp_id}Edit`;
        editBtn.innerText = 'Edit';

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('material-icons', 'deleteBtn');
        deleteBtn.id = `${chirp_json.chirp_id}Delete`;
        deleteBtn.innerText = 'delete';

        post_headerText.appendChild(editBtn);
        post_headerText.appendChild(deleteBtn);
    }

    //Contains the post text
    const post_headerDesc = document.createElement('div');
    post_headerDesc.classList.add('post_headerDescription');
    post_headerDesc.innerHTML = `<p id="u1_chirp"> ${chirp_json.chirp_text}</p>`;

    post_header.appendChild(post_headerText);
    post_header.appendChild(post_headerDesc);

    //Creates div for embedded widget to live in
    const song = document.createElement('div');
    song.classList.add('post_add_music');

    //Footer containing the like button and other things that we did not have time to get to.
    const footer = document.createElement('span');
    footer.classList.add('post_footer');

    const repeat = document.createElement('span');
    repeat.classList.add('material-icons');
    repeat.innerText = 'repeat';


    const favorite = document.createElement('span');
    favorite.classList.add('material-icons');
    favorite.classList.add('like_button');
    favorite.innerText = 'favorite_border';

    const likes = document.createElement('span');

    const publish = document.createElement('span');
    publish.classList.add('material-icons');
    publish.innerText = 'publish';

    // Append EVERYTHING AHAHAHA
    footer.appendChild(repeat);
    footer.appendChild(favorite);
    footer.appendChild(likes);
    footer.appendChild(publish);

    post_body.appendChild(post_header);
    post_body.appendChild(song);
    post_body.appendChild(footer);

    newPost.appendChild(avatar);
    newPost.appendChild(post_body);
    //Embed the link once post has been added to rest of html
    embed_link(chirp_json.shared_song, song); // Embed spotify song/track to post

    // Check if feed child Node list length > 3(basically contains an existing chirp). If so, use insertBefore(), else, use appendCHild()
    if (feed.children.length < 3) {
        // Only contains header and sharebox
        feed.appendChild(newPost);
    }
    else {
        feed.insertBefore(newPost, feed.children[2]);
    }
    // Adds onclick functionality to the edit and delete buttons if we are the user
    if (chirp_json.isUser) {
        const edit_btn = document.getElementById(`${chirp_json.chirp_id}Edit`);
        edit_btn.onclick = edit_chirp(post_headerDesc, song, chirp_json.chirp_id, edit_btn);
        const delete_btn = document.getElementById(`${chirp_json.chirp_id}Delete`);
        delete_btn.onclick = delete_chirp(newPost, chirp_json.chirp_id, feed);
    }
}

/**
 * Retrieves like count from database and makes front end accurate
 * @param {Object} chirp_json the chirp that we need the likes for
 * @param {HTMLSpanElement} favorite the dive that corresponds to 'liking' a post
 */
async function setupLikes(chirp_json, favorite) {
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
            text: chirp_json.chirp_text,
            song: chirp_json.shared_song,
            like_count: chirp_json.like_count,
            chirp_id: chirp_json.chirp_id
        };
        await fetch(`https://music-matcher-326.herokuapp.com/putChirp`, { method: 'PUT', body: JSON.stringify(chirpEdit) });
    });
    return likes;
}

/**
 * Function that supports searching for users. Used for search bar on right side bar
 * 
 */
async function search() {
    const search = document.getElementById('search').value;
    const response = await fetch(`https://music-matcher-326.herokuapp.com/search?search=${search}`);
    if (response.ok && response.status !== 404) {
        
        const rows = await response.json();
        const results = document.getElementById('results');
        //Reset search results
        results.innerHTML = '<h2>Search Results:</h2>';
        //For each serach result, create a result icon in front end, with an add friend functionality
        rows.forEach(obj => {
            const div = document.createElement('div');
            div.classList.add('result');
            //This is hardcoded becasue of time constraint and the same html over and over again
            div.innerHTML =
                `<div class="result_avatar">
                    <button" class="material-icons addButton" id="addUser">
                        add_circle
                    </button>
                </div>
                <div class="result_profile">
                    <h3>
                        ${obj.user_id}
                    </h3>
                    <div class="result_favorite_song" id="result_song${obj.user_id}">
                    </div>
                </div>`;
            results.appendChild(div);
            //Embed favorite song
            embed_link(obj.favorite_song, document.getElementById(`result_song${obj.user_id}`));
            //Create closure that stores that information needed for the add friend functionality;
            const closure = function () {
                const friend_id = obj.user_id;
                return async () => {
                    await add_friend(friend_id);
                    await load_friends();
                }
            }
            //Add event listener
            div.addEventListener('click', closure());
        });
    }
}

/**
 * A function that sends a post request to add a friend. First check if you already the user's friend
 * if so, we don't do anything. If not, then go through.
 * @param {string} friend_id The user_id of the friend
 */
async function add_friend(friend_id) {
    const result = await fetch(`https://music-matcher-326.herokuapp.com/friends/${friend_id}`);
    const findFriend = result.json()
    findFriend.then(async value => {
        if (value == true) {
            alert("You already added this friend!");
        }
        else {
            const response = await fetch(`https://music-matcher-326.herokuapp.com/createFriend/${friend_id}`, { method: 'POST' });
            alert("Friend Added!");
            return response;
        }
    });
}

/**
 * A wrapper that sets up the chirp, adds it to the database, and posts in on html
 */
async function post_chirp_wrapper() {
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
 * Embed a track, album, playlist or artist given the spotify url
 * @param {String} spotify_url The url of the spotify playlist/song to embed
 * @param {HTMLelement} divElem The div elem to add the embedded link to
 */
function embed_link(spotify_url, divElem) {
    //track
    if (/https:\/\/open.spotify.com\/track\/.*/.test(spotify_url)) {

        const iframe = document.createElement("iframe");

        console.log("Setting up iframe styling");

        iframe.src = "https://open.spotify.com/embed?uri=spotify:track:" + spotify_url.split("/")[4].split("?")[0];
        iframe.width = "300";
        iframe.height = "200";
        iframe.allowTransparency = "true";
        iframe.allow = "encrypted-media";

        divElem.appendChild(iframe);
    }
    //playlist
    else if (/https:\/\/open.spotify.com\/playlist\/.*/.test(spotify_url)) {

        const iframe = document.createElement("iframe");

        console.log("Setting up iframe styling");

        iframe.src = "https://open.spotify.com/embed?uri=spotify:playlist:" + spotify_url.split("/")[4].split("?")[0];
        iframe.width = "300";
        iframe.height = "200";
        iframe.allowTransparency = "true";
        iframe.allow = "encrypted-media";

        divElem.appendChild(iframe);
    }
    //album
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
    //artist
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
}

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
//Search function for search button
document.getElementById('searchButton').addEventListener('click', search);

//Delete everything when called
document.getElementById('delete_profile_btn').addEventListener('click', async () => {
    await fetch('https://music-matcher-326.herokuapp.com/deleteProfile', { method: 'DELETE' });
    await fetch('https://music-matcher-326.herokuapp.com/deleteFriend', { method: 'DELETE' })
    window.location.href = '/login';
});
//On load
await load_profile();
await load_friends();
await load_feed();


console.log("FINISHED LOADING");
