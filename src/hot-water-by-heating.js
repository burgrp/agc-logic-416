module.exports = config => {
    return function (input, output) {
        if (output.pump !== undefined) {
            output.pump =
                input.heatingTemp > input.hotWaterTemp + 5 &&
                input.hotWaterTarget > input.hotWaterTemp + (output.pump ? -1 : 1);
        }
    }
}