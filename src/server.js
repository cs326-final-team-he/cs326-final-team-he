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

// Session configuration

const session = {
    secret : process.env.SECRET || 'SECRET', // set this encryption key in Heroku config (never in GitHub)!
    resave : false,
    saveUninitialized: false
};

// Passport configuration

const strategy = new LocalStrategy(
    async (username, password, done) => {
	if (!findUser(username)) {
	    // no such user
	    await new Promise((r) => setTimeout(r, 2000)); // two second delay
	    return done(null, false, { 'message' : 'Wrong username' });
	}
	if (!validatePassword(username, password)) {
	    // invalid password
	    // should disable logins after N messages
	    // delay return to rate-limit brute-force attacks
	    await new Promise((r) => setTimeout(r, 2000)); // two second delay
	    return done(null, false, { 'message' : 'Wrong password' });
	}
	// success!
	// should create a user object here, associated with a unique identifier
	return done(null, username);
    });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
// App configuration
const app = express();

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

function checkLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
	// If we are authenticated, run the next route.
        console.log(req);
	    next();
    } else {
	// Otherwise, redirect to the login page.
	    res.redirect('/login');
    }
}
app.get('/', checkLoggedIn, async (req, res) => {
    res.redirect('/main');
});

/**
 * I don't get how we get user but ok
 */
app.get('/main', checkLoggedIn, (req, res) => {
    return res.redirect(`/main/:${req.user}`)
});
app.get('/main/:user_id', checkLoggedIn, (req, res) => {
    return res.sendFile('public/main.html', { 'root' : __dirname })
});
app.get('/loadFeed', checkLoggedIn, async (req, res) => {
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


        client.release();

        //retrieve userId
        const user_id = req.params.userId;
        //retrieve profile
        const profile = await client.query('SELECT * FROM profiles WHERE user_id = $1;', [user_id]);
        // Now try loading feed
        const result = await client.query(`SELECT * from chirps;`);
        client.release();
        res.status(200).json({"profile": profile.rows[0], "chirps": result.rows});
    } catch (err) {
        res.status(404).json({"Error": `Error: ${err}`});
    }
})

app.get('/login', (req, res) => {
    return res.sendFile('public/login.html', { 'root' : __dirname })
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

app.post('/register', async (req, res) => { // For CREATE PROFILE
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

        res.redirect('/login')
    } catch(err) {
        res.status(404).send(`Error: ${err}`);
    }
});
// Test loading all tables beforehand on startup

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
            const updatedChirp = JSON.parse(body);
            const client = await pool.connect();
            const result = await client.query(`UPDATE chirp SET 
                    chirp_id = '${updatedChirp.chirp_id}',
                    timestamp = '${updatedChirp.timestamp}'
                    user_name = '${cleanText(updatedChirp.user_name)}',
                    chirp_text = '${cleanText(updatedChirp.chirp_text)}',
                    shared_song = '${cleanText(updatedChirp.shared_song)}',
                    like_count = '${updatedChirp.like_count}', 
                    share_count = '${updatedChirp.share_count}'
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

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
