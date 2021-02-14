const MessageManager = require('./messageManager.js').MessageManager;

module.exports = {
    RolloManager: class RolloManager {
        oDataToWrites = [];
        oPort;

        constructor(oPort) {
            this.oPort = oPort;
            //1. Stelle immer 3, 2. Stelle immer die Karte, 3. Stelle immer der Slot, 4. Stelle immer alles XOR verknüpft
        }

        moveRollo(oRolloData, bAction) {
            MessageManager.writeMessage(new Date().toLocaleString());
            MessageManager.writeMessage("Rollo Data: " + JSON.stringify(oRolloData) + " Action: " + bAction);
            var that = this;
            let nValue3 = this.getValue3(bAction, oRolloData.nSlot);

            //wenn öfters auf ein oder aus gedrückt wurde, muss eine Prüfung erfolgen, ob die Rollo eh schon fährt, --> sprich auf doppelte Einträge überprüfen
            const nIndexDoppelt = this.oDataToWrites.findIndex(oDataToWrite => oDataToWrite.oData[1] === oRolloData.nKarte
                && oDataToWrite.oData[2] === nValue3 && oDataToWrite.bInProgress === true);
            if (nIndexDoppelt !== -1) {
                MessageManager.writeMessage("Rollo fährt schon! Return!");
                return;
            }

            //Wenn von an<-->aus geschalten wird, den alten Write Befehl löschen
            const nValue3ViceVersa = this.getValue3(!bAction, oRolloData.nSlot);
            const nIndexSlot = this.oDataToWrites.findIndex(oDataToWrite => oDataToWrite.oData[1] === oRolloData.nKarte
                && oDataToWrite.oData[2] === nValue3ViceVersa);
            if (nIndexSlot !== -1) {
                MessageManager.writeMessage("An <--> Aus wurde betätigt! Splice ausgeführt!");
                this.oDataToWrites.splice(nIndexSlot, 1);
            }

            this.oDataToWrites.push({
                bInProgress: false, oData: [3, oRolloData.nKarte, nValue3, 3 ^ oRolloData.nKarte ^ nValue3]
            });
            //warten und dann Gesamt verarbeiten, wichtig für Gruppen in der Alexa App
            setTimeout(function () {
                that.writeData();
            }, 250);
        }

        writeData() {
            var that = this;
            var nKarte = 0;
            const oIntervall = setInterval(function () {
                nKarte++;
                that.writeForKarte(nKarte);
                if (nKarte === 4) {
                    clearInterval(oIntervall);
                }
            }, 250);
        }

        writeForKarte(nKarte) {
            const that = this;
            const oWritesForKarte = this.oDataToWrites.filter(oDataToWrite => oDataToWrite.oData[1] === nKarte && oDataToWrite.bInProgress === false);
            if (oWritesForKarte.length === 0) {
                return;
            }

            //summe ermitteln
            let oSumToWrite = 0;
            for (const oWriteForKarte of oWritesForKarte) {
                oSumToWrite += oWriteForKarte.oData[2];
                oWriteForKarte.bInProgress = true;
            }

            let oData = [3, nKarte, oSumToWrite, 3 ^ nKarte ^ oSumToWrite];
            MessageManager.writeMessage('Ausgabe für Karte ' + nKarte + ': ' + oData.toString());
            if (this.oPort) {
                this.oPort.write(Buffer.from(oData));
            }

            //nach 30 Sekunden die Relaykarte reseten wenn es keine offenen Writes mehr gibt
            setTimeout(function (nKarte, oWritesForKarte) {
                for (const oWriteForKarte of oWritesForKarte) {
                    const nIndex = that.oDataToWrites.indexOf(oWriteForKarte);
                    if (nIndex !== -1) {
                        that.oDataToWrites.splice(nIndex, 1);
                    }
                }
                that.maybeResetKarte(nKarte);
            }, 30000, nKarte, oWritesForKarte);
        }

        getValue3(bAction, nSlot) {
            if (bAction) {
                return Math.pow(2, 2 * nSlot - 2);
            } else {
                return Math.pow(2, 2 * nSlot - 1);
            }
        }

        maybeResetKarte(nKarte) {
            //wenn keine andere Rollo auf dieser Karte mehr aktiv ist, muss ein reset durchgeführt werden
            const oWritesForKarte = this.oDataToWrites.filter(oPortToWrite => oPortToWrite.oData[1] === nKarte && oPortToWrite.bInProgress === true);
            if (oWritesForKarte.length === 0) {
                this.resetKarte(nKarte);
            }
        }

        resetAll() {
            for (var i = 1; i <= 4; i++) {
                this.resetKarte(i);
            }
        }

        resetKarte(nKarte) {
            var oData = [3, nKarte, 0, 3 ^ nKarte ^ 0];
            MessageManager.writeMessage('Reset für Karte ' + nKarte + ': ' + oData.toString());
            if (this.oPort) {
                this.oPort.write(Buffer.from(oData));
            }
        }

        static getInstance(oPort) {
            if (!this.self) {
                this.self = new RolloManager(oPort);
            }
            if (oPort) {
                this.self.oPort = oPort;
            }
            return this.self;
        }
    }
};




