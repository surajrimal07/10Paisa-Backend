import crypto from 'crypto';
import jwt from 'jsonwebtoken';


const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync('bbdksdbksajd9999', 'salt', 32);

export function encryptJWT(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptJWT(encryptedText) {
    const [ivHex, encryptedDataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(encryptedDataHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}

export function log(token) {
    try {
        const decryptedToken = decryptJWT(token);
        console.log(`Decrypted Token: ${decryptedToken}`);
    } catch (error) {
        console.error('Decryption failed:', error);
    }
}

//console.log(encryptJWT("secret"));

// Test the decryption
log("4ed367d5182b62212e6f995ea82ce7cc:692a4834926de4a3bd5b4c3f60e2628d");

const decryptedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1cmFqQHJpbWFsLmNvbSIsImlzQWRtaW4iOnRydWUsImlhdCI6MTcxNTc2MzM3NywiZXhwIjoxNzE2MzY4MTc3fQ.p_YRTP5mLQPBuxXdD1gFfJIfyfqvFUG9slbTaRS0NH4'

const decoded = jwt.verify(decryptedToken, '748483939020292828');


console.log(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kathmandu', hour12: false }).replace(' ', 'T'))