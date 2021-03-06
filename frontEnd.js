//HTML alements
let clientId = null;
let gameId = null;
let playerColor = null;
let ws = new WebSocket("ws://localhost:9090")
let gameTime = 10
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");
const divResult = document.getElementById("divResult");
const gameList = document.getElementById("gameList");
const barElapsedTime = document.getElementById("myBar");

//writing events
btnJoin.addEventListener("click", e => {

    if (gameId === null)
        gameId = gameList.value;
    //gameId = txtGameId.value;
    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId
    };
    ws.send(JSON.stringify(payLoad));
});

btnCreate.addEventListener("click", e => {
    const payLoad = {
        "method": "create",
        "clientId": clientId,
        "gameTime": gameTime
    };
    ws.send(JSON.stringify(payLoad));
});

ws.onmessage = message => {
    //message.data
    const response = JSON.parse(message.data);
    //connect
    if (response.method == "connect") {
        clientId = response.clientId;
        console.log("Client-ID erfolgreich festgelegt " + clientId)
    }

    //create
    if (response.method == "create") {
        gameId = response.game.id;
        console.log("Spiel erfolgreich stellt mit ID " + response.game.id + " mit " + response.game.balls + " Bällen!")
    }

    //join
    if (response.method == "join") {
        const game = response.game;

        while (divPlayers.firstChild)
            divPlayers.removeChild(divPlayers.firstChild)
        game.clients.forEach(c => {
            const d = document.createElement("div");
            d.style.width = "200px";
            d.style.background = c.color;
            d.textContent = c.clientId;
            divPlayers.appendChild(d);

            if (c.clientId === clientId) playerColor = c.color;

        })

        while (divBoard.firstChild)
            divBoard.removeChild(divBoard.firstChild)

        for (let i = 0; i < game.balls; i++) {

            const b = document.createElement("button");
            b.id = "ball" + (i + 1);
            b.tag = i + 1
            b.textContent = i + 1;
            b.style.width = "150px"
            b.style.length = "150px"
            b.addEventListener("click", e => {
                b.style.background = playerColor
                const payLoad = {
                    "method": "play",
                    "clientId": clientId,
                    "gameId": gameId,
                    "ballId": b.tag,
                    "color": playerColor
                }
                ws.send(JSON.stringify(payLoad));
            })

            divBoard.appendChild(b)
        }

        console.log("Spiel erfolgreich betretet mit ")
    }

    //updateGameList
    if (response.method == "updateGameList") {
        document.getElementById("gameList").innerHTML = "";
        for (const g of Object.keys(response.games)) {
            var opt = document.createElement('option');
            opt.value = g;
            opt.innerHTML = g;
            gameList.appendChild(opt);
        }
    }

    //playing
    if (response.method == "playing") {
        game = response.game
        barElapsedTime.style.width = Math.ceil(game.elapsedTime / game.gameTime * 100) + "%";

        if (!game.state) return;
        for (const b of Object.keys(game.state)) {
            const color = game.state[b];
            const ballObject = document.getElementById("ball" + b);
            ballObject.style.backgroundColor = color
        }
    }

    //Finish
    if (response.method == "finish") {
        barElapsedTime.style.width = Math.ceil(response.game.elapsedTime / gameTime * 100) + "%";

        console.log(Math.ceil(response.game.elapsedTime / gameTime * 100) + "%");
        console.log(response.game.elapsedTime);

        if (!response.game.state) return;
        for (let b = 1; b < 21; b++) {
            document.getElementById("ball" + b).disabled = true
        }
        let txtHTML = ""
        for (let c in response.game.clients) {
            txtHTML = txtHTML + "<BR>" + response.game.clients[c].position +
                response.game.clients[c].color + "(" +
                response.game.clients[c].points + " balls)";
        }
        divResult.innerHTML = txtHTML;
    }
}