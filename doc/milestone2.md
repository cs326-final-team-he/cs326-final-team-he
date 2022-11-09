## Create
The Create endpoint enables the client
## Read
The Read endpoint provides the ability for the client to read information from a specific database, field, or localStorage. 
Some retreivable information include reading users' playlists, favorite songs, genre, artist, album, friends, and recent updates to their feed.
A common use case for this endpoint may be to retreive all of a user's friends' shared music on their timeline, and then retreiving even more information if a user clicks on the specific shared blurb. 

Example of user information retreived:

{
    "profile": {
        spotify_account: "www.spotify.com/...",
        playlist: "www.playlist.user/...",
        favorite_song: "www.spotify.com/...",
        favorite_genre: "lorem ipsum",
        favorite_artist: "lorem ipsum",
        friends: [
            {
                user_name: "Stanley",
                details: {
                favorite_song: "www.spotify.com/...",
                recent_shared: {
                    ...
                }
            },
            {
                user_name: "Nick",
                details: {
                    ...
                }
            }
        ]
    }
}

## Update

## Delete
