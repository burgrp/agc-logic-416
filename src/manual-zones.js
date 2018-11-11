module.exports = async config => {
    return async (modules) => {

        for (let type in config.map) {
            let zones = config.map[type];
            for (let zone of zones) {
                modules[`${zone}.${type}`] = {
                    input: {
                        setting: `zone.${zone}.manual.${type}`
                    },
                    output: {
                        valve: `zone.${zone}.valve.${type}`
                    },
                    logic(input, output) {
                        output.valve = input.setting? 1: 0;
                    }
                }
            }
        }

    };
}