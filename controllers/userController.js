import bcrypt from 'bcrypt';
import { forgetPassword } from '../controllers/otpControllers.js';
import User from '../models/userModel.js';


export const createUser = async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone !== undefined ? req.body.phone : undefined; //new code
  const style = req.body.style !== undefined ? req.body.style : undefined; //new code

  console.log("Create user command passed")
  console.log("Name: "+name, "Email: "+email, "Password: "+password, "phone: "+phone, "Style: "+style);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    User.findOne({ email }, async (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
      } else {
        if (user === null) {
          const newUser = new User({
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
              name: savedUser.name,  //this might throw error  //fixed now
              email: savedUser.email,
              pass: savedUser.password,
              phone: savedUser.phone, //might throw error  //new code
              style: savedUser.style //might throw error     //new code

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
          console.log("Singup failed, user already exists");
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
      console.log("User mail updated, new "+fieldToUpdate+ " is "+valueToUpdate)
      user.email = valueToUpdate;
    }

    else if (fieldToUpdate === 'phone') {
      user.phone = valueToUpdate;
      console.log("User phone updated, new "+fieldToUpdate+ " is "+valueToUpdate)
    } else if (fieldToUpdate === 'style') {
      user.style = valueToUpdate;
      console.log("User Style updated, new "+fieldToUpdate+ " is " +valueToUpdate)
    }
    // } else if (fieldToUpdate === 'name') {
    //   user.name = valueToUpdate;
    //   console.log("User password updated, new "+fieldToUpdate+ " is " +valueToUpdate)
    // } // Add more conditions for other fields as necessary

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


export const verifyUser = async (req, res) => {
  const token = req.body.token;

  console.log("Token is: " + token);

  try {
    const user = await User.findOne({ token });

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


export const saveToken = async (req, res) => {
  const email = req.body.email;
  const token = req.body.token;

  console.log("Email: " + email, "Token: " + token);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("401 Invalid email");
      return res.status(401).json({ error: 'Invalid email' });
    } else {
      user.token = token;
      await user.save();

      console.log("200 Token saved");
    }
    res.json(user);
  } catch (error) {
    console.log("500 An error occurred saving token");
    return res.status(500).json({ error: 'An error occurred saving token' });
  }
};
