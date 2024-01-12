import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { forgetPassword } from '../controllers/otpControllers.js';
import Portfolio from '../models/portfolioModel.js';
import User from '../models/userModel.js';
import { validateEmail, validateName, validatePassword, validatePhoneNumber } from '../utils/dataValidation_utils.js';
import { respondWithData, respondWithError, respondWithSuccess } from '../utils/response_utils.js';

export const createUser = async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;
  const style = req.body.style !== undefined ? req.body.style : undefined;
  const isAdmin = req.body.isAdmin ?? false;
  const userAmount = req.body.amount !== undefined ? req.body.amount : undefined;

  console.log("Create user command passed")
  console.log(req.body);
  //console.log("Name: "+name,  "Email: "+email, "Password: "+password, "phone: "+phone, "Style: "+style);


  if (!name || !email || !password || !phone) {
    return respondWithError(res, 'BAD_REQUEST', "Empty data passed. Please provide all required fields.");
  }

  if (!validatePhoneNumber(phone)) {
    //print phone along with it's data type
    console.log(phone, typeof phone);
    return respondWithError(res, 'BAD_REQUEST', "Invalid phone number. Please provide a 10-digit number.");
  }

  if (!validateEmail(email)) {
    return respondWithError(res, 'BAD_REQUEST', "Invalid email format. Please provide a valid email address.");
  }

  if (!validatePassword(password)) {
    return respondWithError(res, 'BAD_REQUEST', "Password should be at least 6 characters long.");
  }

  if (!validateName(name)) {
    return respondWithError(res, 'BAD_REQUEST', "Name should be fname and lname format.");
  }

  let dpImage;

  if (req.files && req.files.length > 0) {
    dpImage = req.files[0];
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const token = jwt.sign({email : email}, process.env.JWT_SECRET, { expiresIn: '7d' });

    const samplePortfolio = await Portfolio.create({
      id: 1,
      userEmail: email,
      name: "Sample Portfolio",
      stocks: [{ symbol: "CBBL", quantity: 1000000, wacc: 750 }],
    });

    User.findOne({ email }, async (err, user) => {
      if (err) {
        console.error(err);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
      } else {
        if (user === null) {

          User.findOne({ phone }, async (phoneErr, phoneUser) => {
            if (phoneErr) {
              console.error(phoneErr);
              return respondWithError(res, 'INTERNAL_SERVER_ERROR', phoneErr.toString());

          } else {
              if (phoneUser === null) {
          const newUser = new User({
            token,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            style,
            isAdmin,
            dpImage: dpImage ? dpImage.path : undefined,
            userAmount: userAmount !== undefined ? userAmount : undefined,
            portfolio: [samplePortfolio._id]

          });
          try {
            const savedUser = await newUser.save();
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
              portfolio: savedUser.portfolio
            };
            console.log(userData);
            console.log("Singup Was Success");
            return respondWithData(res, 'CREATED', "User created successfully", userData);

          } catch (err) {
            console.log("Singup failed");
            return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
          }
        } else {
          // Duplicate phone found
          console.log("Phone number already exists");
          return respondWithError(res, 'BAD_REQUEST', "Phone number already exists");
        }
      }
    });
  } else {
    console.log("Email already exists");
    return respondWithError(res, 'BAD_REQUEST', "Email already exists");
  }
  }
  });
  } catch (err) {
  console.error(err);
  return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
  }
  };


//         } else {
//           console.log("Email already exists");
//           return respondWithError(res, 'BAD_REQUEST', "Email already exists");
//         }
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
//   }
// };

//
export const loginUser = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log("Email: "+email, "Password: "+password);
    try {
      //const user = await User.findOne({ email: email.toLowerCase() });
      const user = await User.findOne({ email: email.toLowerCase() }).populate('portfolio');

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log("Invalid email or password.");
        return respondWithError(res, 'UNAUTHORIZED', "Invalid email or password.");
      } else {
        console.log("user found");
        const token = jwt.sign({email : email, isAdmin: user.isAdmin},process.env.JWT_SECRET,{expiresIn: '7d'});

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
          userAmount: user.userAmount,
          defaultport: user.defaultport,
          portfolio: user.portfolio
        };
        console.log("Login Was Success");
        return respondWithData(res, 'SUCCESS', "Login successful", userData);
      }
    } catch (error) {
      console.log(error.toString());
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
    }
};

export const forgetPass = async (req, res) => {
  const email = req.body.email;
  console.log("Received email: " + email);

  try {
      const user = await User.findOne({ email });
      if (user) {
          console.log("Existing user found: " + email);
          const hash = await forgetPassword(email);
          return respondWithData(res, 'SUCCESS', "OTP Sent successfully", hash);
          // res.status(200).json({success: true,
          //     message: "OTP Sent successfully",
          //     hash: hash
          // });
      } else {
        console.log("Existing user not found");
        return respondWithError(res, 'NOT_FOUND', "Email Not found");
          // res.status(404).json({success: false,
          //     message: "Email Not found"
          // });
          // console.log("Existing user not found");
      }
  } catch (err) {
      console.error(err);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', err.toString());
      //res.status(500).json(err);
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
  }}

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
    }}
};

