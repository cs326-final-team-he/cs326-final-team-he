// const secrets = require('./secrets.json');
// const CLIENT_ID = secrets.CLIENT_ID;
// const CLIENT_SECRET = secrets.CLIENT_SECRET
const path = require('path');
const express = require('express');
const expressSession = require('express-session');  // for managing session state
const passport = require('passport');               // handles authentication
const LocalStrategy = require('passport-local').Strategy; // username/password strategy

//Postgres DB stuff
const {Pool} = require('pg');
const { stat } = require('fs');

//encryption
const { MiniCrypt } = require('./miniCrypt');
const { ChildProcess } = require('child_process');
const mc = new MiniCrypt();

// Session configuration

const session = {
    secret : process.env.SECRET || 'SECRET', // set this encryption key in Heroku config (never in GitHub)!
    resave : false,
    saveUninitialized: false
};

// Passport configuration

const strategy = new LocalStrategy(
	{
		usernameField: 'user_id'
	},

    async (user_id, password, done) => {
        const userExists = await findUser(user_id);
        if (!userExists) {
            // no such user
            await new Promise((r) => setTimeout(r, 2000)); // two second delay
            return done(null, false, { 'message' : 'Wrong user_id' });
        }
        const validPassword = await validatePassword(user_id, password);
        if (!validPassword) {
            // invalid password
            // should disable logins after N messages
            // delay return to rate-limit brute-force attacks
            await new Promise((r) => setTimeout(r, 2000)); // two second delay
            return done(null, false, { 'message' : 'Wrong password' });
        }
        // success!
        // should create a user object here, associated with a unique identifier
        return done(null, user_id);
    });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
// App configuration
const app = express();

app.use(express.urlencoded({'extended' : true})); // allow URLencoded data
app.use(express.json()); // Middleware allows us to use JSON
app.use(express.static(path.join(__dirname, "/public")));

app.use(expressSession(session));
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

// Convert user object to a unique identifier.
passport.serializeUser((user, done) => {
    done(null, user);
});
// Convert a unique identifier to a user object.
passport.deserializeUser((uid, done) => {
    done(null, uid);
});

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
 * Queries user id database to see if there is an existing entry with the provided user id
 * @param {string} user_id user_id key of the table
 * @returns {bool} returns bool
 */
