import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import { LDAcheck, NameorEmailinPassword, validateEmail, validateName, validatePassword, validatePhoneNumber } from '../utils/dataValidation_utils.js';

const formatPortfolioData = (portfolio) => {
    if (Array.isArray(portfolio)) {
        return portfolio.map((singlePortfolio) => formatSinglePortfolio(singlePortfolio));
    } else {
        return formatSinglePortfolio(portfolio);
    }
};

const formatSinglePortfolio = (portfolio) => {
    return {
        _id: portfolio._id,
        id: portfolio.id,
        name: portfolio.name,
        userEmail: portfolio.userEmail,
        stocks: portfolio.stocks,
        totalunits: portfolio.totalunits,
        gainLossRecords: portfolio.gainLossRecords,
        portfoliocost: portfolio.portfoliocost,
        portfoliovalue: portfolio.portfoliovalue,
        recommendation: portfolio.recommendation,
        percentage: portfolio.percentage,
    };
};

export const formatUserData = async (user) => {
    const formattedPortfolio = formatPortfolioData(user.portfolio);

    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dpImage: user.dpImage,
        style: user.style,
        premium: user.premium,
        defaultport: user.defaultport,
        isAdmin: user.isAdmin,
        dpImage: user.dpImage,
        defaultport: user.defaultport,
        userAmount: user.userAmount,
        portfolio: formattedPortfolio,
        wallets: user.wallets,
        LastPasswordChangeDate: user.LastPasswordChangeDate
    };

    return userData;
};

export const updateUserField = async (user, fieldToUpdate, valueToUpdate, email) => {
    switch (fieldToUpdate) {
        case 'name':
            if (!validateName(valueToUpdate)) {
                return { error: "Name should be in fname and lname format." };
            }
            user.name = valueToUpdate;
            break;
        case 'userAmount':
            if (isNaN(valueToUpdate)) {
                return { error: "User amount should be a number" };
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
                return { error: passwordValidationResult };
            } else if (!LDAcheck(password)) {
                return { error: "Password is too common." };
            } else if (!NameorEmailinPassword(user.name, email, password)) {
                return { error: "Password contains name or email." };
            }

            const passwordMatch = user.previousPasswords.some((hash) => bcrypt.compareSync(password, hash));

            if (passwordMatch) {
                return { error: "Password matches with old password, please use new password" };
            }

            user.password = password;
            break;
        case 'email':
            if (!validateEmail(valueToUpdate)) {
                return { error: "Invalid email format. Please provide a valid email address." };
            }
            const existingUser = await User.findOne({ email: valueToUpdate.toLowerCase() });
            if (existingUser) {
                return { error: "Email already exists" };
            }
            user.email = valueToUpdate;
            break;
        case 'phone':
            if (!validatePhoneNumber(valueToUpdate) || isNaN(valueToUpdate)) {
                return { error: "Invalid phone number. Please provide a 10-digit number." };
            }
            const existingPhoneUser = await User.findOne({ phone: valueToUpdate });
            if (existingPhoneUser) { //test this
                return { error: "Phone already exists" };
            }
            user.phone = valueToUpdate;
            break;
        case 'style':
            if (isNaN(valueToUpdate) || valueToUpdate <= 0 || valueToUpdate >= 4) {
                return { error: "Style should be a valid number" };
            }
            user.style = valueToUpdate;
            break;
        case 'premium':
            if (typeof valueToUpdate !== 'boolean') {
                return { error: "Premium should be boolean" };
            }
            user.premium = valueToUpdate;
            break;
        case 'wallets':
            if (isNaN(valueToUpdate) || valueToUpdate <= 0 || valueToUpdate >= 4) {
                return { error: "Wallets should be a valid number" };
            }
            user.wallets = valueToUpdate;
            break;
        case 'defaultport':
            if (isNaN(valueToUpdate)) {
                return { error: "Default port should be a number" };
            }
            user.defaultport = valueToUpdate;
            break;
        default:
            return { error: "Invalid field to update" };
    }
    return { user };
};