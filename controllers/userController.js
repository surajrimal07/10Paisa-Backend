import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import storage from 'node-persist';
import { forgetPassword } from '../controllers/otpControllers.js';
import Portfolio from '../models/portfolioModel.js';
import User from '../models/userModel.js';
import { notifySelectedClients } from '../server/websocket.js';
import { LDAcheck, NameorEmailinPassword, validateEmail, validateName, validatePassword, validatePhoneNumber } from '../utils/dataValidation_utils.js';
import globalVariables from '../utils/globalVariables.js';
import { respondWithData, respondWithError, respondWithSuccess } from '../utils/response_utils.js';
import { userLogger } from '../utils/logger/userlogger.js';


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
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;
  const style = req.body.style !== undefined ? req.body.style : undefined;
  const isAdmin = req.body.isAdmin ?? false;
  const premium = req.body.premium ?? false;
  const userAmount = req.body.amount !== undefined ? req.body.amount : undefined;

  console.log("Create user command passed");
  console.log(req.body);

  if (!name || !email || !password || !phone) {
    return respondWithError(res, 'BAD_REQUEST', "Empty data passed. Please provide all required fields.");
  } else if (!validatePhoneNumber(phone)) {
    return respondWithError(res, 'BAD_REQUEST', "Invalid phone number. Please provide a 10-digit number.");
  } else if (!validateEmail(email)) {
    return respondWithError(res, 'BAD_REQUEST', "Invalid email format. Please provide a valid email address.");
  } else if (!validatePassword(password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password should be at least 6 characters long.");
  } else if (!validateName(name)) {
    return respondWithError(res, 'BAD_REQUEST', "Name should be fname and lname format.");
  } else if (!LDAcheck(password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password is too common.");
  }

  let dpImage;

  if (req.files && req.files.length > 0) {
    dpImage = req.files[0];
  }

  try {
    setUserDetails({ name, phone, email });
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email: email, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await storage.setItem(email + '_token', token);

    const samplePortfolio = await Portfolio.create({
      id: 1,
      userEmail: email,
      name: "Sample Portfolio",
      stocks: [{ symbol: "CBBL", quantity: 10, wacc: 750 }],
    });

    const newUser = new User({
      token,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      style,
      isAdmin,
      premium,
      dpImage: dpImage ? dpImage.path : undefined,
      userAmount: userAmount !== undefined ? userAmount : undefined,
      portfolio: [samplePortfolio._id],

    });
    try {
      const savedUser = await newUser.save();
      const populatedPortfolio = await Portfolio.findById(samplePortfolio._id);
      const formattedPortfolio = formatPortfolioData(populatedPortfolio)

      const userData = {
        _id: savedUser._id,
        token: savedUser.token,
        name: savedUser.name,
        email: savedUser.email,
        pass: savedUser.password,
        phone: savedUser.phone,
        style: savedUser.style,
        isAdmin: savedUser.isAdmin,
        dpImage: savedUser.dpImage,
        userAmount: savedUser.userAmount,
        portfolio: [formattedPortfolio],
        wallets: savedUser.wallets
      };
      console.log("Signup Was Success");
      return respondWithData(res, 'CREATED', "User created successfully", userData);
    } catch (err) {
      console.log("Signup failed");
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
    }
  } catch (err) {
    console.error(err);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
  }
};

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
//
export const loginUser = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('portfolio');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      userLogger.info("Invalid email or password.");
      return respondWithError(res, 'UNAUTHORIZED', "Invalid email or password.");
    } else {
      const isExpired = user.isPasswordExpired() ?? notifyClients({ type: 'notification', title: 'Password Expired', description: "Your password is expired, please change soon", image: user.dpImage, url: "https://10paisa.com" });
      // if (isExpired) {
      //   notifyClients({ type: 'notification', title: 'Password Expired', description: "Your password is expired, please change soon", image: user.dpImage, url: "https://10paisa.com" });
      // }

      const token = jwt.sign({ email: email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
      await storage.setItem(email + '_token', token);

      let userData = {
        _id: user._id,
        token: token,
        name: user.name,
        email: user.email,
        pass: user.password,
        phone: user.phone,
        premium: user.premium,
        style: user.style,
        isAdmin: user.isAdmin,
        dpImage: user.dpImage,
        userAmount: user.userAmount,
        defaultport: user.defaultport,
        portfolio: user.portfolio,
        wallets: user.wallets,
        LastPasswordChangeDate: user.LastPasswordChangeDate
      };
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

const User_token_key = 'user_token';

export const updateUser = async (req, res) => {
  const { email, password, phone, style, field: fieldToUpdate, value: valueToUpdate, useramount: userAmount } = req.body;
  let token = '';

  if (!email) {
    return respondWithError(res, 'BAD_REQUEST', "User email is missing");
  }

  if (!fieldToUpdate) {
    return respondWithError(res, 'BAD_REQUEST', "Field to update missing");
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    const populatedPortfolio = await Portfolio.find({ userEmail: email });
    const formattedPortfolio = formatPortfolioData(populatedPortfolio);

    switch (fieldToUpdate) {
      case 'name':
        console.log("Username updated, new " + fieldToUpdate + " is " + valueToUpdate)
        user.name = valueToUpdate;
        break;
      case 'useramount':
        console.log("User updated, new " + fieldToUpdate + " is " + valueToUpdate)
        user.userAmount = valueToUpdate;
        break;
      case 'password':
        const newPasswordHash = await bcrypt.hash(valueToUpdate, 10);
        console.log("User password updated, new " + fieldToUpdate + " is " + valueToUpdate)
        user.password = newPasswordHash;
        break;
      case 'email':
        try {
          const existingUser = await User.findOne({ email: valueToUpdate.toLowerCase() });
          if (!existingUser) {
            console.log("User email updated, new " + fieldToUpdate + " is " + valueToUpdate);
            user.email = valueToUpdate;
          } else {
            return respondWithError(res, 'BAD_REQUEST', "Email already exists");
          }
        } catch (error) {
          console.error("Error updating user email:", error);
          return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating email");
        }
        break;
      case 'phone':
        try {
          const existingUser = await User.findOne({ phone: valueToUpdate });
          if (!existingUser) {
            console.log("User phone updated, new " + fieldToUpdate + " is " + valueToUpdate);
            user.phone = valueToUpdate;
          } else {
            console.log("Phone already exists");
            return respondWithError(res, 'BAD_REQUEST', "Phone already exists");
          }
        } catch (error) {
          console.error("Error updating user Phone:", error);
          return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating phone");
        }
        break;
      case 'style':
      case 'premium':
      case 'wallets':
        user[fieldToUpdate] = valueToUpdate;
        console.log("User " + fieldToUpdate + " updated, new value is " + valueToUpdate);
        break;
      default:
        return respondWithError(res, 'BAD_REQUEST', "Invalid field to update");
    }

    await user.save();

    const cachedtkn = await storage.getItem(email + '_token');

    if (cachedtkn == null) {
      token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
      await storage.setItem(email + '_token', token);
    } else {
      token = cachedtkn;
    }
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      pass: user.password,
      phone: user.phone,
      token: token,
      profilePicture: user.profilePicture,
      style: user.style,
      premium: user.premium,
      defaultport: user.defaultport,
      isAdmin: user.isAdmin,
      dpImage: user.dpImage,
      userAmount: user.userAmount,
      portfolio: formattedPortfolio,
      wallets: user.wallets
    };

    console.log('User ' + fieldToUpdate + ' updated successfully');
    return respondWithData(res, 'SUCCESS', fieldToUpdate + " updated successfully", userData);

  } catch (error) {
    console.error('Error updating user data:', error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user data");
  }
};


// //works //for individual updates //
// export const updateUser = async (req, res) => {
//   const token = req.body.token;
//   const email = req.body.email;
//   const newPassword  = req.body.password;
//   const phone = req.body.phone;
//   const invStyle = req.body.style;
//   const fieldToUpdate = req.body.field;
//   const valueToUpdate = req.body.value;
//   const userAmount = req.body.useramount;

//   const User_token_key = email + '_token';


//   if (!email ) {
//     return respondWithError(res, 'BAD_REQUEST', "User email is missing");
//   }
//   if (!fieldToUpdate) {
//     return respondWithError(res, 'BAD_REQUEST', "Field to update missing");
//   }

//   try {
//     const user = await User.findOne({ email })

//     if (!user) {
//       console.log("User not found");
//       return respondWithError(res, 'NOT_FOUND', "User not found");
//     }
//     const populatedPortfolio = await Portfolio.find({ userEmail: email });

//     const formattedPortfolio = formatPortfolioData(populatedPortfolio);

//     if (fieldToUpdate === 'name') {
//       console.log("Username updated, new "+fieldToUpdate+ " is "+valueToUpdate)
//       user.name = valueToUpdate;
//     }

//     if (fieldToUpdate == 'useramount') {
//     console.log("User updated, new "+fieldToUpdate+ " is "+valueToUpdate)
//     user.userAmount = valueToUpdate;
//     }

//     if (fieldToUpdate === 'password') {
//       const newPassword = await bcrypt.hash(valueToUpdate, 10);
//       console.log("User password updated, new "+fieldToUpdate+ " is "+valueToUpdate)
//       user.password = newPassword;
//     }

//     if (fieldToUpdate === 'email') {
//       try {
//         const existingUser = await User.findOne({ email: valueToUpdate.toLowerCase() });

//         console.log(existingUser);

//         if (!existingUser) {
//           console.log("User email updated, new " + fieldToUpdate + " is " + valueToUpdate);

//           user.email = valueToUpdate;

//           const savedUser = await user.save();

//           const cachedtkn = await storage.getItem(User_token_key);
//           let userData = {
//             _id: savedUser._id,
//             name: savedUser.name,
//             email: savedUser.email,
//             pass: savedUser.password,
//             phone: savedUser.phone,
//             token: cachedtkn,
//             premium: savedUser.premium,
//             profilePicture: savedUser.profilePicture,
//             style: savedUser.style,
//             defaultport: savedUser.defaultport,
//             isAdmin: savedUser.isAdmin,
//             dpImage: savedUser.dpImage,
//             userAmount: savedUser.userAmount,
//             portfolio: formattedPortfolio,
//             wallets: savedUser.wallets
//           };

//           return respondWithData(res, 'SUCCESS', "Email updated successfully", userData);
//         } else {
//           return respondWithError(res, 'BAD_REQUEST', "Email already exists");
//         }
//       } catch (error) {
//         console.error("Error updating user email:", error);
//         return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating email");
//       }
//     }

//     if (fieldToUpdate === 'phone') {
//       try {
//         const existingUser = await User.findOne({ phone: valueToUpdate });
//         if (!existingUser) {
//           console.log("User phone updated, new " + fieldToUpdate + " is " + valueToUpdate);

//           user.phone = valueToUpdate;

//           await user.save();

//           const cachedtkn = await storage.getItem(User_token_key);
//           let userData = {
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             pass: user.password,
//             phone: user.phone,
//             token: cachedtkn,
//             premium: user.premium,
//             profilePicture: user.profilePicture,
//             style: user.style,
//             defaultport: user.defaultport,
//             isAdmin: user.isAdmin,
//             dpImage: user.dpImage,
//             userAmount: user.userAmount,
//             portfolio: formattedPortfolio,
//             wallets: user.wallets
//           };

//           return respondWithData(res, 'SUCCESS', "Phone updated successfully", userData);
//         } else {
//           console.log("Phone already exists");
//           return respondWithError(res, 'BAD_REQUEST', "Phone already exists");
//         }
//       } catch (error) {
//         console.error("Error updating user Phone:", error);
//         return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating phone");
//       }
//     }

//     else if (fieldToUpdate === 'style') {
//       user.style = valueToUpdate;
//       console.log("User Style updated, new "+fieldToUpdate+ " is " +valueToUpdate)
//     }

//     //
//     else if (fieldToUpdate === 'premium') {
//       user.premium = valueToUpdate;
//       console.log("User Premium updated, new "+fieldToUpdate+ " is " +valueToUpdate)
//     }

//     else if (fieldToUpdate === 'wallets') {

//      user.wallets = valueToUpdate;
//       console.log("User Wallets updated, new "+fieldToUpdate+ " is " +valueToUpdate)
//     }

//     try {
//       await user.save();
//       const cachedtkn = await storage.getItem(User_token_key);
//       let userData = {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         pass: user.password,
//         phone: user.phone,
//         token: cachedtkn,
//         profilePicture: user.profilePicture,
//         style: user.style,
//         premium: user.premium,
//         defaultport: user.defaultport,
//         isAdmin: user.isAdmin,
//         dpImage: user.dpImage,
//         userAmount: user.userAmount,
//         portfolio: formattedPortfolio,
//         wallets: user.wallets
//       };

//       console.log('User ' + fieldToUpdate + ' updated successfully');
//       return respondWithData(res, 'SUCCESS',  fieldToUpdate + " updated successfully", userData);
//     } catch (error) {
//       console.error('User ' + fieldToUpdate + ' update failed: ' + error);
//       return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user " + fieldToUpdate);
//     }
//   } catch (error) {
//     console.error('Error updating user data:', error);
//     return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user data");
//   }
// };

//

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
        await storage.setItem(User_token_key, token);
        user_token = token;
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

// export const fetchToken = async (req, res) => {
//   const email = req.body.email;

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       console.log("401 Invalid email");
//       return respondWithError(res, 'UNAUTHORIZED', "Invalid email");
//     } else {
//       return respondWithData(res, 'SUCCESS', "Token fetched successfully", user.token);

//     }
//   } catch (error){
//     console.log(error.toString());
//     return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
//   }
// };

export const deleteAccount = async (req, res) => {

  const email = req.body.email;
  const passwords = req.body.password;
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    const isPasswordValid = await bcrypt.compare(passwords, user.password);

    if (!isPasswordValid) {
      return respondWithError(res, 'UNAUTHORIZED', "Invalid password");
    }

    await Portfolio.deleteMany({ userEmail: email });
    await User.deleteOne({ email: email });

    return respondWithSuccess(res, 'SUCCESS', "User deleted successfully");

  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }
};

// //works
// export const defaultportfolio = async (req, res) => {
//   console.log("Change default portfolio requested")
//   const email = req.body.email;
//   const portfolioId = req.body.id;

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       return respondWithError(res, 'NOT_FOUND', "User not found");
//     }
//     if (user.defaultport === portfolioId) {
//       console.log('Portfolio is already set as default');
//       return respondWithError(res, 'BAD_REQUEST', "Portfolio is already set as default");
//     }

//     user.defaultport = portfolioId;
//     await user.save();

//     console.log("200 Portfolio ID updated");
//     return respondWithSuccess(res, 'SUCCESS', "Portfolio ID updated");

//   } catch (error) {
//     console.error(error);

//     return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
//   }
// };


// export const removedefaultportfolio = async (req, res) => {
//   const token = req.body.token;

//   try {
//     const user = await User.findOne({ token });

//     if (!user) {
//       return respondWithError(res, 'NOT_FOUND', "User not found");
//     }

//     user.defaultport = 1;

//   } catch (error) {
//     console.error(error);
//     return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
//   }

// };

export const makeadmin = async (req, res) => {
  const token = req.body.token;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    if (user.isAdmin !== undefined) {
      user.isAdmin = true;
    } else {
      user.isAdmin = true;
    }

    user.isAdmin = true;
    await user.save();

    console.log("Made user admin");
    return respondWithSuccess(res, 'SUCCESS', "Made user Admin");

  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }
};

//google signin
export const googleSignIn = async (req, res) => {
  const { googleToken } = req.body;

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      return respondWithError(res, 'UNAUTHORIZED', "No Account found with this email");
    }
    const token = jwt.sign({ email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await storage.setItem('user_token', token);

    let userData = {
      _id: user._id,
      token: token,
      name: user.name,
      email: user.email,
      pass: user.password,
      phone: user.phone,
      style: user.style,
      isAdmin: user.isAdmin,
      dpImage: user.dpImage,
      premium: user.premium,
      userAmount: user.userAmount,
      defaultport: user.defaultport,
      portfolio: user.portfolio,
      wallets: user.wallets

    };

    return respondWithData(res, 'SUCCESS', 'Google Sign-In successful', userData);
  } catch (error) {
    console.error(error.toString());
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }

};

//extracting all user data //one to upload user one to upload picture
export const updateUserData = async (req, res) => {
  const oldEmail = req.body.oldEmail;
  const newEmail = req.body.newEmail;
  const newPassword = req.body.password;
  const phone = req.body.phone;
  const invStyle = req.body.style;
  const userName = req.body.name;
  const userAmount = req.body.useramount;
  const isAdmin = req.body.isAdmin;
  const premium = req.body.premium;

  if (!oldEmail) {
    return respondWithError(res, 'BAD_REQUEST', "Old email missing");
  }

  try {
    const user = await User.findOne({ email: oldEmail }).populate('portfolio');

    if (!user) {
      console.log("User not found");
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    user.email = newEmail || user.email;
    user.name = userName || user.name;
    user.phone = phone || user.phone;
    user.style = invStyle || user.style;
    user.userAmount = userAmount || user.userAmount;
    user.premium = premium || user.premium;

    if (newEmail && newEmail !== oldEmail) {
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser && !existingUser._id.equals(user._id)) {
        console.log("Email already exists");
        return respondWithError(res, 'BAD_REQUEST', "Email already exists");
      }
    }

    if (isAdmin) {
      user.isAdmin = isAdmin;
    }
    if (phone) {
      const existingUser = await User.findOne({ phone: phone });
      if (existingUser && !existingUser._id.equals(user._id)) {
        console.log("Phone already exists");
        return respondWithError(res, 'BAD_REQUEST', "Phone already exists");
      }
    }
    await user.save();
    console.log('User data updated successfully');
    return respondWithData(res, 'SUCCESS', "User data updated successfully", user);

  } catch (error) {
    console.error('Error updating user data:', error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user data");
  }
};

//image part //upload
export const updateUserProfilePicture = async (req, res) => {
  const oldEmail = req.body.oldEmail;
  const { dpImage } = req.files;

  if (!oldEmail) {
    return respondWithError(res, 'BAD_REQUEST', "Old email missing");
  }

  try {
    const user = await User.findOne({ email: oldEmail }).populate('portfolio');

    if (!user) {
      console.log("User not found");
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
        console.log("User DP updated, new dp is " + uploadedImage.secure_url);
        user.dpImage = uploadedImage.secure_url;
      } catch (e) {
        console.log(e);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error uploading image");
      }
    }
    try {

      await user.save();

      let token = '';
      const cachedtkn = await storage.getItem(oldEmail + '_token');
      if (cachedtkn == null) {
        const token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await storage.setItem(oldEmail + '_token', token);
      } else {
        token = cachedtkn;
      }

      let userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        pass: user.password,
        phone: user.phone,
        token: token,
        profilePicture: user.profilePicture,
        style: user.style,
        premium: user.premium,
        defaultport: user.defaultport,
        isAdmin: user.isAdmin,
        dpImage: user.dpImage,
        userAmount: user.userAmount,
        portfolio: user.portfolio
      };
      console.log('User profile picture updated successfully');
      return respondWithData(res, 'SUCCESS', "User profile picture updated successfully", userData);
    } catch (error) {
      console.error('User profile picture update failed: ' + error);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating profile picture");
    }
  } catch (error) {
    console.error('Error updating user profile picture:', error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating profile picture");
  }
};