//uploading dp image works
export const updateUser = async (req, res) => {
  const token = req.body.token;
  const email = req.body.email;
  const newPassword  = req.body.password;
  const phone = req.body.phone;
  const invStyle = req.body.style;
  const fieldToUpdate = req.body.field;
  const valueToUpdate = req.body.value;
  //const {dpImage} = req.files;
  const userAmount = req.body.useramount;

  if (!email ) {
    return respondWithError(res, 'BAD_REQUEST', "User token missing");
  }
  if (!fieldToUpdate) {
    return respondWithError(res, 'BAD_REQUEST', "Field to update missing");
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    if (fieldToUpdate === 'dp') {
      const {dpImage} = req.files;
      let uploadedImage;

      if (dpImage && dpImage.path) {
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
      } else {
        console.log("No image provided for update");
        return respondWithError(res, 'BAD_REQUEST', "No image provided for update");
      }
    }

    if (fieldToUpdate === 'name') {
      console.log("Username updated, new "+fieldToUpdate+ " is "+valueToUpdate)
      user.name = valueToUpdate;
    }

    if (fieldToUpdate == 'useramount') {
    console.log("User updated, new "+fieldToUpdate+ " is "+valueToUpdate)
    user.userAmount = valueToUpdate;
    }

    if (fieldToUpdate === 'password') {
      const newPassword = await bcrypt.hash(valueToUpdate, 10);
      console.log("User password updated, new "+fieldToUpdate+ " is "+valueToUpdate)
      user.password = newPassword;
    }

    if (fieldToUpdate === 'email') {
      try {
        const existingUser = await User.findOne({ email: valueToUpdate });
        if (!existingUser) {
          console.log("User email updated, new " + fieldToUpdate + " is " + valueToUpdate);

          user.email = valueToUpdate;

          await user.save();

          return respondWithSuccess(res, 'SUCCESS', "Email updated successfully");
        } else {
          console.log("Email already exists");
          return respondWithError(res, 'BAD_REQUEST', "Email already exists");
        }
      } catch (error) {
        console.error("Error updating user email:", error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating email");
      }
    }

    if (fieldToUpdate === 'phone') {
      try {
        const existingUser = await User.findOne({ phone: valueToUpdate });
        if (!existingUser) {
          console.log("User phone updated, new " + fieldToUpdate + " is " + valueToUpdate);

          user.phone = valueToUpdate;

          await user.save();

          return respondWithSuccess(res, 'SUCCESS', "Phone updated successfully");
        } else {
          console.log("Phone already exists");
          return respondWithError(res, 'BAD_REQUEST', "Phone already exists");
        }
      } catch (error) {
        console.error("Error updating user Phone:", error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating phone");
      }
    }

    else if (fieldToUpdate === 'style') {
      user.style = valueToUpdate;
      console.log("User Style updated, new "+fieldToUpdate+ " is " +valueToUpdate)
    }

    try {
      await user.save();
      console.log('User ' + fieldToUpdate + ' updated successfully');
      return respondWithSuccess(res, 'SUCCESS', "User " + fieldToUpdate + " updated successfully");
    } catch (error) {
      console.error('User ' + fieldToUpdate + ' update failed: ' + error);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user " + fieldToUpdate);
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "Error updating user data");
  }
};

export const verifyUser = async (req, res) => {
  const email = req.body.email;

  console.log("email is: " + email);

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('portfolio');
    if (!user) {
      console.log("401 Invalid email.");
      return respondWithError(res, 'UNAUTHORIZED', "Invalid email.");
    } else {
      console.log("User verification was successful");

        let userData = {
        username: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        style: user.style,
        defaultport: user.defaultport,
        isAdmin: user.isAdmin,
        dpImage: user.dpImage,
        userAmount: user.userAmount,
        portfolio: user.portfolio

      };
      return respondWithData(res, 'SUCCESS', "User verification was successful", userData);
    }
  } catch (error) {
    console.log("500 An error occurred during user verification.");
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', "An error occurred during user verification.");
  }
};

export const fetchToken = async (req, res) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("401 Invalid email");
      return respondWithError(res, 'UNAUTHORIZED', "Invalid email");
    } else {
      return respondWithData(res, 'SUCCESS', "Token fetched successfully", user.token);

    }
  } catch (error){
    console.log(error.toString());
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }
};


//this code is not necessary remove it later
export const saveToken = async (req, res) => {
  const email = req.body.email;
  const token = req.body.token;

  console.log("Email: " + email, "Token: " + token);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("401 Invalid email");
      return res.status(401).json({success: false, message: "Invalid email"});
    } else {
      user.token = token;
      await user.save();

      console.log("200 Token saved");
    }
    res.json(user);
  } catch (error) {
    console.log("500 An error occurred saving token");
    return res.status(500).json({success: false, message: "An error occurred saving token" });
  }
};

export const deleteAccount = async (req, res) => {
  const tokens = req.body.token;
  const passwords = req.body.password;
  try {
    const user = await User.findOne({ token: tokens });

    if (!user) {
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    const isPasswordValid = await bcrypt.compare(passwords, user.password);

    if (!isPasswordValid) {
      return respondWithError(res, 'UNAUTHORIZED', "Invalid password");
    }

    await User.deleteOne({ token: tokens });
    return respondWithSuccess(res, 'SUCCESS', "User deleted successfully");

  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }
};

//works
export const defaultportfolio = async (req, res) => {
  console.log("Change default portfolio requested")
  const token = req.body.token;
  const portfolioId = req.body.id;

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }
    if (user.defaultport === portfolioId) {
      console.log('Portfolio is already set as default');
      return respondWithError(res, 'BAD_REQUEST', "Portfolio is already set as default");
    }

    user.defaultport = portfolioId;
    await user.save();

    console.log("200 Portfolio ID updated");
    return respondWithSuccess(res, 'SUCCESS', "Portfolio ID updated");

  } catch (error) {
    console.error(error);

    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }
};


export const removedefaultportfolio = async (req, res) => {
  const token = req.body.token;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return respondWithError(res, 'NOT_FOUND', "User not found");
    }

    user.defaultport = 1;

  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
  }

};

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

