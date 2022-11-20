// const secrets = require('./secrets.json');
// const CLIENT_ID = secrets.CLIENT_ID;
// const CLIENT_SECRET = secrets.CLIENT_SECRET
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
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 */
 function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
/**
 * We will be adding APIs on server side here
 */



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
 async function deleteChirp(id) {
    try {
        const client = await pool.connect();
        const result = await client.query(`DELETE FROM chirps WHERE chirp_id = ${id};`);
        client.release();
        return 200;
    } catch (err) {
        return 404;
    }
}

async function deleteFriend(user_id, friend_id) {
    try{
        const client = await pool.connect();
        const result = await client.query(`DELETE FROM friends WHERE user_id = '${user_id}' AND friend_id = '${friend_id}';`);
        client.release();
        return 200;
    }   catch (err){
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
// app.get('/', async (req, res) => {
//     const authParams = {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         body: 'grand_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET 
//     }
//     const result = await fetch('https://acounts.spotify.com/api/token', authParams);
//     const json = result.json();
//     res.status(200).send(json);
// });

// Test loading all tables beforehand on startup
app.get('/loadFeed', async (req, res) => {
    try {
        const client = await pool.connect();

        // Start off with creating chirps table
        await client.query(`CREATE TABLE IF NOT EXISTS chirps 
            (chirp_id INT, timestamp INT, user_name VARCHAR(50), chirp_text VARCHAR(250), shared_song VARCHAR(100), like_count INT, share_count INT);`);

        // await client.query('DROP TABLE profiles;'); // DO NOT RUN UNLESS WANT TO DROP PROFILES TABLE

        // await client.query(`CREATE TABLE IF NOT EXISTS profiles 
        //     (user_name VARCHAR(50), user_id SERIAL PRIMARY KEY, spotify_account VARCHAR(50), playlist VARCHAR(100), 
        //     favorite_song VARCHAR(100), favorite_genre VARCHAR(50), favorite_artist VARCHAR(50));`);

        await client.query(`CREATE TABLE IF NOT EXISTS profiles 
            (user_name VARCHAR(50), user_id VARCHAR(50) PRIMARY KEY, spotify_account VARCHAR(50), playlist VARCHAR(100), 
            favorite_song VARCHAR(100), favorite_genre VARCHAR(50), favorite_artist VARCHAR(50));`);
        
        //adding friends table as well...
        await client.query(`CREATE TABLE IF NOT EXISTS friends (user_id VARCHAR(50), friend_id VARCHAR(50));`);


        client.release();

        // Now try loading feed
        const client_2 = await pool.connect();
        const result = await client.query(`SELECT * from chirps;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
})

app.get('/Profiles', async (req, res) => { //Will get all profiles in DB
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from profiles;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/Profiles/:user_id', async (req, res) => { //Will get a profile based on provided user_id
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from profiles where user_id=${req.params.user_id};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/Chirps/:user_name', async (req, res) => { //Will get all chirps posted by user
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where user_name=${req.params.user_name};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/Friends/:user_id', async (req, res) => { //Will get all friends from specific user_id
    try{
        const client = await pool.client();
        const result = await client.query(`SELECT * from friends where user_id=${req.params.user_id};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err){
        res.status(404).send(`Error: ${err}`)
    }
});

app.get('/Friends/:user_id', async (req, res) => { //Will get all friends from specific user_id
    try{
        const client = await pool.client();
        const result = await client.query(`SELECT * from friends where user_id=${req.params.user_id};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err){
        res.status(404).send(`Error + ${err}`)
    }
});

app.get('/Chirps', async (req, res) => { //Will get all chirps in DB
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/Friends', async (req, res) => { //GETS FRIEND CONNECTIONS FOR EVERYBODY
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from friends;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`)
    }
});

app.post('/createProfile', async (req, res) => { // For CREATE PROFILE
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const post = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO profiles (user_name, user_id, spotify_account, playlist, favorite_song, favorite_genre, favorite_artist)
                            VALUES ('${post.user_name}', '${post.user_id}',
                                '${post.spotify_account}', '${post.playlist}',
                                '${post.favorite_song}', '${post.favorite_genre}',
                                '${post.favorite_artist}');`);
            client.release();
        });

        res.status(200).send();
    } catch(err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.post('/createChirp', async (req, res) => { // For CREATE CHIRP
    try {
        let body = '';
        const timestamp = new Date().getTime();
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const post = JSON.parse(body);
            const chirp_id = hashCode(`${post.user_name}${timestamp}`);
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO chirps (chirp_id, timestamp, user_name, chirp_text, shared_song, like_count, share_count)
            VALUES ('${chirp_id}', '${timestamp}', '${post.user_name}', '${post.chirp_text}',
                    '${post.shared_song}',
                    '${post.like_count}', '${post.share_count}');`);
            client.release();
        });
        res.status(200).send();
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }

});

