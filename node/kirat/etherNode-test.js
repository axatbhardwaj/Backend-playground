import { ethers, HDNodeWallet } from 'ethers';

const createWallet = () => {
    // const wallet = HDNodeWallet.createRandom();

    // const mnemonic = wallet.mnemonic.phrase;
    // const privateKey = wallet.privateKey;
    // const publicKey = wallet.publicKey;


    // const account0 = wallet.derivePath("m/44'/60'/0'/0/0");
    // const account1 = wallet.derivePath("m/44'/60'/0'/0/1");


    // console.log("wallet :", wallet);
    // console.log("\n\nmnemonic :", mnemonic);
    // console.log("\n\nAccount 0 :", account0);
    // console.log("\n\nAccount 0 privateKey :", account0.privateKey);
    // console.log("\n\nAccount 1 :", account1);
    // console.log("\n\nAccount 1 privateKey :", account1.privateKey);

    const wallet = HDNodeWallet.createRandom();
    const mnemonicPhrase = wallet.mnemonic.phrase;
    const address = wallet.address;
    const publicKey = wallet.publicKey;
    const privateKey = wallet.privateKey;

    console.log("wallet :", wallet);
    console.log("\nmnemonicPhrase :", mnemonicPhrase);
    console.log("\naddress :", address);
    console.log("\npublicKey :", publicKey);
    console.log("\nprivateKey :", privateKey);

    const wallet2 = HDNodeWallet.fromPhrase(mnemonicPhrase, "", "m/44'/60'/0'/0/1");
    const address2 = wallet2.address;
    const publicKey2 = wallet2.publicKey;
    const privateKey2 = wallet2.privateKey;

    console.log("\n\nwallet2 :", wallet2);
    console.log("\naddress2 :", address2);
    console.log("\npublicKey2 :", publicKey2);
    console.log("\nprivateKey2 :", privateKey2);

}

createWallet();