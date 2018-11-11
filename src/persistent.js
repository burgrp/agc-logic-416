const mqtt = require("mqtt");
const fs = require("fs");
const os = require("os");

const pro = require("util").promisify;
const fsReadFileAsync = pro(fs.readFile);
const fsWriteFileAsync = pro(fs.writeFile);

module.exports = async config => {

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
    setInterval(advertise, 10000);

    client.subscribe("register/advertise!");

    for (let regName of config.registers) {
        try {
            let strVal = (await fsReadFileAsync(`${config.directory}/${regName}.json`)).toString();
            regValues[regName] = strVal === ""? undefined: JSON.parse(strVal);
        } catch (e) {
            if (e.code !== "ENOENT") {
                console.error(`Error reading register ${regName}`, e);
            }
        }
        client.subscribe(`register/${regName}/get`);
        client.subscribe(`register/${regName}/set`);        
    }

    function publishRegValue(regName) {
        client.publish(`register/${regName}/is`, JSON.stringify(regValues[regName]));
    }

    async function setRegValue(regName, strValue) {
        let value = strValue === ""? undefined: JSON.parse(strValue);
        await fsWriteFileAsync(`${config.directory}/${regName}.json`, value === undefined? "": JSON.stringify(value));
        regValues[regName] = value;
        publishRegValue(regName);
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