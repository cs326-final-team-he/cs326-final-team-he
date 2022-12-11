
/**
 * Adds a profile to the database given the populated fields in the sidebar
 */
async function edit() {
    //build profile
    const profile = {};
    profile.user_name = document.getElementById('username').value;
    profile.spotify_account = document.getElementById('spotify').value;
    profile.playlist = document.getElementById('playlist').value;
    profile.favorite_song = document.getElementById('song').value;
    profile.favorite_artist = document.getElementById('artist').value;
    profile.favorite_genre = document.getElementById('genre').value;
    if (Object.values(profile).some(e => e === '')) {
        alert('A field is unfilled! Please fill them all in');
        return;
    }
    //check if profile w user id alr exists
    //edit profile
    const response = await fetch('https://music-matcher-326.herokuapp.com/putProfile', {method: 'PUT', body: JSON.stringify(profile)});
    if (response.ok && response.status !== 404) {
        alert('Successfully edited account! Redirecting to main page.')
        window.location.href = '/main';
        }
    else {
        //error server-side
        alert('Error talking with server, please try again later.');
    }
}
async function load_profile() {
    const response = await fetch('https://music-matcher-326.herokuapp.com/sessionProfile');
    if (response.ok && response.status !== 404) {
        const json = await response.json();
        const profile = json[0]
        document.getElementById('username').value = profile.user_name;
        document.getElementById('spotify').value = profile.spotify_account;
        document.getElementById('playlist').value = profile.playlist;
        document.getElementById('song').value = profile.favorite_song;
        document.getElementById('artist').value = profile.favorite_artist;
        document.getElementById('genre').value = profile.favorite_genre;
    } else {
        alert('Error talking to server, redirecting to main');
        window.location.href = '/main';
    }
}
const btn = document.getElementById('edit_btn').addEventListener('click', edit);
load_profile();