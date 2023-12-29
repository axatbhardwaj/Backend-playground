const net = require('net');

const server = net.createServer(socket => {
    socket.write('Hello, World!');
    socket.on('data', data => {
        console.log(data.toString());
    })
});

server.listen(8000);

//driver code 
// telnet 127.0.0.1 8000

