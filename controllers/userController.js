import bcrypt from 'bcrypt';
import { forgetPassword } from '../controllers/otpControllers.js';
import Portfolio from '../models/portfolioModel.js';
import User from '../models/userModel.js';

//use jsonwebtoken

export const createUser = async (req, res) => {
  const token = req.body.token;
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;
  const style = req.body.style !== undefined ? req.body.style : undefined;
  const isAdmin = false;
  const userAmount = req.body.amount !== undefined ? req.body.amount : undefined;

  console.log("Create user command passed")

  if (!name || !email || !password || !token || !phone) {
    return res.status(400).json({ success: false, message: "Empty data passed. Please provide all required fields." });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Invalid phone number. Please provide a 10-digit number." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format. Please provide a valid email address." });
  }

  let dpImage;

  if (req.files && req.files.length > 0) {
    dpImage = req.files[0];
  }

  console.log("Name: "+name,"token "+ token,  "Email: "+email, "Password: "+password, "phone: "+phone, "Style: "+style);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const samplePortfolio = await Portfolio.create({
      id: 1,
      userToken: token,
      name: "Sample Portfolio",
      stocks: [{ symbol: "CBBL", quantity: 1000000, wacc: 750 }],
    });

    User.findOne({ email }, async (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
      } else {
        if (user === null) {
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
            res.status(200).json(userData);
            console.log("Singup Was Success");
          } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.toString() });
          }
        } else {
          res.status(400).json({success: false,
            message: "Email already exists",
          });
        }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(600).json({ success: false, message: err.toString() });
  }
};

export const loginUser = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log("Email: "+email, "Password: "+password);
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log("401 Invalid email or password.");
        return res.status(401).json({success:false, message: "Invalid email or password." });
      } else {
        console.log("200 Login Was Success");
      }
      res.json(user);
    } catch (error) {
      console.log("500 An error occurred during login.");
      return res.status(500).json({success: false, message: "An error occurred during login." });
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
          res.status(200).json({success: true,
              message: "OTP Sent successfully",
              hash: hash
          });
      } else {
          res.status(404).json({success: false,
              message: "Email Not found"
          });
          console.log("Existing user not found");
      }
  } catch (err) {
      console.error(err);
      res.status(500).json(err);
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
      return res.status(200).json({success: true, message: "Email is fresh" });

    } else {
      console.log("Email already exists");
      return res.status(400).json({success: true, message: "Email already exists" });
    }
  } catch (error) {
    console.error("Error looking for email:", error);
    return res.status(500).json({success:false, message: "Error occured" });
  }}

  if (fieldToUpdate === 'phone') {

    try {
      const existingUser = await User.findOne({ phone: valueToCheck });
      if (!existingUser) {
        console.log("Phone is fresh");
        return res.status(200).json({success: true, message: "Phone is fresh" });
      } else {
        console.log("Phone already exists");
        return res.status(400).json({success: false, message: "Phone already exists" });
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      return res.status(500).json({success: false, message: "Error checking Phone" });
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
  const {dpImage} = req.files;
  const userAmount = req.body.useramount;

  if (!token ) {
    return res.json(401)({ success : false, message: "User token missing" })
  }
  if (!fieldToUpdate) {
    return res.json(401)({ success : false, message: "Field and Value missing" })
  }

  try {
    const user = await User.findOne({ token });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ success: false, message: "User not found" });
    }

  } catch (error) {
    console.error('Error updating user data:', error);
    return res.status(500).json({ success: false, message: "An error occurred updating user data" });
  }
};

export const verifyUser = async (req, res) => {
  const token = req.body.token;

  console.log("Token is: " + token);

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      console.log("401 Invalid token.");
      return res.status(401).json({success: false, message: "Invalid token." });
    } else {
      console.log("200 User verification was successful");
      res.json({
        username: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        style: user.style,
        defaultport: user.defaultport,
        isAdmin: user.isAdmin,
        dpImage: user.dpImage,

      });
    }
  } catch (error) {
    console.log("500 An error occurred during user verification.");
    return res.status(500).json({success: false, message: "An error occurred during verification." });
  }
};

export const fetchToken = async (req, res) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("401 Invalid email");
      return res.status(401).json({success: false, message: "Invalid email" });
    } else {
      res.status(200).json({success: true,
        token: user.token,
      });
    }
  } catch (error){
    console.log(error.toString());
    return res.status(500).json({success: false, message: "An error occurred fetching token" });
  }
};

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

//this code seems incomplete
export const deleteAccount = async (req, res) => {
  const tokens = req.body.token;
  const passwords = req.body.password;
  try {
    const user = await User.findOne({ token: tokens });

    if (!user) {
      return res.status(404).json({success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(passwords, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    await User.deleteOne({ token: tokens });
    return res.status(200).json({ success: true, message: "User deleted successfully" });

  } catch (error) {
    return res.status(500).json({success: false, message: "An error occurred deleting account" });
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
      return res.status(404).json({success: false, message: "User not found" });
    }


  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: "An error occurred updating default portfolio" });
  }
};

export const removedefaultportfolio = async (req, res) => {
  const token = req.body.token;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({success: false, message: "User not found" });
    }

    user.defaultport = 1;

  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: "An error occurred deleting portfolio ID" });
  }

};

export const makeadmin = async (req, res) => {
  const token = req.body.token;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({success: false, message: "User not found" });
    }

    if (user.isAdmin !== undefined) {
      user.isAdmin = true;
    } else {
      user.isAdmin = true;
    }

    user.isAdmin = true;
    await user.save();

    console.log("Made user admin");
    return res.status(200).json({success: true, message: "Made user Admin" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: "An error occurred making admin"});
  }
};

