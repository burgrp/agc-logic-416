const mqttRegister = require("@device.farm/mqtt-reg").mqttReg;
const deepEqual = require("fast-deep-equal");

module.exports = async config => {

    let allModules = { ...config.modules };

    for (let factory of config.factories) {
        await factory(allModules);
    }

    for (let moduleName in allModules) {
        console.info("Initializing controller module", moduleName);
        let module = allModules[moduleName];

        let input = {};
        let output = {};
        let outputRegs = {};
        
        function executeLogic() {
            (async () => {

                try {                            
                    await module.logic(input, output);
                } finally {
                    for (let outputName in output) {
                        let value = output[outputName];
                        let reg = outputRegs[outputName];
                        if (reg) {
                            console.info(`${moduleName}: O ${reg.name} ${value}`);
                            reg.set(value);
                        } else {
                            console.error(`${moduleName} has no output ${outputName}`);
                        }

                    }                            
                }


            })().catch(e => {
                console.error(`Error in controller logic ${moduleName}`, e);
            });
        }

        for (let outputName in module.output) {
            let regName = module.output[outputName];
            outputRegs[outputName] = mqttRegister(config.mqttBroker, regName, actual => {
                if (!deepEqual(output[outputName], actual)) {
                    console.info(`${moduleName}: X ${regName} ${output[outputName]} ${actual}`);                    
                    output[outputName] = actual;    
                    executeLogic();
                }                
            });
            outputRegs[outputName].name = regName;
        }

        // watch also outputs to make sure logic is executed when the output changes externally
        for (let inputName in module.input) {

            function createRegister(regName, index) {
                return mqttRegister(config.mqttBroker, regName, actual => {

                    console.info(`${moduleName}: I ${regName} ${actual}`);

                    if (index === undefined) {
                        input[inputName] = actual;
                    } else {
                        if (input[inputName] === undefined) {
                            input[inputName] = [];
                        }
                        input[inputName][index] = actual;
                    }

                    executeLogic();

                });
            }
            let target = module.input[inputName];
            if (target instanceof Array) {
                for (let i in target) {
                    createRegister(target[i], i);
                }
            } else {
                createRegister(target);
            }
        }

    }
};
