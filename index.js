const http = require("http");
const app = require("express")();
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"));
app.listen(9091, () => console.log("Ich höre 9091!"));
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Ich höre 9090!"));
//hashmap client
const clients = {};
const games = {};
let timeBegin = null;
let elapsedTime = null;
const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("Offen!"))
    connection.on("close", () => console.log("Geschlossen!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        // I have received a message from the client
        // A client want to create a new game
        if (result.method == "create"){
            const clientId = result.clientId
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "balls": 20,
                "clients": [],
                "elapsedTime": 0
            }

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            }
            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));

        }

        //a client want to join
        if (result.method === "join"){

            const clientId = result.clientId;
            const gameId = result.gameId
            const game = games[gameId]
            if (game.clients.length >= 3){
                //sorry max players reach
                return
            }
            const color = {"0": "Red", "1": "Green", "2": "Blue"}[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color,
                "points": 0,
                "position": 0
            })

            //start the game 
            if (game.clients.length === 3) updateGameState();

            const payLoad = {
                "method": "join",
                "game": game
            }
            //loop through all clients and tell them that people has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }

        //a user plays
        if (result.method === "play") {
            const gameId = result.gameId;
            const ballId = result.ballId;
            const color = result.color;
            let state = games[gameId].state;
            if (!state)
                state = {}
            state[ballId] = color;
            games[gameId].state = state;
            console.log(state)
            
        }
    })
    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))

})

function updateGameState(){
    if (!timeBegin) timeBegin = Date.now();
    elapsedTime = Date.now() - timeBegin
    console.log(timeBegin)
    console.log(elapsedTime)

    for (const g of Object.keys(games)) {
            const game = games[g]

        if (elapsedTime < 5000){
            game.elapsedTime = elapsedTime;
            const payLoad = {
                "method": "update",
                "game": game
            }
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        
            console.log("Atualizando...");
            setTimeout(updateGameState, 500);
        } else {
            for (let s in game.state) {
                game.clients.forEach(c => {
                    if (c.color === game.state[s]) c.points = c.points + 1;
                })
            }
            game.clients.sort(function(a, b) {
                return a.points < b.points;
            });
            let i = 0;
            game.clients.forEach(c => {
                i++
                c.position = i
            })
            
            const payLoad = {
                "method": "update",
                "game": game
            }
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })

            console.log("fim de jogo")
        }




    }
}

function S4() {
    return (((1+Math.random()*0x10000)|0).toString(16).substring(1));
}

//then to call it, plus stitsch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();