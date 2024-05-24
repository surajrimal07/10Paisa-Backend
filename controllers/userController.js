import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import storage from 'node-persist';
import { forgetPassword } from '../controllers/otpControllers.js';
import Portfolio from '../models/portfolioModel.js';
import User from '../models/userModel.js';
import Watchlist from '../models/watchlistModel.js';
import { notifySelectedClients } from '../server/websocket.js';
import { LDAcheck, NameorEmailinPassword, validateEmail, validateName, validatePassword, validatePhoneNumber } from '../utils/dataValidation_utils.js';
import { encryptData } from '../utils/encryption.js';
import globalVariables from '../utils/globalVariables.js';
import { userLogger } from '../utils/logger/userlogger.js';
import { respondWithData, respondWithError, respondWithSuccess } from '../utils/response_utils.js';
import { deleteFromCache, fetchFromCache, saveToCache } from './savefetchCache.js';
import { formatUserData, updateUserField } from './userHelper.js';

//

function setUserDetails({ name, phone, email }) {
  console.log("Setting user global details");
  if (name) globalVariables.setUsername(name);
  if (phone) globalVariables.setPhone(phone);
  if (email) globalVariables.setEmail(email);
}

//on fly validations
export const verifyName = async (req, res) => {
  const name = req.body.name;
  console.log("Name verification requested")
  console.log(name);

  if (!name) {
    return respondWithError(res, 'BAD_REQUEST', "Name is missing");
  }

  if (!validateName(name)) {
    return respondWithError(res, 'BAD_REQUEST', "Name should be fname and lname format.");
  }

  return respondWithSuccess(res, 'SUCCESS', "Name is valid");
};

export const verifyEmail = async (req, res) => {
  const email = req.body.email;

  if (!email) {
    return respondWithError(res, 'BAD_REQUEST', "Email is missing");
  }

  if (!validateEmail(email)) {
    return respondWithError(res, 'BAD_REQUEST', "Invalid email format. Please provide a valid email address.");
  }

  const user = await User.findOne({ email });

  if (user) {
    return respondWithError(res, 'BAD_REQUEST', "Email already exists");
  }
  return respondWithSuccess(res, 'SUCCESS', "Email is valid");
};

