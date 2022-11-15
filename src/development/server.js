const faker = require ('@faker-js/faker');
// const fetch = (...args) =>
// 	import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
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
 * Function representing the put functionality of REST api. Idempotent, creates new object if id does not exist, 
 * updates existing one if it does.
 * 
 * @param {JSON[]} database the database we're putting obj with id into
 * @param {number} id the id (key) of the object we're updating
 * @param {JSON} obj the data with updated content
 * @returns a response code based on what the result was. 200 for update, 202 for creation
 */
function putJSON(database, id, obj) {
    //if object does not exist in database yet, create it
    const index = database.findIndex(elem => elem['id'] === id);
    let code = 200;
    if (index === -1) {
        console.log('created new object with id: ' + id);
        database.push({'id': id, 'json': json});
        code = 202;
    } else {
        database[i]['id']['json'] = obj;
    }

    return code;
}
/**
 * Updates a specific profile using putJSON
 * @param {JSON[]} profileDB: database of profiles
 * @param {number} id: id of specific profile
 * @param {JSON} profile: the updated profile content
 * @returns: response code based on result
 */
function putProfile(profileDB, id, profile) {
    return putJSON(profileDB, id, profile);
}

/**
 * Updates a specific chirp using putJSON
 * @param {JSON[]} profileDB: database of chirps
 * @param {number} id: id of specific chirp
 * @param {JSON} profile: the updated chirp content
 * @returns: response code based on result
 */
function putChirp(chirpDB, id, chirp) {
    return putJSON(chirpDB, id, chirp);
}

/**
 * DELETE ENDPOINT
 */

/**
 * Deletes a given json object from the database. If the object does not exist, throws an error
 * @param {JSON[]} database: the database of JSON objects to delete from 
 * @param {number} id: the id of the object you want to delete
 * @returns: the corresponding code (whether the delete was successful or not)
 */
function deleteJSON(database, id) {
    let code = database.findIndex(elem => elem['id'] === id);
    if (code === -1) {
        return 404;
    } else {
        database.splice(code, 1);
        code = 200;
    }
    return code;
}

/**
 * Deletes a profile with id using
 * @param {JSON[]} profileDB: the database of profiles to delete from 
 * @param {number} id: the id of the profile you want to delete
 * @returns: the corresponding code (whether the delete was successful or not)
 */
function deleteProfile(profileDB, id) {
    return deleteJSON(profileDB, id);
}

/**
 * 
 * @param {JSON[]} chirpDB: the database of chirps to delete from 
 * @param {number} id: the id of the chirp 
 * @returns: corresponding response code
 */
function deleteChirp(chirpDB, id) {
    return deleteJSON(chirpDB, id);
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
/**
 * dummy databases
 */
const profiledb = [];
const chirpdb = [];

let id = 0; 

app.use(express.json()); // Middleware allows us to use JSON
app.use(express.static(path.join(__dirname, "/public")));

// request is incoming data, response is outgoing data

app.get('/Profile', (req, res) => { // Request to get profile
    const result = getProfile();
    res.send(result);
});

app.get('/Chirp', (req, res) => {
    const result = getChirp();
    res.send(result);
});

app.post('/createProfile', (req, res) => { // For CREATE PROFILE
    let body = '';
    req.on('data', data => body += data);
    req.on('end', () =>{
        const post = JSON.parse(body);
        profiledb.push({id: id, json: post});
        id = id + 1; 
    });
    res.sendSatus(200);
});

app.post('/createChirp', (req, res) => { // For CREATE CHIRP
    let body = '';
    req.on('data', data => body += data);
    req.on('end', () =>{
        const post = JSON.parse(body);
        chirpdb.push({id: id, json: post});
        id = id + 1;
    });
    res.sendSatus(200);
});


app.put('/', (req, res) => { // For UPDATE
    res.send("Got a PUT request at /");
});

//PUT request for user (editing a profile) SHOULD NOT BE USED FOR CREATING A USER
app.put('/putProfile', (req, res) => {
    const { id, profile } = req.params;
    const status = putProfile(profiledb, id, profile);
    res.status(status);
    if (status === 200) {
        res.send('Successfully updated profile with id: ' + id);
    } else if (status === 202) {
        res.send('Created a new profile with id: ' + id);
    } else {
        res.status(404).send('ERROR with request');
    }
});

//PUT request for chirp (editing a post)
app.put('/putChirp', (req, res) => {
    const { id, chirp } = req.params;
    const status = putChirp(chirpdb, id, chirp);
    res.status(status);
    if (status === 200) {
        res.send('Successfully updated chirp with id: ' + id);
    } else if (status === 202) {
        res.send('Created a new chirp with id: ' + id);
    } else {
        res.status(404).send('ERROR with request');
    }
});

//DELETE request for user (delete profile)
app.delete('/deleteProfile', (req, res) => { // For DELETE
    const { id } = req.params;
    const status = deleteProfile(profiledb, id);
    res.status(status).send("Got a DELETE request at /user");
});

//DELETE request for chirp (delete post)
app.delete('/deleteChirp', (req, res) => { // For DELETE
    const { id } = req.params;
    const status = deleteChirp(chirpdb, id);
    res.status(status).send("Got a DELETE request at /chirp");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
