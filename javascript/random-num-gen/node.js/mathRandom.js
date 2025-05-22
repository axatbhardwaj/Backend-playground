//function to return a random number with the provided length with math.random

function randNum(len) {
    return Math.random().toString().slice(2, len + 2);
}
module.exports = {
    randNum
}