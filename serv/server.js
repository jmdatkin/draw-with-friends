const http = require('http-single-serve');

const { WebSocketGameLobbyServer } = require('websocket-game-lobby');

const gameLobby = new WebSocketGameLobbyServer({
    server: http({
        port: 5000
    })
});