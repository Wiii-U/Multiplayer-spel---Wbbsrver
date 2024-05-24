const express = require('express');
const app = express();

// Socket.io setup
const http = require('http');
const server = http.createServer(app);
const Server = require('socket.io');
const io = Server(server, { pingInterval: 2000, pingTimeout: 5000 });

const port = 8082;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const backEndPlayers = {}
const backEndProjectiles = {}

const SPEED = 10
let projectileId = 0

io.on('connection', (socket) => {
    console.log('A user has connected')
    backEndPlayers[socket.id] = {
        x: 500 * Math.random(), 
        y: 500 * Math.random(),
        color: `hsl(${360 * Math.random()}, 100%, 50%)`,
        sequenceNumber: 0
    }

    io.emit('updatePlayers', backEndPlayers)

    socket.on('initCanvas', ({width, height}) => {
        backEndPlayers[socket.id].canvas = {
            width,
            height
        }
    })

    socket.on('shoot', ({x, y, angle}) => {
        projectileId++;

        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }

        backEndProjectiles[projectileId] = {
            x, 
            y, 
            velocity,
            playerId: socket.id
        }
    })

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete backEndPlayers[socket.id]
        io.emit('updatePlayers', backEndPlayers)
    })

    socket.on('keydown', ({keycode, sequenceNumber}) => {
        const backEndPlayer = backEndPlayers[socket.id]

        if (!backEndPlayer) return

        backEndPlayer.sequenceNumber = sequenceNumber
        switch (keycode) {
            case 'KeyW':
                backEndPlayer.y -= SPEED
                break
            case 'KeyA':
                backEndPlayer.x -= SPEED
                break
            case 'KeyD':
                backEndPlayer.x += SPEED
                break
            case 'KeyS':
                backEndPlayer.y += SPEED
                break
        }
    })

    console.log(backEndPlayers)
})

// backend tickrate
setInterval(() => {
    for (const id in backEndProjectiles) {
        backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
        backEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    
        const PROJECTILE_RADIUS = 5
        if (
          backEndProjectiles[id].x - PROJECTILE_RADIUS >=
            backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
          backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||
          backEndProjectiles[id].y - PROJECTILE_RADIUS >=
            backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
          backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0
        ) {
          delete backEndProjectiles[id]
          continue
        }
    
        for (const playerId in backEndPlayers) {
          const backEndPlayer = backEndPlayers[playerId]
    
          const DISTANCE = Math.hypot(
            backEndProjectiles[id].x - backEndPlayer.x,
            backEndProjectiles[id].y - backEndPlayer.y
          )
    
          // collision detection
          if (
            DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
            backEndProjectiles[id].playerId !== playerId
          ) {
            if (backEndPlayers[backEndProjectiles[id].playerId])
              backEndPlayers[backEndProjectiles[id].playerId].score++
    
            console.log(backEndPlayers[backEndProjectiles[id].playerId])
            delete backEndProjectiles[id]
            delete backEndPlayers[playerId]
            break
          }
        }
      }

    io.emit('updateProjectiles', backEndProjectiles)
    io.emit('updatePlayers', backEndPlayers)
}, 15)

server.listen(port, () => {
    console.log('server running at http://localhost:8082');
});