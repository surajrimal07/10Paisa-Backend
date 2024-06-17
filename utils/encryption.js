import { Buffer } from 'buffer';
import crypto from 'crypto';

// eslint-disable-next-line no-undef
const algorithm = process.env.JWT_SECRET_ALGORITHM
// eslint-disable-next-line no-undef
const key = crypto.scryptSync(process.env.JWT_SECRET_ENCRYPTION, 'salt', 16);
const iv = Buffer.alloc(16, 0);

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
