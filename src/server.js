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
 * We will be adding APIs on server side here
 */


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
        // Removing 'friends' field for now
        const select_user_id_result = await client.query(`SELECT * FROM profiles;`); // test query on profile
        if (select_user_id_result.rowCount > 0) { // if user exists in table
             const result = await client.query(`UPDATE profiles SET
                        user_name = '${updatedProfile.user_name}',
                        user_id = '${updatedProfile.user_id}',
                        spotify_account = '${updatedProfile.spotify_account}',
                        playlist = '${updatedProfile.playlist}',
                        favorite_song = '${updatedProfile.favorite_song}', 
                        favorite_genre = '${updatedProfile.favorite_genre}',
                        favorite_artist = '${updatedProfile.favorite_artist}', 
                        WHERE user_id = '${updatedProfile.user_id}';`);
        }
        else {
            // User not in table yet, create entry for them
            const result = await client.query(`INSERT INTO profiles (user_name, user_id, spotify_account, playlist, favorite_song, favorite_genre, favorite_artist)
                            VALUES ('${updatedProfile.user_name}', '${updatedProfile.user_id}',
                                '${updatedProfile.spotify_account}', '${updatedProfile.playlist}',
                                '${updatedProfile.favorite_song}', '${updatedProfile.favorite_genre}',
                                '${updatedProfile.favorite_artist}');`);
        }
       
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
        const result = await client.query(`UPDATE chirp SET 
                        user_name = '${updatedChirp.user_name}',
                        chirp_text = '${updatedChirp.chirp_text}',
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
            (user_name VARCHAR(50), chirp_text VARCHAR(250), shared_song VARCHAR(100), like_count INT, share_count INT);`);

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
        res.status(404).send(`Error + ${err}`);
    }
})

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

app.get('/Chirps/:user_name', async (req, res) => { //Will get all chirps posted by user
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where user_name=${req.params.user_name};`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error + ${err}`);
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
        res.status(404).send(`${err}`);
    }
});

app.get('/Friends', async (req, res) => { //GETS FRIEND CONNECTIONS FOR EVERYBODY
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from friends;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`${err}`)
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
        res.status(404).send(`Error + ${err}`);
    }
});

app.post('/createChirp', async (req, res) => { // For CREATE CHIRP
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const post = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`INSERT INTO chirps (user_name, chirp_text, shared_song, like_count, share_count)
                VALUES ('${post.user_name}', '${post.chirp_text}',
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
