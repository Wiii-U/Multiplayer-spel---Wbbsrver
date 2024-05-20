const app = require('express')();

// Socket.io setup
const http = require('http');
const server = http.createServer(app);
const Server = require('socket.io');
const io = new Server(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname + '/index.html'));
});

const players = {}

io.on('connection', (socket) => {
    console.log('A user has connected')
    players[socket.id]
})

server.listen(8082, () => {
    console.log('server running at http://localhost:8082');
});