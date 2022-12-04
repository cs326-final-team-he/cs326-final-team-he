
/**
 * TODO
 */
async function login() {
    // const response = await fetch();
}

async function redirect() {
    const response = await fetch('https://music-matcher-326.herokuapp.com/registerRedirect');
}
document.getElementById('login').addEventListener('click', login);
document.getElementById('register_redirect').addEventListener('click', redirect);