async function findUser(user_id) { // TODO: RETURN BOOL
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT salt, hash FROM user_secrets WHERE user_id = '${user_id}';`);
        client.release();
        return result.rows.length > 0; // the [salt, hash]
    }
    catch (err) {
        return false; // Not sure if this is exactly good coding practice
    }
}

/**
 * returns true iff the password is matching
 * @param {string} user_id user_id key of the table
 * @param {string} password password input for the given user
 * @returns {bool} 
 */
async function validatePassword(user_id, password) {
    try {
        const result = await findUser(user_id);
        if (!result) {
            return false;
        }
        const client = await pool.connect();
        const res = await client.query(`SELECT salt, hash FROM user_secrets WHERE user_id = '${user_id}';`);
        
        const {salt, hash} = res.rows[0];
        client.release();

        return mc.check(password, salt, hash); // Checks provided password against salt + hash, returns true iff matching else false
    }
    catch (err) {
        return false; // Not sure if this is exactly good coding practice
    }
}

/**
 * Adds a user to the user_secrets database
 * @param {string} user_id user_id column of the database
 * @param {string} password user's password that will be hashed
 * @returns {int} returns 1 if successful, else it failed and should return an error message
 */
async function addUser(user_id, password) {
    const result = await findUser(user_id);
    if (result) {
        return 0;
        // User already exists, no need to add that user again
    }
    const [salt, hash] = mc.hash(password);
    try {
        const client = await pool.connect();
        await client.query(`INSERT INTO user_secrets (user_id, salt, hash) VALUES (
            '${cleanText(user_id)}', 
            '${salt}',
            '${hash}')
            ON CONFLICT (user_id) DO NOTHING;`);
        client.release();
        return 1;
    }
    catch (err) {
        return err;
    }
}

function checkLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
	// If we are authenticated, run the next route.
	    next();
    } else {
	// Otherwise, redirect to the login page.
	    res.redirect('/login');
    }
}
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

app.get('/', checkLoggedIn, async (req, res) => {
    res.redirect('/main');
});

app.get('/login', (req, res) => {
    return res.sendFile('public/login.html', { 'root' : __dirname })
});

// Handle logging out (takes us back to the login page).
app.get('/logout', (req, res) => {
	req.logout(function(err) {
		if (err) { return next(err); }
		res.redirect('/login');
	  });
});

/**
 * I dont know how this works TODO
 */
// Handle post data from the login.html form.
app.post('/login',
	 passport.authenticate('local' , {     // use username/password authentication
	     'successRedirect' : '/main',   // when we login, go to /private 
	     'failureRedirect' : '/login'      // otherwise, back to login
	 }));

app.get('/register', (req, res) => {
    return res.sendFile('public/register.html', { 'root' : __dirname });
});

app.post('/register', async (req, res) => {
    // const username = req.body.username;
    // const user_id = req.body.user_id;
    // const spotify = req.body.spotify;
    // const playlist = req.body.playlist;
    // const song = req.body.song;
    // const genre = req.body.genre;
    // const artist = req.body.artist;

    // const password = req.body.password;
    // const verify = req.body.verify;
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

            // Might need to create user secrets table here too

            await client.query(`CREATE TABLE IF NOT EXISTS user_secrets 
            (user_id VARCHAR(50) PRIMARY KEY, salt VARCHAR(100), hash VARCHAR(300));`);

            await addUser(post.user_id, post.password);

            client.release();
        });

        return res.status(200).send();
    } catch(err) {
        res.status(404).send(`Error: ${err}`);
    }
});

 app.get('/main/', checkLoggedIn, (req, res) => {
    return res.sendFile('public/main.html', { 'root' : __dirname });
});

// app.get('/main/:userID', checkLoggedIn, (req, res) => {
//     if (req.params.userID === req.user) {
//     }
// })

app.get('/loadFeed', checkLoggedIn, async (req, res) => {
    try {
        const client = await pool.connect();

        // Start off with creating chirps table
        // await client.query(`CREATE TABLE IF NOT EXISTS chirps 
        //     (chirp_id SERIAL PRIMARY KEY, timestamp BIGINT, user_name VARCHAR(50), user_id VARCHAR(50), 
        //     chirp_text VARCHAR(250), shared_song VARCHAR(100), like_count INT, share_count INT);`);

        // await client.query('DROP TABLE profiles;'); // DO NOT RUN UNLESS WANT TO DROP PROFILES TABLE

        // await client.query(`CREATE TABLE IF NOT EXISTS profiles 
        //     (user_name VARCHAR(50), user_id SERIAL PRIMARY KEY, spotify_account VARCHAR(50), playlist VARCHAR(100), 
        //     favorite_song VARCHAR(100), favorite_genre VARCHAR(50), favorite_artist VARCHAR(50));`);

        // await client.query(`CREATE TABLE IF NOT EXISTS profiles 
        //     (user_name VARCHAR(50), user_id VARCHAR(50) PRIMARY KEY, spotify_account VARCHAR(50), playlist VARCHAR(100), 
        //     favorite_song VARCHAR(100), favorite_genre VARCHAR(50), favorite_artist VARCHAR(100));`);
        
        //adding friends table as well...
        // await client.query(`CREATE TABLE IF NOT EXISTS friends (user_id VARCHAR(50), friend_id VARCHAR(50));`);
	    // await client.query(`CREATE TABLE IF NOT EXISTS likedChirps (user_id VARCHAR(50), chirp_id INT);`);
        // Now try loading feed
        const result = await client.query(`SELECT * from chirps ORDER BY timestamp;`);
        const out = result.rows.map(obj => {
            if (obj.user_id === req.user) {
                obj.isUser = true;
            } else {
                obj.isUser = false;
            }
            return obj;
        })
        client.release();
        res.status(200).json(out);
    } catch (err) {
        res.status(404).json({"Error": `Error: ${err}`});
    }
})
// Test loading all tables beforehand on startup

