const http = require('http-single-serve');

const { WebSocketGameLobbyServer, EphemeralDataStore } = require('websocket-game-lobby');

//Create datastore
const datastore = new EphemeralDataStore();

//Create game lobby object
const gameLobby = new WebSocketGameLobbyServer({
    server: http({
        port: 5000
    }),
    datastore
});

//Upon game creation
gameLobby.addEventListener(
    'create',
    async ({gameId, playerId}, datastore) => {
        await datastore.editGame(gameId, async game => {
            return game;
        });
        console.log(`gameId: ${gameId}`);
    }
);

gameLobby.addEventListener('message',(d) => {
    console.log(d);
});