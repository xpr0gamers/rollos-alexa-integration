const Fs = require('fs');

module.exports = {
    MessageManager: class MessageManager {
        static writeMessage(sMessage) {
            console.log(sMessage);
            const sDirname = process.cwd();
            //Fs.appendFileSync(sDirname + '\\resources\\logs.txt', sMessage + "\n");
        }
    }
};




