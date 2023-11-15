import bcrypt from 'bcrypt';
import { forgetPassword } from '../controllers/otpControllers.js';
import User from '../models/userModel.js';


export const createUser = async (req, res) => {
  const token = req.body.token;
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone; //!== undefined ? req.body.phone : undefined; //new code
  const style = req.body.style !== undefined ? req.body.style : undefined; //new code

  console.log("Create user command passed")
  console.log("Name: "+name,"token "+ token,  "Email: "+email, "Password: "+password, "phone: "+phone, "Style: "+style);

  console.log(token);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    User.findOne({ email }, async (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
      } else {
        if (user === null) {
          const newUser = new User({
            token,
            name,
            email,
            password: hashedPassword,
            phone,  //new code
            style,  //new code
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
              style: savedUser.style

            };
            console.log(userData);
            res.status(200).json(userData);
            console.log("Singup Was Success");
          } catch (err) {
            console.error(err);
            res.status(500).json(err);
          }
        } else {
          res.status(400).json({
            message: 'Email already exists',
          });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

export const loginUser = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log("Email: "+email, "Password: "+password);
    try {
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log("401 Invalid email or password.");
        return res.status(401).json({ error: 'Invalid email or password.' });
      } else {
        console.log("200 Login Was Success");
      }
      res.json(user);
    } catch (error) {
      console.log("500 An error occurred during login.");
      return res.status(500).json({ error: 'An error occurred during login.' });
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
          res.status(200).json({
              message: 'OTP Sent successfully, Final task completed',
              hash: hash
          });
      } else {
          res.status(404).json({
              message: 'Email Not found'
          });
          console.log("Existing user not found");
      }
  } catch (err) {
      console.error(err);
      res.status(500).json(err);
  }
};

export const verifyData = async (req, res) => {
  const fieldToUpdate = req.body.field; // Field to be updated
  const valueToCheck = req.body.value; // New value

  if (fieldToUpdate === 'email') {
  try {
    const existingUser = await User.findOne({ email: valueToCheck });
    if (!existingUser) {

      console.log("Email is fresh");
      return res.status(200).json({ message: "Email is fresh" });

    } else {
      console.log("Email already exists");
      return res.status(400).json({ message: "Email already exists" });
    }
  } catch (error) {
    console.error("Error looking for data:", error);
    return res.status(500).json({ message: "Error occured" });
  }}

  if (fieldToUpdate === 'phone') {

    try {
      const existingUser = await User.findOne({ phone: valueToCheck });
      if (!existingUser) {
        console.log("Phone is fresh");
        return res.status(200).json({ message: "Phone is fresh" });
      } else {
        console.log("Phone already exists");
        return res.status(400).json({ message: "Phone already exists" });
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      return res.status(500).json({ message: "Error checking Phone" });
    }}
};

export const updateUser = async (req, res) => {
  const token = req.body.token;
  const email = req.body.email;
  const newPassword  = req.body.password;
  const phone = req.body.phone;
  const invStyle = req.body.style;
  const fieldToUpdate = req.body.field; // Field to be updated
  const valueToUpdate = req.body.value; // New value

  try {

    const user = await User.findOne({ token });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    if (fieldToUpdate === 'name') {
      console.log("Username updated, new "+fieldToUpdate+ " is "+valueToUpdate)
      user.name = valueToUpdate;
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

          return res.status(200).json({ message: "Email updated successfully" });
        } else {
          console.log("Email already exists");
          return res.status(400).json({ message: "Email already exists" });
        }
      } catch (error) {
        console.error("Error updating user email:", error);
        return res.status(500).json({ message: "Error updating email" });
      }
    }

    if (fieldToUpdate === 'phone') {
      try {
        const existingUser = await User.findOne({ phone: valueToUpdate });
        if (!existingUser) {
          console.log("User phone updated, new " + fieldToUpdate + " is " + valueToUpdate);

          user.phone = valueToUpdate;

          await user.save();

          return res.status(200).json({ message: "Phone updated successfully" });
        } else {
          console.log("Phone already exists");
          return res.status(400).json({ message: "Phone already exists" });
        }
      } catch (error) {
        console.error("Error updating user Phone:", error);
        return res.status(500).json({ message: "Error updating Phone" });
      }
    }

    else if (fieldToUpdate === 'style') {
      user.style = valueToUpdate;
      console.log("User Style updated, new "+fieldToUpdate+ " is " +valueToUpdate)
    }

    try {
      await user.save();
      console.log('User ' + fieldToUpdate + ' updated successfully');
      return res.status(200).json({ message: 'User ' + fieldToUpdate + ' updated successfully' });
    } catch (error) {
      console.error('User ' + fieldToUpdate + ' update failed: ' + error);
      return res.status(500).json({ error: 'Failed to update user ' + fieldToUpdate });
    }

  } catch (error) {
    console.error('Error updating user data:', error);
    return res.status(500).json({ error: 'An error occurred while updating user data' });
  }
};


