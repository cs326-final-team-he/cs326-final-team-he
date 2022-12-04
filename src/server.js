// const secrets = require('./secrets.json');
// const CLIENT_ID = secrets.CLIENT_ID;
// const CLIENT_SECRET = secrets.CLIENT_SECRET
const path = require('path');
const express = require('express');

//Postgres DB stuff
const {Pool} = require('pg');
const { stat } = require('fs');
const pool = new Pool( {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

//clean up text so no horribly bad things happen to databases
/**
 * 
 * @param {string} str 
 * @returns string
 */
function cleanText(str) {
    return str.split('').map(char => {
        if (char === "'") {
            return "''";
        } else {
            return char;
        }
    }).join('');
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
        const result = await client.query(`DELETE FROM profiles WHERE user_id = ${id};`)
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

async function deleteLike(user_id, chirp_id) {
    try {
        const client = await pool.connect();
        const result = await client.query(`DELETE FROM likedChirps WHERE user_id = '${user_id}' AND chirp_id = '${chirp_id}';`);
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
            (chirp_id SERIAL PRIMARY KEY, timestamp BIGINT, user_name VARCHAR(50), user_id VARCHAR(50), 
            chirp_text VARCHAR(250), shared_song VARCHAR(100), like_count INT, share_count INT);`);

        // await client.query('DROP TABLE profiles;'); // DO NOT RUN UNLESS WANT TO DROP PROFILES TABLE

        // await client.query(`CREATE TABLE IF NOT EXISTS profiles 
        //     (user_name VARCHAR(50), user_id SERIAL PRIMARY KEY, spotify_account VARCHAR(50), playlist VARCHAR(100), 
        //     favorite_song VARCHAR(100), favorite_genre VARCHAR(50), favorite_artist VARCHAR(50));`);

        await client.query(`CREATE TABLE IF NOT EXISTS profiles 
            (user_name VARCHAR(50), user_id VARCHAR(50) PRIMARY KEY, spotify_account VARCHAR(50), playlist VARCHAR(100), 
            favorite_song VARCHAR(100), favorite_genre VARCHAR(50), favorite_artist VARCHAR(50));`);
        
        //adding friends table as well...
        await client.query(`CREATE TABLE IF NOT EXISTS friends (user_id VARCHAR(50), friend_id VARCHAR(50));`);

        //adding likedChirps table...
        await client.query(`CREATE TABLE IF NOT EXISTS likedChirps (user_id VARCHAR(50), chirp_id: INT);`);


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

app.get('/Chirps/:user_id', async (req, res) => { //Will get all chirps posted by user
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where user_id=${req.params.user_id};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/Chirps/:chirp_id', async (req, res) => { //Gets specific chirp
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where chirp_id=${req.params.chirp_id};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
})


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
                            VALUES (
                                '${cleanText(post.user_name)}', 
                                '${cleanText(post.user_id)}',
                                '${cleanText(post.spotify_account)}', 
                                '${cleanText(post.playlist)}',
                                '${cleanText(post.favorite_song)}', 
                                '${cleanText(post.favorite_genre)}',
                                '${cleanText(post.favorite_artist)}')
                                ON CONFLICT (user_id) DO NOTHING;`);
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
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO chirps 
            (chirp_id, timestamp, user_name, user_id, chirp_text, shared_song, like_count, share_count)
            VALUES (
                DEFAULT,
                '${timestamp}',
                '${cleanText(post.user_name)}',
                '${cleanText(post.user_id)}',
                '${cleanText(post.chirp_text)}',
                '${cleanText(post.shared_song)}',
                '${post.like_count}',
                '${post.share_count}');`);
            client.release();
        });
        res.status(200).send();
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }

});

app.post('/createLike', async(req, res) => {
    try{
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () => {
            const post = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO likedChirps (user_id, chirp_id)
                VALUES ('${post.user_id}, '${post.chirp_id});`);
        });
        res.status(200).send();
    }
    catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.post('/createFriend', async (req, res) => {
    try {
        let body = '';
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
            const client = await pool.connect();
            // Removing 'friends' field for now
            const result = await client.query(`UPDATE profiles SET
                    user_name = '${cleanText(updatedProfile.user_name)}',
                    user_id = '${cleanText(updatedProfile.user_id)}',
                    spotify_account = '${cleanText(updatedProfile.spotify_account)}',
                    playlist = '${cleanText(updatedProfile.playlist)}',
                    favorite_song = '${cleanText(updatedProfile.favorite_song)}', 
                    favorite_genre = '${cleanText(updatedProfile.favorite_genre)}',
                    favorite_artist = '${cleanText(updatedProfile.favorite_artist)}' 
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
            const result = await client.query(`UPDATE chirps SET 
                    chirp_id = '${updatedChirp.chirp_id}',
                    timestamp = '${updatedChirp.timestamp}',
                    user_name = '${cleanText(updatedChirp.user_name)}',
                    chirp_text = '${cleanText(updatedChirp.chirp_text)}',
                    shared_song = '${cleanText(updatedChirp.shared_song)}',
                    like_count = '${updatedChirp.like_count}', 
                    share_count = '${updatedChirp.share_count}',
                    user_id = '${updatedChirp.user_id}'
                    WHERE chirp_id = '${updatedChirp.chirp_id}';`);
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
app.delete('/deleteChirp/:chirp_id', (req, res) => { // For DELETE
    const { chirp_id } = req.params;
    const status = deleteChirp(chirp_id);
    res.status(status).send("Got a DELETE request for chirp");
});

//DELETE request for friends (delete friend)
app.delete('/deleteFriend/:user_id/:friend_id', (req, res) => {
    const {user_id, friend_id} = req.params;
    const status = deleteFriend(user_id, friend_id);
    res.status(status).send("Got a DELETE request for friend");
});

app.delete('/deleteLike/:user_id/:chirp_id', (req, res) => {
    const {user_id, chirp_id} = req.params;
    const status = deleteLike(user_id, chirp_id);
    res.status(status).send("Got a DELETE request for a like");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
