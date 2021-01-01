import { WebSocketGameLobbyClient } from 'websocket-game-lobby-client';

const Fictionary = (function() {
    const gameLobby = new WebSocketGameLobbyClient({
        port: 5000
    });

    document.getElementById("game-create").addEventListener("click", () => {
        gameLobby.send('create');
        console.log(gameLobby);
    });

})();