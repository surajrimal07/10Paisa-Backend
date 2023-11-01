import bcrypt from 'bcrypt';
import User from '..//models/User.js';

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
      // Use await to execute the query and get the user data
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log("401 Invalid email or password.");
        return res.status(401).json({ error: 'Invalid email or password.' });
      } else {
        console.log("200 Login Was Success");
      }
      // If the user is found and the password matches, return the user data
      res.json(user);
    } catch (error) {
      console.log("500 An error occurred during login.");
      return res.status(500).json({ error: 'An error occurred during login.' });
    }
};