
/**
 * Adds a profile to the database given the populated fields in the sidebar
 */
async function register() {
    /**
     * @TODO :set up password creation, and adding friends
     */
    // check if passwords are the same
    const pwd = document.getElementById('password').value;
    if (pwd !== document.getElementById('password2').value) {
        alert("Passwords don't match. Please make sure the passwords are the same.");
        return;
    }
    //build profile from inputted field
    const profile = {};
    profile.user_name = document.getElementById('username').value;
    profile.user_id = document.getElementById('user_id').value;
    profile.spotify_account = document.getElementById('spotify').value;
    profile.playlist = document.getElementById('playlist').value;
    profile.favorite_song = document.getElementById('song').value;
    profile.favorite_artist = document.getElementById('artist').value;
    profile.favorite_genre = document.getElementById('genre').value;
    profile.password = document.getElementById('password').value;

    //Require all fields to be filled in
    if (Object.values(profile).some(e => e === '')) {
        alert('A field is unfilled! Please fill them all in');
        return;
    }

    //check if profile w user id alr exists
    const check = await fetch(`https://music-matcher-326.herokuapp.com/profiles/${profile.user_id}`);
    if (check.ok && check.status !== 404) {
        const rows = await check.json();
        if (rows.length === 1) {
            alert('An account with this user ID already exists! please choose a different one.');
            return;
        }
        //create profile
        const response = await fetch('https://music-matcher-326.herokuapp.com/register', { method: 'POST', body: JSON.stringify(profile) });
        if (response.ok && response.status !== 404) {
            alert('Successfully created account! Redirecting to login page.')
            window.location.href = '/login';
        }
    } else {
        //error server-side
        const err = await check.text();
        alert('Error talking with server, please try again later.');
    }
}

const btn = document.getElementById('register_btn').addEventListener('click', register);