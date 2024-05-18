
export const validatePassword = (password) => {
    if (password.length < 8) {
        return "Password should be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password should contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
        return "Password should contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
        return "Password should contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return "Password should contain at least one special character";
    }
    if (/(\w)\1{2,}/.test(password)) {
        return "Password should not contain repeating characters more than twice";
    }
    if (/\s/.test(password)) {
        return "Password should not contain spaces";
    }
    return true;
}

//validatePassword("suraj@123");
// if (validatePassword("David$Holly@0014")) {
//     console.log("Password is valid");
// } else {

// }

console.log(validatePassword("olly@0014"));




//
const updateUserField = async (user, fieldToUpdate, valueToUpdate, email) => {
    switch (fieldToUpdate) {
        case 'name':
            if (!validateName(valueToUpdate)) {
                throw new Error("Name should be in fname and lname format.");
            }
            user.name = valueToUpdate;
            break;
        case 'userAmount':
            if (isNaN(valueToUpdate)) {
                throw new Error("User amount should be a number");
            }
            user.userAmount = valueToUpdate;
            break;
        case 'password':
            let password = valueToUpdate;
            if (typeof password !== 'string') {
                password = valueToUpdate.toString();
            }

            const passwordValidationResult = validatePassword(password);
            if (passwordValidationResult !== true) {
                throw new Error(passwordValidationResult);
            } else if (!LDAcheck(password)) {
                throw new Error("Password is too common.");
            } else if (!NameorEmailinPassword(user.name, email, password)) {
                throw new Error("Password contains name or email.");
            }

            const newPasswordHash = await bcrypt.hash(password, 10);
            user.LastPasswordChangeDate = new Date(Math.floor(Date.now() / 1000) * 1000);
            user.password = newPasswordHash;
            break;
        case 'email':
            if (!validateEmail(valueToUpdate)) {
                throw new Error("Invalid email format. Please provide a valid email address.");
            }
            const existingUser = await User.findOne({ email: valueToUpdate.toLowerCase() });
            if (!existingUser) {
                user.email = valueToUpdate;
            } else {
                throw new Error("Email already exists.");
            }
            break;
        case 'phone':
            if (!validatePhoneNumber(valueToUpdate) || isNaN(valueToUpdate)) {
                throw new Error("Invalid phone number. Please provide a 10-digit number.");
            }
            const existingPhoneUser = await User.findOne({ phone: valueToUpdate });
            if (!existingPhoneUser) {
                user.phone = valueToUpdate;
            } else {
                throw new Error("Phone already exists");
            }
            break;
        case 'style':
            if (isNaN(valueToUpdate) || valueToUpdate <= 0 || valueToUpdate >= 4) {
                throw new Error("Style should be a valid number");
            }
            user.style = valueToUpdate;
            break;
        case 'premium':
            if (typeof valueToUpdate !== 'boolean') {
                throw new Error("Premium should be boolean");
            }
            user.premium = valueToUpdate;
            break;
        case 'wallets':
            if (isNaN(valueToUpdate) || valueToUpdate <= 0 || valueToUpdate >= 4) {
                throw new Error("Wallets should be a valid number");
            }
            user.wallets = valueToUpdate;
            break;
        case 'defaultport':
            if (isNaN(valueToUpdate)) {
                throw new Error("Default port should be a number");
            }
            user.defaultport = valueToUpdate;
            break;
        default:
            throw new Error("Invalid field to update");
    }
};


// //cryptoJS is decripted so don't use it for sensitive data
// const encrypt = (data) => {
//     const ciphertext = CryptoJS.AES.encrypt(data, 'secret key 123').toString();
//     return ciphertext;
// }

// const decrypt = (data) => {
//     const bytes = CryptoJS.AES.decrypt(data, 'secret key 123');
//     const originalText = bytes.toString(CryptoJS.enc.Utf8);
//     return originalText;
// }

// console.log(encrypt(8899999));

// console.log(decrypt("U2FsdGVkX1+8pna+r3ugcEU1mjDMO/QQ0/sd4DiMVlA="));

import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function encryptData(text) {
    const salt = await bcrypt.genSalt(saltRounds);
    const encrypted = await bcrypt.hash(text.toString(), salt);
    return encrypted;
}

export async function decryptData(encryptedText) {
    const decrypted = await bcrypt.compare(encryptedText, encryptedText);
    return decrypted;
}

console.log(await encryptData("suraj@123"));


console.log(await decryptData("$2b$10$Cy/PIHTNAkIQa0hqx7dR2eDIA9VtjamWVQIJszPqfEf5EhROnLO3K"));