// export const updateUser = async (req, res) => {
//   const token = req.body.token;
//   const email = req.body.email;
//   const newPassword  = req.body.password;
//   const phone = req.body.phone;
//   const invStyle = req.body.style;
//   const fieldToUpdate = req.body.field; // Field to be updated
//   const valueToUpdate = req.body.value; // New value

//   try {

//     const user = await User.findOne({ token });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     if (fieldToUpdate === 'name') {
//       console.log("Username updated, new "+fieldToUpdate+ " is "+valueToUpdate)
//       user.name = valueToUpdate;
//     }
//     if (fieldToUpdate === 'password') {
//       const newPassword = await bcrypt.hash(valueToUpdate, 10);
//       console.log("User password updated, new "+fieldToUpdate+ " is "+valueToUpdate)
//       user.password = newPassword;
//     }

//     if (fieldToUpdate === 'email') {
//       try {
//         const existingUser = await User.findOne({ email: valueToUpdate });
//         if (!existingUser) {
//           console.log("User email updated, new " + fieldToUpdate + " is " + valueToUpdate);

//           user.email = valueToUpdate;

//           await user.save();

//           return res.status(200).json({ message: "Email updated successfully" });
//         } else {
//           console.log("Email already exists");
//           return res.status(400).json({ message: "Email already exists" });
//         }
//       } catch (error) {
//         console.error("Error updating user email:", error);
//         return res.status(500).json({ message: "Error updating email" });
//       }
//     }

//     if (fieldToUpdate === 'phone') {
//       try {
//         const existingUser = await User.findOne({ phone: valueToUpdate });
//         if (!existingUser) {
//           console.log("User phone updated, new " + fieldToUpdate + " is " + valueToUpdate);

//           user.phone = valueToUpdate;

//           await user.save();

//           return res.status(200).json({ message: "Phone updated successfully" });
//         } else {
//           console.log("Phone already exists");
//           return res.status(400).json({ message: "Phone already exists" });
//         }
//       } catch (error) {
//         console.error("Error updating user Phone:", error);
//         return res.status(500).json({ message: "Error updating Phone" });
//       }
//     }

//     else if (fieldToUpdate === 'style') {
//       user.style = valueToUpdate;
//       console.log("User Style updated, new "+fieldToUpdate+ " is " +valueToUpdate)
//     }

//     try {
//       await user.save();
//       console.log('User ' + fieldToUpdate + ' updated successfully');
//       return res.status(200).json({ message: 'User ' + fieldToUpdate + ' updated successfully' });
//     } catch (error) {
//       console.error('User ' + fieldToUpdate + ' update failed: ' + error);
//       return res.status(500).json({ error: 'Failed to update user ' + fieldToUpdate });
//     }

//   } catch (error) {
//     console.error('Error updating user data:', error);
//     return res.status(500).json({ error: 'An error occurred while updating user data' });
//   }
// };

export const verifyUser = async (req, res) => {
  const token = req.body.token;

  console.log("Token is: " + token);

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      console.log("401 Invalid token.");
      return res.status(401).json({ error: 'Invalid token.' });
    } else {
      console.log("200 User verification was successful");
      // Send user details back to the Flutter app (excluding password)
      res.json({
        username: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        style: user.style
      });
    }
  } catch (error) {
    console.log("500 An error occurred during user verification.");
    return res.status(500).json({ error: 'An error occurred during verification.' });
  }
};

export const fetchToken = async (req, res) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("401 Invalid email");
      return res.status(401).json({ error: 'Invalid email' });
    } else {
      res.status(200).json({
        token: user.token,
      });
    }
  } catch (error){
    console.log("error occured");
    return res.status(500).json({ error: 'An error occurred fetching token' });
  }
};

// export const saveToken = async (req, res) => {
//   const email = req.body.email;
//   const token = req.body.token;

//   console.log("Email: " + email, "Token: " + token);
//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       console.log("401 Invalid email");
//       return res.status(401).json({ error: 'Invalid email' });
//     } else {
//       user.token = token;
//       await user.save();

//       console.log("200 Token saved");
//     }
//     res.json(user);
//   } catch (error) {
//     console.log("500 An error occurred saving token");
//     return res.status(500).json({ error: 'An error occurred saving token' });
//   }
// };


export const deleteAccount = async (req, res) => {
  const tokens = req.body.token;
  const passwords = req.body.password;
  try {
    const user = await User.findOne({ token: tokens });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = (await bcrypt.compare(passwords, user.password));


    if (!isPasswordValid) {
      console.log("401 Invalid password");
      return res.status(401).json({ error: 'Invalid password' });
    }
    await user.remove();
    console.log("200 Account deleted");
    return res.status(200).json({ error: 'Account deleted' });

  } catch (error) {
    return res.status(500).json({ error: 'An error occurred deleting account' });
  }
};