export const verifyPassword = async (req, res) => {
  const password = req.body.password;
  const name = req.body.name;
  const email = req.body.email;

  if (!password) {
    return respondWithError(res, 'BAD_REQUEST', "Password is missing");
  }

  const validationError = validatePassword(password);
  if (validationError !== true) {
    return respondWithError(res, 'BAD_REQUEST', validationError);
  }

  if (!NameorEmailinPassword(name, email, password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password contains name or email.");
  }

  if (!LDAcheck(password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password is too common.");
  }

  return respondWithSuccess(res, 'SUCCESS', "Password is valid");
};

export const verifyPhoneNumber = async (req, res) => {
  const phone = req.body.phone;

  if (!phone) {
    return respondWithError(res, 'BAD_REQUEST', "Phone number is missing");
  }

  if (isNaN(phone)) {
    return respondWithError(res, 'BAD_REQUEST', "Phone number should be a number");
  }

  if (!validatePhoneNumber(phone)) {
    return respondWithError(res, 'BAD_REQUEST', "Invalid phone number. Please provide a 10-digit number.");
  }

  const phoneUser = await User.findOne({ phone });

  if (phoneUser) {
    return respondWithError(res, 'BAD_REQUEST', "Phone number already exists");
  }

  return respondWithSuccess(res, 'SUCCESS', "Phone number is valid");
};

//create user
export const createUser = async (req, res) => {
  const { name, password, phone, email } = req.body;

  //encrypting the user details

  userLogger.info(`Create user command passed`);

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  const existingPhone = await User.findOne({ phone });

  if (!name || !email || !password || !phone) {
    return respondWithError(res, 'BAD_REQUEST', "Empty data passed. Please provide all required fields.");
  } else if (!validatePhoneNumber(phone)) {
    return respondWithError(res, 'BAD_REQUEST', "Invalid phone number. Please provide a 10-digit number.");
  } else if (existingPhone) {
    return respondWithError(res, 'BAD_REQUEST', "Phone number already exists.");
  }
  else if (!validateEmail(email)) {
    return respondWithError(res, 'BAD_REQUEST', "Invalid email format. Please provide a valid email address.");
  } else if (existingUser) {
    return respondWithError(res, 'BAD_REQUEST', "Email already exists.");
  }
  else if (!validatePassword(password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password should be at least 6 characters long.");
  } else if (!validateName(name)) {
    return respondWithError(res, 'BAD_REQUEST', "Name should be fname and lname format.");
  } else if (!NameorEmailinPassword(name, email, password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password contains name or email.");
  }
  else if (!LDAcheck(password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password is too common.");
  }

  const emailLowercase = email.toLowerCase();

  try {
    setUserDetails({ name, phone, emailLowercase });
    const samplePortfolio = await Portfolio.create({
      id: 1,
      userEmail: emailLowercase,
      name: "Sample Portfolio",
      stocks: [{ symbol: "CBBL", quantity: 10, wacc: 750 }],
    });

    await User.create({
      name,
      email: emailLowercase,
      password: password,
      phone,
      portfolio: [samplePortfolio._id]
    });

    let userData = await User.findOne({ email: emailLowercase }).populate('portfolio').then(user => formatUserData(user));

    const token = jwt.sign({ email: emailLowercase }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY_TIME });

    userData.token = await encryptData(token);

    userLogger.info(`User created successfully`);
    return respondWithData(res, 'CREATED', "User created successfully", userData);
  } catch (err) {
    userLogger.error(`Error creating user: ${err.toString()}`);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
  }
};

//login attempts added to cache to prevent brute force attack
export const loginUser = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    userLogger.info("Invalid email or password.");
    return respondWithError(res, 'BAD_REQUEST', "Invalid email or password.");
  };

  try {
    let failedLoginAttempts = await fetchFromCache(`failedLoginAttempts:${email}`);

    if (!failedLoginAttempts) {
      failedLoginAttempts = {};
    }

    if (failedLoginAttempts[email] && failedLoginAttempts[email].attempts >= process.env.MAX_LOGIN_ATTEMPTS) {
      const cooldownTimeRemaining = failedLoginAttempts[email].cooldownUntil - Date.now();

      if (cooldownTimeRemaining > 0) {
        const minutesRemaining = Math.ceil(cooldownTimeRemaining / (60 * 1000));
        userLogger.error(`Too many login attempts of ${email}. Please try again in ${minutesRemaining} minutes.`);
        return respondWithError(res, 'TOO_MANY_REQUESTS', `Too many login attempts. Please try again in ${minutesRemaining} minutes.`);
      } else {
        delete failedLoginAttempts[email].attempts;
      }
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('portfolio');

    if (!user || !(await bcrypt.compare(password, user.password))) {

      if (!failedLoginAttempts[email]) {
        failedLoginAttempts[email] = { attempts: 1, cooldownUntil: Date.now() + parseInt(process.env.COOLDOWN_TIME, 10) };
      } else {
        failedLoginAttempts[email].attempts++;
      }

      await saveToCache(`failedLoginAttempts:${email}`, failedLoginAttempts);

      userLogger.info("Invalid email or password.");
      return respondWithError(res, 'UNAUTHORIZED', "Invalid email or password.");

    } else {
      await deleteFromCache(`failedLoginAttempts:${email}`);

      const isExpired = user.isPasswordExpired();
      if (isExpired) {
        notifyClients({ type: 'notification', title: 'Password Expired', description: "Your password is expired, please change soon", image: user.dpImage, url: "https://10paisa.com" });
      }

      let userData = await formatUserData(user);

      const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY_TIME });

      const encryptedToken = await encryptData(token);

      userData.token = encryptedToken;

      req.session.userEmail = email;
      //add Bearer to token

      req.session.jwtToken = `Bearer ${encryptedToken}`; //for testing

      notifySelectedClients(user.email, { type: 'notification', title: 'Login', description: "User " + user.name + " logged in", image: user.dpImage, url: "https://10paisa.com" });
      return respondWithData(res, 'SUCCESS', "Login successful", userData);
    }
  } catch (error) {
    userLogger.error(`Error logging in user: ${error.toString}`);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }
};

export const forgetPass = async (req, res) => {
  const email = req.body.email;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const hash = await forgetPassword(email);
      return respondWithData(res, 'SUCCESS', "OTP Sent successfully", hash);
    } else {
      return respondWithError(res, 'NOT_FOUND', "Email Not found");
    }
  } catch (err) {
    console.error(err);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
  }
};


