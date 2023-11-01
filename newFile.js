import bcrypt from 'bcrypt';
import { app } from './index.js';
import User from './models/User.js';

app.post('/signin', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(email, password);
  try {
    // Use await to execute the query and get the user data
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log("Login Was Success");
      return res.status(401).json({ error: 'Invalid email or password.' });
    } else {
      console.log("Login Was Success");
      //res.send('Login was successful');
    }
    // If the user is found and the password matches, return the user data
    res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred during login.' });
  }
});
