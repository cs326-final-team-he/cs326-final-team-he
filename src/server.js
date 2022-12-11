const path = require('path');
const express = require('express');
const expressSession = require('express-session');  // for managing session state
const passport = require('passport');               // handles authentication
const LocalStrategy = require('passport-local').Strategy; // username/password strategy

//Postgres DB stuff
const { Pool } = require('pg');

//encryption
const { MiniCrypt } = require('./miniCrypt');
const mc = new MiniCrypt();

// Session configuration
const session = {
    secret: process.env.SECRET || 'SECRET', // set this encryption key in Heroku config (never in GitHub)!
    resave: false,
    saveUninitialized: false
};

// Database connection stuff
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

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
            return done(null, false, { 'message': 'Wrong user_id' });
        }
        const validPassword = await validatePassword(user_id, password);
        if (!validPassword) {
            // invalid password
            // should disable logins after N messages
            // delay return to rate-limit brute-force attacks
            await new Promise((r) => setTimeout(r, 2000)); // two second delay
            return done(null, false, { 'message': 'Wrong password' });
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

//Middleware
app.use(express.urlencoded({ 'extended': true })); // allow URLencoded data
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

/**
 * Clean up text so no horribly bad things happen to databases
 * @param {string} str 
 * @returns string cleaned up string
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
 * Queries user id database to see if there is an existing entry with the provided user id
 * @param {string} user_id user_id key of the table
 * @returns {bool} returns bool
 */
async function findUser(user_id) { 
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
        const res = await client.query(`SELECT salt, hash FROM user_secrets WHERE user_id = ${user_id};`);
        
        const [salt, hash] = res.rows[0];
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

/**
 * Intermediate server function to verify login when hitting endpoints
 */
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
        const result = await client.query(`DELETE FROM profiles WHERE user_id = '${id}';`);
        await client.query(`DELETE FROM user_secrets WHERE user_id = '${id}';`);
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
        const result = await client.query(`DELETE FROM chirps WHERE chirp_id = '${id}';`);
        client.release();
        return 200;
    } catch (err) {
        return 404;
    }
}

/**
 * Deletes a friend pair
 * @param {string} user_id: the source user in the pair
 * @param {string} friend_id: the friend the friend links to
 * @returns status for whether the deletion worked or not
 */
async function deleteFriend(user_id, friend_id) {
    try {
        const client = await pool.connect();
        const result = await client.query(`DELETE FROM friends WHERE user_id = '${user_id}' AND friend_id = '${friend_id}';`);
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
    return res.sendFile('public/login.html', { 'root': __dirname })
});

// Handle logging out (takes us back to the login page).
app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

// Handle post data from the login.html form.
app.post('/login',
    passport.authenticate('local', {     // use username/password authentication
        'successRedirect': '/main',   // when we login, go to /private 
        'failureRedirect': '/login'      // otherwise, back to login
    }));

/**
 * Serves register page
 */
app.get('/register', (req, res) => {
    return res.sendFile('public/register.html', { 'root': __dirname });
});

/**
 * Handles registration
 */
