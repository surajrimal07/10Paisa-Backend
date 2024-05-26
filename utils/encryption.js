import crypto from 'crypto';

const algorithm = process.env.JWT_SECRET_ALGORITHM
const key = crypto.scryptSync(process.env.JWT_SECRET_ENCRYPTION, 'salt', 16);
const iv = Buffer.alloc(16, 0); //always generate same iv, this is done to
//make mongodb query possible, as we need to search for the encrypted data

export async function encryptData(data) {
    const dataType = typeof data;
    let text;

    switch (dataType) {
        case 'string':
            text = data;
            break;
        case 'number':
        case 'boolean':
            text = String(data);
            break;
        default:
            throw new Error(`Unsupported data type: ${dataType}`);
    }

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encryptedData = Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]);
    //return `${dataType}:${encryptedData.toString('hex')}`;
    return dataType + ':' + encryptedData.toString('hex');
}

export async function decryptData(encryptedText) {
    const [dataType, encryptedHex] = encryptedText.split(':');
    const encryptedData = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decryptedText = Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString();

    switch (dataType) {
        case 'string':
            return decryptedText;
        case 'number':
            return Number(decryptedText);
        case 'boolean':
            return decryptedText === 'true';
        default:
            throw new Error(`Unsupported data type: ${dataType}`);
    }
}

// async function testEncryption() {
//     const data = 'dfdmf,s sm m5435m43535345345m  mfmdf';
//     const startTime = process.hrtime();
//     const encryptedData = await encryptData(data);
//     const elapsed = process.hrtime(startTime);
//     console.log(`Encryption took ${elapsed[0]} seconds and ${elapsed[1] / 1e6} milliseconds`);
//     console.log(`Encrypted data: ${encryptedData}`);
//     const startTime2 = process.hrtime();
//     const decryptedData = await decryptData(encryptedData);
//     const elapsed2 = process.hrtime(startTime2);
//     console.log(`Decryption took ${elapsed2[0]} seconds and ${elapsed2[1] / 1e6} milliseconds`);
//     console.log(`Decrypted data: ${decryptedData}`);
// }

// testEncryption();
