module.exports = config => {
    return function (input, output) {
        if (output.pump !== undefined) {
            let heatingTemp = Math.max(input.accuTemp || 0, input.heatPumpOutTemp || 0);
            let actualToCompare = input.hotWaterTemp + (output.pump ? -2 : 2);
            output.pump =
                input.enabled &&
                heatingTemp > actualToCompare + 5
                //  &&
                // input.hotWaterTarget > actualToCompare;
        }
    }
}