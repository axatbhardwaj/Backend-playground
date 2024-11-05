function getPerformance() {
    let x = performance.now().toString();
    x = x.split(".");
    x[0] = stringReverse(x[0]);
    x = x[1] + x[0];
    x = parseInt(x);
    return x;
}

function getSalt() {
    let salt = performance.now() * getPerformance() + new Date().getMilliseconds() + new Date().getSeconds();
    salt = salt.toString();
    salt = stringReverse(salt);
    if (getPerformance() % 2 === 0) {
        let entropy = getPerformance() + new Date().getMilliseconds() % 10 + new Date().getSeconds();
        entropy = stringReverse(entropy.toString());
        salt = (salt / 2).toString() + entropy
    }
    salt = parseInt(salt);
    return salt * performance.now() | 0; // | to convert to int
}

function stringReverse(str) {
    const strArray = str.split("");
    const str1 = strArray.slice(0, strArray.length / 2).reverse();
    const str2 = strArray.slice(strArray.length / 2).reverse();
    return str1.join("") + str2.join("");
}

function randNum(len) {
    len = parseInt(len);
    let rNum;
    do {
        const salt = getSalt();
        const salt2 = getSalt() * salt;
        const reversedSalt = stringReverse(salt.toString());
        const reversedSalt2 = stringReverse(salt2.toString());
        const sum = (parseInt(reversedSalt)) + (parseInt(reversedSalt2));
        rNum = sum.toString().slice(0, len);
    } while (rNum.toString().length !== len);
    return rNum;
}

module.exports = {
    randNum
}