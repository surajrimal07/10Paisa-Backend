import bcrypt from 'bcrypt';
import User from '..//models/User.js';
import { forgetPassword } from '../controllers/otpControllers.js';


export const createUser = async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  console.log("Name: "+name, "Email: "+email, "Password: "+password);

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
          });
          try {
            const savedUser = await newUser.save();
            const userData = {
              _id: savedUser._id,
              name: savedUser.name,  //this might throw error  //fixed now
              email: savedUser.email,
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
  console.log("line 76 raw req is "+req);
  console.log("Email: line 77 of user controllers "+email);
  try {
    User.findOne({ email }, async (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
      } else {
        if (user !== null) {
          console.log("Existing user found " + email)

          res.status(200).json({
            message: 'OTP Sent successfully',
          });

          forgetPassword(email,email) //forgetPassword(email,email)



        //   otpService.forgotpass(email, (error, results) => {
        //     console.log("We got this email from use controller "+req.body.email)

        //     if (error) {
        //         console.log("error occured, 44, otp controllers")

        //         return res.status(400).send({
        //             message: "error occured with otp service",
        //             data: error,
        //         });
        //     } else {
        //         return res.status(200).send({
        //         message: "Success, otp sent",
        //         data: results,
        //     });
        // }
        // });

















        } else {
          res.status(500).json({
            message: 'Email Not found',
          });
          // res.status(600).json({
          //   message: 'No Existing user found'
          // })
          console.log("Existing user not found, line 93 user controller")
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};