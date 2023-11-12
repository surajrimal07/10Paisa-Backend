import { Router } from 'express';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { createUser, forgetPass, loginUser, saveToken, updateUser, verifyUser } from '../controllers/userController.js';
import { startNewsServer } from '../server/newsServer.js';

// Create an instance of Router
const router = Router();

router.post('/create', createUser);
router.post('/login', loginUser);

router.post('/otp-login', sendOTP)
router.post('/otp-verify', verifyOTP)
router.post('/forget', forgetPass)
router.post('/updateuser', updateUser)
router.post('/news', startNewsServer)
router.post('/verify', verifyUser)
router.post('/savetkn', saveToken)




export default router;
