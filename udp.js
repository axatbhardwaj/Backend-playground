const dgram = require('dgram');
const socket= dgram.createSocket('udp4');

socket.on('message', (msg, rinfo) => {
    console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
})

socket.bind(8001);


// Driver nc=netcat
// echo "hi" | nc -w1 -u 127.0.0.1 8001 