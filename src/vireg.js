const mqtt = require("mqtt");
const fs = require("fs");
const os = require("os");
const deepEqual = require("fast-deep-equal");

const pro = require("util").promisify;
const fsReadFileAsync = pro(fs.readFile);
const fsWriteFileAsync = pro(fs.writeFile);

module.exports = async config => {

    let persistent = config.directory !== undefined;

    let client = mqtt.connect(`mqtt://${config.mqttBroker}`);
    let hostName = os.hostname();

    let regValues = {};

    function advertise() {
        for (let regName of config.registers) {
            client.publish(`register/${regName}/advertise`, JSON.stringify({
                device: hostName
            }));
        }
    }

    client.on("connect", advertise);

    client.subscribe("register/advertise!");

    for (let regName of config.registers) {

        if (persistent) {

            let fileName = `${config.directory}/${regName}.json`;

            async function readFile() {
                try {
                    let strVal = (await fsReadFileAsync(fileName)).toString();
                    let val = strVal === "" ? undefined : JSON.parse(strVal);
                    if (!deepEqual(val, regValues[regName])) {
                        regValues[regName] = val;
                        publishRegValue(regName);
                    }
                } catch (e) {
                    if (e.code === "ENOENT") {
                        await fsWriteFileAsync(fileName, "");
                    } else {
                        console.error(`Error reading register ${regName}`, e);
                    }
                }
            }

            await readFile();

            fs.watch(fileName, { persistent: false }, eventType => {
                readFile();
            });

        }

        client.subscribe(`register/${regName}/get`);
        client.subscribe(`register/${regName}/set`);
    }

    function publishRegValue(regName) {
        client.publish(`register/${regName}/is`, JSON.stringify(regValues[regName]));
    }

    async function setRegValue(regName, strValue) {
        let value = strValue === "" ? undefined : JSON.parse(strValue);
        if (persistent) {
            await fsWriteFileAsync(`${config.directory}/${regName}.json`, value === undefined ? "" : JSON.stringify(value));
        } else {
            regValues[regName] = value;
            publishRegValue(regName);
        }       
    }

    client.on("message", (topic, message) => {
        topic = topic.split("/");
        if (topic[0] === "register") {
            if (topic[1] === "advertise!") {

                advertise();

            } else if (topic[2] === "get") {

                let regName = topic[1];
                publishRegValue(regName);

            } else if (topic[2] === "set") {

                let regName = topic[1];
                setRegValue(regName, message.toString()).catch(e => {
                    console.error(`Error when saving register ${regName}`, e);
                });

            }
        }
    });

}