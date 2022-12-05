
/**
 * Adds a profile to the database given the populated fields in the sidebar
 */
 async function register() {
    /**
     * @TODO :set up password creation, and adding friends
     */
    //check if passwords are the same
    const pwd = document.getElementById('passwordInput').value;
    if (pwd !== document.getElementById('passwordInput2').value) {
        alert("Passwords don't match. Please make sure the passwords are the same.");
        return;
    }
    //build profile
    const profile = {};
    profile.user_name = document.getElementById('usernameInput').value;
    profile.user_id = document.getElementById('userIDInput').value;
    profile.spotify_account = document.getElementById('spotifyInput').value;
    profile.playlist = document.getElementById('playlistInput').value;
    profile.favorite_song = document.getElementById('fsongInput').value;
    profile.favorite_artist = document.getElementById('fartistInput').value;
    profile.favorite_genre = document.getElementById('fgenreInput').value;

    //check if profile w user id alr exists
    const check = await fetch(`https://music-matcher-326.herokuapp.com/profiles/${profile.user_id}`);
    if (check.ok && check.status !== 404) {
        const rows = await check.json();
        if (rows.length === 1) {
            alert('An account with this user ID already exists! please choose a different one.');
            return;
        }
        //create profile
        const response = await fetch('https://music-matcher-326.herokuapp.com/register', {method: 'POST', body: JSON.stringify(profile)});
        if (response.ok && response.status !== 404) {
            window.location.href = '/login';
        }
    } else {
        //error server-side
        const err = await check.text();
        alert('Error talking with server, please try again later.');
    }
}

const btn = document.getElementById('register_btn').addEventListener('click', register);