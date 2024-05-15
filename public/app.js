const app = require('express')();

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(join(__dirname + '/index.html'));
});

server.listen(8082, () => {
    console.log('server running at http://localhost:8082');
});