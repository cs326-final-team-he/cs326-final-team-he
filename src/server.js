const  {CLIENT_ID, CLIENT_SECRET} = require('./secrets.json');
const path = require('path');
const express = require('express');

//Postgres DB stuff
const {Pool} = require('pg');
const pool = new Pool( {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
/**
 * We will be adding APIs on server side here
 */

/**
 * CREATE ENDPOINT
 */
/**
 * Will create and store profile data regarding the user and add it to the database
 * @param {JSON[]} profileDB: database of profiles
 * @param {number} id: id of profile that is being created
 * @param {string} user_name: username for profile that is being created
 * @param {string} favorite_song: favorite song for new profile being created 
 * @param {string} favorite_genre: favorite genre for new profile being created 
 * @param {string} favorite_artist: favorite genre for new profile being created
 * @param {string} spotify_account: link for associated spotify account
 * @param {string} playlist: link to the users's playlist
 * @param {JSON[]} friends: list of friends to be added
 */
function createProfile(profileDB, id, user_name, favorite_song, favorite_genre, favorite_artist, spotify_account, playlist, friends){
    const newProfileInfo = {
        'user_name': user_name,
        'favorite_song': favorite_song,
        'favorite_genre': favorite_genre,
        'favorite_artist': favorite_artist,
        'spotify_account': spotify_account,
        'playlist': playlist,
        'friends': friends 
    };
  
    profileDB.push({'id': id, 'json': newProfileInfo});
}
/** 
 * Will create and store a chirp post and add it to the database. Since nobody has seen the post yet, likes and shares will be set to 0. 
 * @param {JSON[]} chirpDB: database of chirps
 * @param {number} id: id of chirp that is being created
 * @param {string} user_name: name of person who posted the chirp
 * @param {string} shared_song_name: name of song to be shared
 * @param {string} shared_song: link of song to be shared
 */
function createChirp(chirpDB, id, user_name, shared_song_name, shared_song){
    const newChirpInfo = {
        'user_name': user_name,
        'shared_song_name': shared_song_name,
        'shared_song': shared_song,
        'like_count': 0,
        'share_count': 0
    };
    
    chirpDB.push({'id': id, 'json': newChirpInfo});
}


/**
 * READ ENDPOINT
 */


// /**
//  * Reads profile data of the user
//  * Used generally to retreive data regarding the user
//  * @return {JSON} Returns json object
//  */
// function getProfile() {
//     return {
//         user_name: faker.faker.name.fullName(),
//         user_id: faker.faker.datatype.uuid(),
//         spotify_account: faker.faker.internet.domainName(),
//         playlist: faker.faker.internet.domainName(),
//         favorite_song: faker.faker.music.songName(),
//         favorite_genre: faker.faker.music.genre(),
//         favorite_artist: faker.faker.name.fullName(),
//         friends: [
//             {
//                 user_name: faker.faker.name.fullName(),
//                 user_id: faker.faker.datatype.uuid(),
//                 favorite_song: faker.faker.music.songName(),
//                 recent_shared: {
//                     shared_song: faker.faker.music.songName()
//                 }
//             }
//         ],
//     };
// }

// /**
//  * Reads a specific chirp whenever it is clicked on for more information by a user
//  * @return {JSON} Returns json object containing data like content, shared music, like count, comments
//  */
// function getChirp() {
//     return {
//         user_name: faker.faker.name.fullName(),
//         chirp_text: faker.faker.lorem.paragraph(2),
//         shared_song_name: faker.faker.music.songName(),
//         shared_song: faker.faker.internet.domainName(),
//         like_count: faker.faker.datatype.number(1000),
//         share_count: faker.faker.datatype.number(1000)
//     };
// }


/**
 * UPDATE ENDPOINT
 */
/**
 * Updates a specific profile using putJSON
 * @param {JSON} updatedProfile: the updated profile content. MUST HAVE THE SAME USER_ID AS ORIGINAL
 * @returns: response code based on result
 */
async function putProfile(updatedProfile) {
    try {
        const client = await pool.connect();
        const result = await client.query(`UPDATE profiles SET 
                        user_name = '${updatedProfile.user_name}',
                        user_id = '${updatedProfile.user_id}',
                        spotify_account = '${updatedProfile.spotify_account}',
                        playlist = '${updatedProfile.playlist}',
                        favorite_song = '${updatedProfile.favorite_song}', 
                        favorite_genre = '${updatedProfile.favorite_genre}',
                        favorite_artist = '${updatedProfile.favorite_artist}', 
                        friends = '${updatedProfile.friends}'
                        WHERE user_id = '${updatedProfile.user_id}';`);
        client.release();
        return 200;
    } catch (err) {
        return 404;
    }
}

/**
 * Updates a specific chirp using putJSON
 * @param {JSON} updatedChirp: the updated chirp content. MUST CONTAIN ALL ELEMENTS OF CHIRP
 * @returns: response code based on result
 */
async function putChirp(updatedChirp) {
    try {
        const client = await pool.connect();
        const result = await client.query(`UPDATE profiles SET 
                        user_name = '${updatedChirp.user_name}',
                        chirp_text = '${updatedChirp.chirp_text}',
                        shared_song_name = '${updatedChirp.shared_song_name}',
                        shared_song = '${updatedChirp.shared_song}',
                        like_count = '${updatedChirp.like_count}', 
                        share_count = '${updatedChirp.share_count}';`);
        client.release();
        return 200;
    } catch (err) {
        return 404;
    }}

/**
 * DELETE ENDPOINT
 */

/**
 * Deletes a profile with id using
 * @param {number} id: the id of the profile you want to delete
 * @returns: the corresponding code (whether the delete was successful or not)
 */
async function deleteProfile(id) {
    try {
        const client = await pool.connect();
        const result = await cient.query(`DELETE FROM profiles WHERE user_id = ${id};`)
        client.release();
        return 200;
    } catch (err) {
        return 404;
    }
}

/**
 * 
 * @param {number} id: the id of the chirp 
 * @returns: corresponding response code
 */
 async function deleteChirp(user_name, chirp_text) {
    try {
        const client = await pool.connect();
        const result = await client.query(`DELETE FROM chirps WHERE user_name = '${user_name}' AND chirp_text = '${chirp_text}';`);
        client.release();
        return 200;
    } catch (err) {
        return 404;
    }
}


/**
 * Server calls
 */

 const app = express();
 let port = process.env.PORT;
 if (port == null || port == "") {
   port = 8000;
 }
app.use(express.json()); // Middleware allows us to use JSON
app.use(express.static(path.join(__dirname, "/public")));

//on server startup
app.get('/', async (req, res) => {
    console.log(CLIENT_ID);
    console.log(CLIENT_SECRET);
    const authParams = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grand_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET 
    }
    const result = await fetch('https://acounts.spotify.com/api/token', authParams);
    const json = result.json();
    console.log(data);
    res.send(200);
});

app.get('/Profiles', async (req, res) => { //Will get all profiles in DB
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from profiles;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error + ${err}`);
    }
});

app.get('/Profiles/:user_id', async (req, res) => { //Will get a profile based on provided user_id
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from profiles where user_id=${req.params.user_id};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error + ${err}`);
    }
});

