const SerialPort = require('serialport');
const RolloManager = require('./classes/rolloManager.js').RolloManager;
const MessageManager = require('./classes/messageManager.js').MessageManager;
const Http = require('http');
const Url = require('url');

main();


var oRolloDatas = [
    {
        sName: "rollo-schlafzimmer",
        nKarte: 1,
        nSlot: 1
    },
    {
        sName: "rollo-lea",
        nKarte: 1,
        nSlot: 2
    },
    {
        sName: "rollo-paula",
        nKarte: 1,
        nSlot: 3
    },
    {
        sName: "rollo-jonas",
        nKarte: 2,
        nSlot: 1
    },
    {
        sName: "rollo-wohnzimmer",
        nKarte: 2,
        nSlot: 2
    },
    {
        sName: "rollo-dustin",
        nKarte: 3,
        nSlot: 1
    },
    {
        sName: "rollo-essen",
        nKarte: 3,
        nSlot: 2
    },
    {
        sName: "rollo-wc",
        nKarte: 4,
        nSlot: 1
    },
    {
        sName: "rollo-bad",
        nKarte: 4,
        nSlot: 2
    },
    {
        sName: "rollo-kueche",
        nKarte: 4,
        nSlot: 3
    },
];

async function main() {
    try {
        const oPort = await getSerialPort();
        if (oPort == null) {
            MessageManager.writeMessage(`Es wurde kein Port gefunden!`);
        }
        Http.createServer(function (oReq, oRes) {
            if (oReq.url === '/favicon.ico') {
                oRes.end();
                return;
            }

            var oQuery = Url.parse(oReq.url, true).query;
            if (oQuery.sTopic === 'rollos-reset') {
                RolloManager.getInstance(oPort).resetAll();
            } else {
                var oRolloData = oRolloDatas.find(oRolloData => oRolloData.sName === oQuery.sTopic);
                if (oRolloData) {
                    //Wenn true, dann geht die Rollo nach unten
                    const bAction = oQuery.bAction === 'true';
                    RolloManager.getInstance(oPort).moveRollo(oRolloData, bAction);
                } else {
                    MessageManager.writeMessage("Es wurde keine Config für Rolle " + oQuery.sTopic + " gefunden!");
                }
            }
            oRes.end();
        }).listen(8080);
    } catch (oError) {
        console.log(oError.message);
    }
}

function getSerialPort() {
    return new Promise((oResolve) => {
        SerialPort.list().then(oPorts => {
            const sPort = "/dev/ttyUSB0";
            let oPortRollo = oPorts.find(oPort => oPort.path === sPort);
            if (oPortRollo) {
                let oPort = new SerialPort(sPort, {baudRate: 19200, dataBits: 8, stopBits: 1, parity: 'none'});
                oResolve(oPort);
            } else {
                oResolve();
            }
        });
    });
}

