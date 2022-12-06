const MC = require('./miniCrypt');
const mc = new MC();

/**
 * login() runs when a user attempts to log in to their music-matcher account. 
 */
function login() {
    // console.log('blah');
    // location.href = 'https://stackoverflow.com/questions/27600267/put-element-to-the-right-side-of-a-div';
    // console.log('blah2'); 
    // same tbh

    // First want to check if the values in the prompt fields are valid.
    // There should be two pages, a login page and an account creation page. Users should be defaulted to the login page
    // TODO: Protect against SQL injection attacks if not done already. 

    const user_id = document.getElementById("userIDInput").value; // Note these values are from login.html. ID names are duplicate
    const password = document.getElementById("passwordInput").value; 

    const [salt, hash] = mc.hash(password);

    // Want to query user-id&password database on the user id and salt, hash combination. 
    

}

document.getElementById('login').addEventListener('click', login);