app.post('/createFriend', async (req, res) => {
    try {
        let body = ' ';
        req.on('data', data => body += data);
        req.on('end', async () => {
            const post = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO friends (user_id, friend_id)
                VALUES ('${post.user_id}', '${post.friend_id}');`);
        });
        res.status(200).send();
    }
    catch (err) {
        res.status(404).send(`Error: ${err}`)
    }
});



//PUT request for user (editing a profile) SHOULD NOT BE USED FOR CREATING A USER
app.put('/putProfile', async (req, res) => {
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const updatedProfile = JSON.parse(body);
            const client = await pool.connect();
            // Removing 'friends' field for now
            const result = await client.query(`UPDATE profiles SET
                    user_name = '${updatedProfile.user_name}',
                    user_id = '${updatedProfile.user_id}',
                    spotify_account = '${updatedProfile.spotify_account}',
                    playlist = '${updatedProfile.playlist}',
                    favorite_song = '${updatedProfile.favorite_song}', 
                            favorite_song = '${updatedProfile.favorite_song}', 
                    favorite_song = '${updatedProfile.favorite_song}', 
                    favorite_genre = '${updatedProfile.favorite_genre}',
                    favorite_artist = '${updatedProfile.favorite_artist}' 
                            favorite_artist = '${updatedProfile.favorite_artist}' 
                    favorite_artist = '${updatedProfile.favorite_artist}' 
                    WHERE user_id = '${updatedProfile.user_id}';`);
            client.release();
        });
        res.status(200).send();
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
            const updatedChirp = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`UPDATE chirp SET 
                            chirp_id = '${updatedChirp.chirp_id}',
                            timestamp = '${updatedChirp.timestamp}'
                            user_name = '${updatedChirp.user_name}',
                            chirp_text = '${updatedChirp.chirp_text}',
                            shared_song = '${updatedChirp.shared_song}',
                            like_count = '${updatedChirp.like_count}', 
                            share_count = '${updatedChirp.share_count}'
                            WHERE chirp_id = '${updatedChirp.chirp_id}';`);
                            //TODO: we need to give chirps an id
            client.release();
            //nothing was updated bc no chirp matched the requirements
            if (result.rowCount === 0) {
                res.status(304).send();
            }
        });
        res.status(200).send();
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

//DELETE request for user (delete profile)
app.delete('/deleteProfile/:user_id', async (req, res) => { // For DELETE
    const { user_id } = req.params;
    const status = await deleteProfile(user_id);
    res.status(status).send("Got a DELETE request for profile");
});

//DELETE request for chirp (delete post)
app.delete('/deleteChirp/:user_name/:chirp_text', (req, res) => { // For DELETE
    const { user_name, chirp_text } = req.params;
    const status = deleteChirp(user_name, chirp_text);
    res.status(status).send("Got a DELETE request for chirp");
});

//DELETE request for friends (delete friend)
app.delete('/deleteFriend/:user_id/:friend_id', (req, res) => {
    const {user_id, friend_id} = req.params;
    const status = deleteFriend(user_id, friend_id);
    res.status(status).send("Got a DELETE request for friend");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
