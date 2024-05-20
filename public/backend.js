const app = require('express')();

// Socket.io setup
const http = require('http');
const server = http.createServer(app);
const Server = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });

const port = 8082;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname + '/index.html'));
});

const backEndPlayers = {}

const SPEED = 10

io.on('connection', (socket) => {
    console.log('A user has connected')
    backEndPlayers[socket.id] = {
        x: 500 * Math.random(), 
        y: 500 * Math.random(),
        color: `hsl(${360 * Math.random()}, 100%, 50%)`,
        sequenceNumber: 0
    }

    io.emit('updatePlayers', backEndPlayers)

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete backEndPlayers[socket.id]
        io.emit('updatePlayers', backEndPlayers)
    })

    socket.on('keydown', ({keycode, sequenceNumber}) => {
        backEndPlayers[socket.id].sequenceNumber = sequenceNumber
        switch (keycode) {
            case 'KeyW':
                backEndPlayers[socket.id].y -= SPEED
                break
            case 'KeyA':
                backEndPlayers[socket.id].x -= SPEED
                break
            case 'KeyD':
                backEndPlayers[socket.id].x += SPEED
                break
            case 'KeyS':
                backEndPlayers[socket.id].y += SPEED
                break
        }
    })

    console.log(backEndPlayers)
})

setInterval(() => {
    io.emit('updatePlayers', backEndPlayers)
}, 15)

server.listen(port, () => {
    console.log('server running at http://localhost:8082');
});