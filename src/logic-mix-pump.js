module.exports = config => {
    return function(input, output) {
        output.pump = input.zoneValves.some(v => v);
    }
}