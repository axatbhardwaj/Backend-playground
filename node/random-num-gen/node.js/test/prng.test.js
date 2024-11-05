const { randNum } = require('../prng');
//const { randNum } = require('../mathRandom');


function findRepeatedRandomNumber() {
    const generatedNumbers = new Set();
    let iterations = 0;

    while (true) {
        const randomNum = randNum(5); // Change the length as needed
        iterations++;

        if (generatedNumbers.has(randomNum)) {
            console.log(`Random number repeated after ${iterations} iterations.`);
            break;
        } else {
            generatedNumbers.add(randomNum);
        }
    }
}

findRepeatedRandomNumber();