//i believe this was created to be used in mobile app
//but we now created a on fly check so this is not necessary
export const verifyData = async (req, res) => {
  const fieldToUpdate = req.body.field;
  const valueToCheck = req.body.value;

  if (fieldToUpdate === 'email') {
    try {
      const existingUser = await User.findOne({ email: valueToCheck });
      if (!existingUser) {

        console.log("Email is fresh");
        return respondWithSuccess(res, 'SUCCESS', "Email is fresh");

      } else {
        console.log("Email already exists");
        return respondWithError(res, 'BAD_REQUEST', "Email already exists");
      }
    } catch (error) {
      console.error("Error looking for email:", error);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
    }
  }

  if (fieldToUpdate === 'phone') {

    try {
      const existingUser = await User.findOne({ phone: valueToCheck });
      if (!existingUser) {
        console.log("Phone is fresh");
        return respondWithSuccess(res, 'SUCCESS', "Phone is fresh");
      } else {
        console.log("Phone already exists");
        return respondWithError(res, 'BAD_REQUEST', "Phone already exists");
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
    }
  }
};

//function to update single user data based on what user wants to update
//this is useful in mobile app where we will not update whole form again but only the field user wants to update
export const updateUser = async (req, res) => {
  const email = req.session.userEmail;

  const { fieldToUpdate, valueToUpdate } = req.body;

  if (!email || !fieldToUpdate || !valueToUpdate) {
    return respondWithError(res, 'BAD_REQUEST', "Email, field or value is missing");
  };

  try {
    let user = await User.findOne({ email: email.toLowerCase() }).populate('portfolio');
    if (!user) {
      console.log("User not found");
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    const result = await updateUserField(user, fieldToUpdate, valueToUpdate, email);
    if (result.error) {
      return respondWithError(res, 'BAD_REQUEST', result.error);
    }
    await user.save();

    let userData = await formatUserData(user);

    if (fieldToUpdate === 'email' || fieldToUpdate === 'password') {
      const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY_TIME });
      userData.token = await encryptData(token);
      req.session.userEmail = email;
    }

    return respondWithData(res, 'SUCCESS', fieldToUpdate + " updated successfully", userData);

  } catch (error) {
    console.error('Error updating user data:', error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user data");
  }
};

//not sure why this is here
export const verifyUser = async (req, res) => {

  console.log("User verification requested")

  const email = req.body.email;
  let user_token;

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('portfolio');
    if (!user) {
      console.log("401 Invalid email.");
      return respondWithError(res, 'UNAUTHORIZED', "Invalid email.");
    } else {

      console.log("User verification was successful");
      const cachedtkn = await storage.getItem(User_token_key);

      if (!cachedtkn) {
        const token = jwt.sign({ email: email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await saveToCache(email + '_token', encryped_token);
        user_token = await encryptData(token);
      } else {
        user_token = cachedtkn;
      }
      let userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        pass: user.password,
        phone: user.phone,
        token: user_token,
        profilePicture: user.profilePicture,
        style: user.style,
        premium: user.premium,
        defaultport: user.defaultport,
        isAdmin: user.isAdmin,
        dpImage: user.dpImage,
        userAmount: user.userAmount,
        portfolio: user.portfolio,
        wallets: user.wallets
      };
      return respondWithData(res, 'SUCCESS', "User Verified", userData);
    }
  } catch (error) {
    console.log("500 An error occurred during user verification.");
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "An error occurred during user verification.");
  }
};

export const deleteAccount = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return respondWithError(res, 'NOT_FOUND', "User not found or invalid password");
    }

    await Promise.all([
      Portfolio.deleteMany({ userEmail: email }), ////many or findOneAndDelete
      Watchlist.deleteMany({ userEmail: email }),
      User.deleteOne({ email: email })
    ]);
    req.session.userEmail = null;
    return respondWithSuccess(res, 'SUCCESS', "User deleted successfully");

  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }
};

export const logoutUser = async (req, res) => {
  req.session.userEmail = null;
  return respondWithSuccess(res, 'SUCCESS', "User logged out successfully");
};

//update all at once
export const updateUserData = async (req, res) => {
  const { oldEmail, newEmail, password, phone, style, name, userAmount, premium } = req.body;

  if (!oldEmail) {
    return respondWithError(res, 'BAD_REQUEST', "Old email missing");
  }

  try {
    const user = await User.findOne({ email: oldEmail }).populate('portfolio');
    if (!user) {
      console.log("User not found");
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    const fieldsToUpdate = { email: newEmail, name, phone, style, userAmount, premium, password };
    for (const [field, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined && value !== user[field]) {
        const result = await updateUserField(user, field, value, oldEmail);
        if (result.error) {
          return respondWithError(res, 'BAD_REQUEST', result.error);
        }
      }
    }

    await user.save();
    const userData = formatUserData(user);

    if (fieldsToUpdate.email || fieldsToUpdate.password) {
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY_TIME });
      userData.token = await encryptData(token);
      req.session.userEmail = user.email;
    }
    return respondWithData(res, 'SUCCESS', "User data updated successfully", user);

  } catch (error) {
    console.error('Error updating user data:', error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user data");
  }
};

//image part //upload
export const updateUserProfilePicture = async (req, res) => {
  console.log(req.body);

  const oldEmail = req.body.oldEmail;

  if (!oldEmail) {
    return respondWithError(res, 'BAD_REQUEST', "Old email missing");
  }

  if (!req.files) {
    return respondWithError(res, 'BAD_REQUEST', "Profile picture missing");
  }

  const { dpImage } = req.files;

  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const fileExtension = dpImage.originalFilename.substring(dpImage.originalFilename.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    return respondWithError(res, 'BAD_REQUEST', "Only JPG and PNG files are allowed");
  }

  try {
    const user = await User.findOne({ email: oldEmail }).populate('portfolio');
    if (!user) {
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    if (dpImage && dpImage.path) {
      let uploadedImage;
      try {
        uploadedImage = await cloudinary.uploader.upload(
          dpImage.path,
          {
            folder: "UserDP",
            crop: "scale",
            overwrite: true,
          },
        );
        user.dpImage = uploadedImage.secure_url;
      } catch (e) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error uploading image");
      }
    }

    await user.save();
    const userData = await formatUserData(user);
    return respondWithData(res, 'SUCCESS', "User profile picture updated successfully", userData);

  } catch (error) {
    console.error('Error updating user profile picture:', error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating profile picture");
  }
};