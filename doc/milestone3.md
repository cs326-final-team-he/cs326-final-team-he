## Database Documentation

For our project, we decided to use a PostgreSQL database. In this database, there are three tables. These tables are for individual users, chirps (posts), and friends. A more detailed description on what these tables are and what their fields are is in the documentation below: 

profiles table:

| Column          | Data Type | Description                                            |
|-----------------|-----------|--------------------------------------------------------|
| user_name       | String    | The username of the profile                            |
| user_id         | Integer   | The id of the profile                                  |
| spotify_account | String    | Stores name of spotify account associated with profile |
| playlist        | String    | Stores text of link to Profile's spotify playlist      |
| favorite_song   | String    | Stores text of link to Profile's favorite song         | 
| favorite_genre  | String    | Stores the profile's favorite genre of music           |
| favorite_artist | String    | Stores the profile's favorite music artist             |

chirps table:

| Column          | Data Type | Description                                            |
|-----------------|-----------|--------------------------------------------------------|
| user_name       | String    | The username of the profile that posted this chirp     |
| chirp_text      | String    | The text that the user typed into this chirp (content) |
| shared_song     | String    | Stores text of link to song shared in the chirp        |
| like_count      | Integer   | The number of likes that this chirp has gotten         |
| share_count     | Integer   | The number of times this chirp was shared              | 

friends table:

| Column          | Data Type | Description                                            |
|-----------------|-----------|--------------------------------------------------------|
| user_id         | Integer   | The id of the user that is making a friend             |
| friend_id       | Integer   | The id of the user that the user_id is friends with    |

## Division of Labor:
Joseph Machiaverna: Converted a lot of our endpoints to use the postgreSQL database. Added some more endpoints which included /Chirps/:user_name in order to obtain all of the posts written by a single user and /Profiles/:user_id in order to obtain a single profile. Implemented the new friends table and added Create, Read, and Delete endpoints for it. Also added a endpoint that enables us to obtain a list of friends for a user. Updated update_friends_db in main.js to work with our new model. Fixed various bugs hindering our project across our code. Also wrote the database description provided on this document.

Stanley Araki: Made design choices and divided labor to each group member. Implemented backend features and key bug fixes related to posting 'chirps'(basically tweets). As a result, posts from the past from users in previous sessions are shown on a user's feed whenever the page is loaded. Restructured endpoints code, especially the endpoint called on load to create key tables needed. Also used Spotify embeddings to allow users to post links that would automatically converted to songs, albums, and playlists. This also is implemented for user profiles as well, so links get converted to their embedded forms on their profiles. 
