
let lastToCompare;
// lastToCompare - temporary workaround for unreliable hotWaterBoiler device

module.exports = config => {    
    return function (input, output) {

        let heatingTemp = Math.max(input.accuTemp || 0, input.heatPumpOutTemp || 0);
        let actualToCompare = (input.hotWaterTemp + (output.pump ? -3 : 3)) || lastToCompare;
        lastToCompare = actualToCompare;
        
        output.pump =
            input.enabled &&
            heatingTemp > actualToCompare + 7
    }
}