app.post('/register', async (req, res) => {
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () => {
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
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

app.get('/main', checkLoggedIn, (req, res) => {
    return res.sendFile('public/main.html', { 'root': __dirname });
});

/**
 * Loads feed (gets all chirps orderd by timestamp)
 */
app.get('/loadFeed', checkLoggedIn, async (req, res) => {
    try {
        const client = await pool.connect();
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
        res.status(404).json({ "Error": `Error: ${err}` });
    }
})

// Gets all profiles in DB
app.get('/profiles', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from profiles;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

// Gets profile with specific user_id
app.get('/profiles/:user_id', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * FROM profiles WHERE user_id='${req.params.user_id}';`);
        client.release();
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(404).json({ 'error': `Error: ${err}` });
    }
});

// Gets all profiles that contain the search query in their username or user_id
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
        res.status(404).json({ 'Error': err });
    }
});

//Gets session profile
app.get('/sessionProfile', checkLoggedIn, (req, res) => {
    return res.redirect(`/profiles/${req.user}`);
});

//Gets likedChirps
app.get('/likedChirps', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * from likedChirps;');
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

// Sees if the authenticated user has liked a chirp given the chirp_id
app.get('/likedChirps/:chirp_id', checkLoggedIn, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from likedChirps WHERE user_id='${req.user}' AND chirp_id='${req.params.chirp_id}';`);
        client.release();
        if (result.rowCount == 0) {
            res.status(200).send(false);
        }
        else {
            res.status(200).send(true);
        }
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});


//Will get all chirps in DB
app.get('/chirps', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

// Gets all chirps from a certain user
app.get('/chirps/:user_id', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where user_id='${req.params.user_id}';`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

//Gets a specific chirp
app.get('/chirps/:chirp_id', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from chirps where chirp_id='${req.params.chirp_id}';`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

//Checks if the current user is friends with user defined by friend_id
app.get('/friends/:friend_id', checkLoggedIn, async (req, res) => { //Will get a specific friend connection
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from friends where user_id='${req.user}' AND friend_id='${req.params.friend_id}';`);
        client.release();
        if (result.rowCount == 0) {
            res.status(200).send(false);
        }
        else {
            res.status(200).send(true);
        }
    } catch (err) {
        res.status(404).send(`Error: ${err}`)
    }
});

//Will get all friend connections for signed in user and corresponding favorite songs
app.get('/userFriends', checkLoggedIn, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT friends.friend_id, profiles.favorite_song FROM friends
             JOIN profiles ON profiles.user_id=friends.friend_id 
             WHERE friends.user_id='${req.user}';`);
        client.release();
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(404).json({ 'Error': err });
    }
});

//Returns all user, friend pairs
app.get('/friends', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * from friends;`);
        client.release();
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(404).send(`Error: ${err}`)
    }
});

//Creates a chirp
app.post('/createChirp', checkLoggedIn, async (req, res) => { // For CREATE CHIRP
    try {
        let body = '';
        const timestamp = new Date().getTime();
        req.on('data', data => body += data);
        req.on('end', async () => {
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
            res.status(200).json({ 'id': result.rows[0] });
        });
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }

});

//Creates a like for a given chirp and user
app.post('/createLike', checkLoggedIn, async (req, res) => {
    try {
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

//Creates a friend link given a friend_id
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



//Redirects to the edit profile page
app.get('/editProfile', checkLoggedIn, (req, res) => {
    return res.sendFile('public/edit.html', { 'root': __dirname })
})

//Updates a given profile using the data from body
app.put('/putProfile', checkLoggedIn, async (req, res) => {
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () => {
            const updatedProfile = JSON.parse(body);
            const client = await pool.connect();
            // Removing 'friends' field for now
            const result = await client.query(`UPDATE profiles SET
                    user_name = '${cleanText(updatedProfile.user_name)}',
                    spotify_account = '${cleanText(updatedProfile.spotify_account)}',
                    playlist = '${cleanText(updatedProfile.playlist)}',
                    favorite_song = '${cleanText(updatedProfile.favorite_song)}', 
                    favorite_genre = '${cleanText(updatedProfile.favorite_genre)}',
                    favorite_artist = '${cleanText(updatedProfile.favorite_artist)}' 
                    WHERE user_id = '${req.user}';`);
            client.release();
        });
        res.status(200).send();
    } catch (err) {
        res.status(404).send(`Error: ${err}`);
    }
});

//Edits a post
app.put('/putChirp', checkLoggedIn, async (req, res) => {
    try {
        let body = '';
        req.on('data', data => body += data);
        req.on('end', async () => {
            const updated_data = JSON.parse(body);
            const client = await pool.connect();
            let result;
            if ("like_count" in updated_data) {
                result = await client.query(`UPDATE chirps SET 
                    chirp_text = '${cleanText(updated_data.text)}',
                    shared_song = '${cleanText(updated_data.song)}',
                    like_count = '${updated_data.like_count}'
                    WHERE chirp_id = '${updated_data.chirp_id}';`);
            }
            else {
                result = await client.query(`UPDATE chirps SET 
                    chirp_text = '${cleanText(updated_data.text)}',
                    shared_song = '${cleanText(updated_data.song)}'
                    WHERE chirp_id = '${updated_data.chirp_id}';`);
            }
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
app.delete('/deleteProfile', checkLoggedIn, async (req, res) => { // For DELETE
    const user_id = req.user;
    const status = await deleteProfile(user_id);
    res.status(status).send();
});

//DELETE request for chirp (delete post)
app.delete('/deleteChirp/:chirp_id', checkLoggedIn, async (req, res) => { // For DELETE
    const { chirp_id } = req.params;
    const status = await deleteChirp(chirp_id);
    res.status(status).send("Got a DELETE request for chirp");
});
//Deletes all friends of a given user (when deleting profile)
app.delete('/deleteFriend', checkLoggedIn, async (req, res) => {
    const client = await pool.connect();
    const result = await client.query(`DELETE FROM friends WHERE user_id = '${req.user}' OR friend_id = '${req.user}';`);
    client.release();
    res.status(200).send();
})
//DELETE request for friends (delete friend)
app.delete('/deleteFriend/:friend_id', checkLoggedIn, async (req, res) => {
    const user_id = req.user;
    const friend_id = req.params.friend_id;
    const status = await deleteFriend(user_id, friend_id);
    res.status(status).send("Got a DELETE request for friend");
});
//Unlikes a post given a chirp_id
app.delete('/deleteLike/:chirp_id', checkLoggedIn, async (req, res) => {
    const { chirp_id } = req.params;
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
