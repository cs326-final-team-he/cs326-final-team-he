const faker = require ('@faker-js/faker');
// const fetch = (...args) =>
// 	import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

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
 * READ ENDPOINT
 */


/**
 * Reads profile data of the user
 * Used generally to retreive data regarding the user
 * @return {JSON} Returns json object
 */
function getProfile() {
    return {
        user_name: faker.faker.name.fullName(),
        user_id: faker.faker.datatype.uuid(),
        spotify_account: faker.faker.internet.domainName(),
        playlist: faker.faker.internet.domainName(),
        favorite_song: faker.faker.music.songName(),
        favorite_genre: faker.faker.music.genre(),
        favorite_artist: faker.faker.name.fullName(),
        friends: [
            {
                user_name: faker.faker.name.fullName(),
                user_id: faker.faker.datatype.uuid(),
                favorite_song: faker.faker.music.songName(),
                recent_shared: {
                    shared_song: faker.faker.music.songName()
                }
            }
        ],
    };
}

/**
 * Reads a specific chirp whenever it is clicked on for more information by a user
 * @return {JSON} Returns json object containing data like content, shared music, like count, comments
 */
function getChirp() {
    return {
        user_name: faker.faker.name.fullName(),
        chirp_text: faker.faker.lorem.paragraph(2),
        shared_song_name: faker.faker.music.songName(),
        shared_song: faker.faker.internet.domainName(),
        like_count: faker.faker.datatype.number(1000),
        share_count: faker.faker.datatype.number(1000)
    };
}


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
        const client = await pool.client();
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
        const client = await pool.client();
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
        const client = await pool.client();
        const result = await pool.query(`DELETE FROM profiles WHERE user_id = ${id};`)
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
        const client = await pool.client();
        const result = await pool.query(`DELETE FROM chirps WHERE user_name = '${user_name}' AND chirp_text = '${chirp_text}';`);
        client.release();
        return 200;
    } catch (err) {
        return 404;
    }
}


/**
 * Server calls
 */

 const express = require('express');
 const app = express();
 let port = process.env.PORT;
 if (port == null || port == "") {
   port = 8000;
 }
app.use(express.json()); // Middleware allows us to use JSON
app.use(express.static(path.join(__dirname, "/public")));

// request is incoming data, response is outgoing data

app.get('/Profiles', (req, res) => { // Request to get profiles
    const client = await pool.client();
    const result = await client.query('SELECT * from profiles', (err, result) => {
        if(!err){
            res.send(result.rows);
        }
     });
     client.release();
});

app.get('/Chirps', (req, res) => { // Request to get profiles
    const client = await pool.client();
    const result = await client.query('SELECT * from cherps', (err, result) => {
        if(!err){
            res.send(result.rows);
        }
    });
    client.release();
});

app.post('/createProfile', async (req, res) => { // For CREATE PROFILE
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () =>{
            const post = JSON.parse(body);
            const client = await pool.client();
            const result = await client.query(`INSERT INTO profiles 
                            VALUES ('${post.user_name}', '${post.user_id}',
                                '${post.spotify_account}', '${post.playlist}',
                                '${post.favorite_song}', '${post.favorite_genre}',
                                '${post.favorite_artist}', '${post.friends}')`);
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
            const client = await pool.client();
            const result = await client.query(`INSERT INTO chirps 
                VALUES ('${post.user_name}', '${post.chirp_text}',
                    '${post.shared_song_name}', '${post.shared_song}',
                    '${post.like_count}', '${post.share_count}')`);
        });
        res.status(200).send();
    } catch (err) {
        res.status(404).send(`Error + ${err}`);
    }

});


app.put('/', (req, res) => { // For UPDATE
    res.send("Got a PUT request at /");
});

//PUT request for user (editing a profile) SHOULD NOT BE USED FOR CREATING A USER
app.put('/putProfile', async (req, res) => {
    const { updatedProfile } = req.params;
    const status = await putProfile(updatedProfile);
    res.status(status);
    if (status === 200) {
        res.send('Successfully updated profile with id: ' + updatedProfile.user_id);
    } else {
        res.send('ERROR with request');
    }
});

//PUT request for chirp (editing a post)
app.put('/putChirp', async (req, res) => {
    const { updatedChirp } = req.params;
    const status = await putChirp(updatedChirp);
    res.status(status);
    if (status === 200) {
        res.send('Successfully updated chirp from user: ' + updatedChirp.user_name);
    } else {
        res.send('ERROR with request');
    }
});

//DELETE request for user (delete profile)
app.delete('/deleteProfile', async (req, res) => { // For DELETE
    const { id } = req.params;
    const status = await deleteProfile(id);
    res.status(status).send("Got a DELETE request at /user");
});

//DELETE request for chirp (delete post)
app.delete('/deleteChirp', (req, res) => { // For DELETE
    const { user_name, chirp_text } = req.params;
    const status = deleteChirp(user_name, chirp_text);
    res.status(status).send("Got a DELETE request at /chirp");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