app.get('/profiles', async (req, res) => { //Will get all profiles in DB
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from profiles;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/profiles/:user_id', async (req, res) => { //Will get a profile based on provided user_id
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * FROM profiles WHERE user_id='${req.params.user_id}';`);
        client.release();
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(404).json({'error': `Error: ${err}`});
    }
});

app.get('/search', async (req, res) => {
    try {
        const search = req.query.search;
        const client = await pool.connect();
        const result = await client.query(`SELECT user_id, favorite_song FROM profiles 
            WHERE user_id LIKE '%${search}%' OR user_name LIKE '%${search}%';`);
            client.release();
            res.status(200).json(result.rows);
    }
    catch (err) {
        res.status(404).json({'Error': err});
    }
});
app.get('/sessionProfile', checkLoggedIn, (req, res) => {
    return res.redirect(`/profiles/${req.user}`);
});

app.get('/likedChirps', async(req, res) => {
    try{
        const client = await pool.connect();
        const result = await client.query('SELECT * from likedChirps;');
        client.release();
        res.status(200).send(result.rows);
    }catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/likedChirps/:chirp_id', async (req, res) => {
    try{
        const client = await pool.connect();
        const result = await client.query(`SELECT * from likedChirps WHERE user_id='${req.user}' AND chirp_id='${req.params.chirp_id}';`);
        client.release();
        if (result.rowCount == 0){
            res.status(200).send(false);
        }
        else{
            res.status(200).send(true);
        } 
    }catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});



app.get('/chirps', async (req, res) => { //Will get all chirps in DB
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/chirps/:user_id', async (req, res) => { //Will get all chirps posted by user
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where user_id='${req.params.user_id}';`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/chirps/:chirp_id', async (req, res) => { //Gets specific chirp
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where chirp_id='${req.params.chirp_id}';`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/friends/:friend_id', async (req, res) => { //Will get a specific friend connection
    try{
        const client = await pool.connect();
        const result = await client.query(`SELECT * from friends where user_id='${req.user}' AND friend_id='${req.params.friend_id}';`);
        client.release();
        if (result.rowCount == 0) {
            res.status(200).send(false);
        }
        else {
            res.status(200).send(true);
        }
    } catch (err){
        res.status(404).send(`Error: ${err}`)
    }
});

//Will get all friend connections for signed in user and corresponding favorite songs
app.get('/userFriends', async (req, res) => { 
    try{
        const client = await pool.connect();
        const result = await client.query(
            `SELECT DISTINCT friends.friend_id, profiles.favorite_song FROM friends, profiles 
            WHERE friends.user_id='${req.user}' AND friends.user_id=profiles.user_id;`);
        client.release();
        res.status(200).json(result.rows);
    } catch (err){
        res.status(404).json({'Error': err});
    }
});

app.get('/friends', async (req, res) => { //GETS FRIEND CONNECTIONS FOR EVERYBODY
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from friends;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`)
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
                '${post.share_count}')
                RETURNING chirp_id;`);
            client.release();
            res.status(200).json({'id': result.rows[0]});
        });
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
                VALUES ('${req.user}', '${post.chirp_id}');`);
        });
        res.status(200).send();
    }
    catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});


app.post('/createFriend/:friend_id', checkLoggedIn, async (req, res) => {
    try {
        const friend_id = req.params.friend_id;
        const client = await pool.connect();
        const result = await client.query(`INSERT INTO friends (user_id, friend_id)
            VALUES ('${req.user}', '${friend_id}');`);
        client.release();
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
            const updated_data = body.data;
            const client = await pool.connect();
            const result = await client.query(`UPDATE chirps SET 
                    chirp_text = '${cleanText(updated_data.text)}',
                    shared_song = '${cleanText(updated_data.song)}'
                    WHERE chirp_id = '${updated_data.chirp_id}';`);
            client.release();
            //nothing was updated bc no chirp matched the requirements
            if (result.rowCount === 0) {
                res.status(304).send();
            }
            res.status(200).send();
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
app.delete('/deleteChirp/:chirp_id', (req, res) => { // For DELETE
    const { chirp_id } = req.params;
    const status = deleteChirp(chirp_id);
    res.status(status).send("Got a DELETE request for chirp");
});

//DELETE request for friends (delete friend)
app.delete('/deleteFriend/:friend_id', checkLoggedIn, (req, res) => {
    const user_id = req.user;
    const friend_id = req.params;
    const status = deleteFriend(user_id, friend_id);
    res.status(status).send("Got a DELETE request for friend");
});

app.delete('/deleteLike/:chirp_id', async (req, res) => {
    const {chirp_id} = req.params;
    try {
        const client = await pool.connect();
        const result = await client.query(`DELETE FROM likedChirps WHERE user_id = '${req.user}' AND chirp_id = '${chirp_id}';`);
        client.release();
        return res.status(200).send();
    } catch (err) {
        return res.status(404).send();
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