app.get('/Chips/:user_name', async (req, res) => { //Will get all chirps posted by user
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where user_name=${req.params.user_name};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error + ${err}`);
    }
});

app.get('/Chirps', async (req, res) => { //Will get all chirps in DB
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error + ${err}`);
    }
});

app.post('/createProfile', async (req, res) => { // For CREATE PROFILE
    try {
        const client = await pool.connect();
        await client.query(`CREATE TABLE IF NOT EXISTS profiles (user_name VARCHAR(50), user_id SERIAL, spotify_account VARCHAR(50), playlist VARCHAR(100), favorite_song VARCHAR(50), favorite_genre VARCHAR(50), favorite_artist VARCHAR(50);`);
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const post = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO profiles (user_name, user_id, spotify_account, playlist, favorite_song, favorite_genre, favorite_artist)
                            VALUES ('${post.user_name}', '${post.user_id}',
                                '${post.spotify_account}', '${post.playlist}',
                                '${post.favorite_song}', '${post.favorite_genre}',
                                '${post.favorite_artist}')`);
            client.release();
        });

        res.status(200).send();
    } catch(err) {
        res.status(404).send(`Error + ${err}`);
    }
});

app.post('/createChirp', async (req, res) => { // For CREATE CHIRP
    try {
        const client = await pool.connect();
        await client.query(`CREATE TABLE IF NOT EXISTS chirps (user_name VARCHAR(50), chirp_text VARCHAR(250), shared_song_name VARCHAR(50), shared_song VARCHAR(100), link_count INT, share_count INT);`);
        client.release();
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const post = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO chirps (user_name, chirp_text, shared_song_name, shared_song, like_count, share_count)
                VALUES ('${post.user_name}', '${post.chirp_text}',
                    '${post.shared_song_name}', '${post.shared_song}',
                    '${post.like_count}', '${post.share_count}')`);
        });
        client.release();
        res.status(200).send();
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }

});

//PUT request for user (editing a profile) SHOULD NOT BE USED FOR CREATING A USER
app.put('/putProfile', async (req, res) => {
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const updatedProfile = JSON.parse(body);
            const status = await putProfile(updatedProfile);
            res.status(status);
            if (status === 200) {
                res.send('Successfully updated profile with id: ' + updatedProfile.user_id);
            } else {
                res.send('ERROR with request');
            }
        });
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

//PUT request for chirp (editing a post)
app.put('/putChirp', async (req, res) => {
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const status = await putChirp(JSON.parse(body));
            res.status(status);
            if (status === 200) {
                res.send('Successfully updated chirp');
            } else {
                res.send('ERROR with request');
            }
        });
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

//DELETE request for user (delete profile)
app.delete('/deleteProfile', async (req, res) => { // For DELETE
    const { id } = req.params;
    const status = await deleteProfile(id);
    res.status(status).send("Got a DELETE request for profile");
});

//DELETE request for chirp (delete post)
app.delete('/deleteChirp', (req, res) => { // For DELETE
    const { user_name, chirp_text } = req.params;
    const status = deleteChirp(user_name, chirp_text);
    res.status(status).send("Got a DELETE request for chirp");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
