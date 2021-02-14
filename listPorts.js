const SerialPort = require('serialport');
SerialPort.list().then(oPorts => {
    oPorts.forEach(oPort => {
        console.log(oPort);
    });
});
