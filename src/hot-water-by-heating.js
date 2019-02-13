module.exports = config => {
    return function (input, output) {
        if (output.pump !== undefined) {
            let heatingTemp = Math.max(input.accuTemp || 0, input.heatPumpOutTemp || 0);
            output.pump =
                heatingTemp > input.hotWaterTemp + 5 &&
                input.hotWaterTarget > input.hotWaterTemp + (output.pump ? -1 : 1);
        }
    }
}