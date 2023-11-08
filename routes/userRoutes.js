import { Router } from 'express';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { createUser, forgetPass, loginUser, updateUser } from '../controllers/userController.js';
import { startNewsServer } from '../server/bad.js';

// Create an instance of Router
const router = Router();

router.post('/create', createUser);
router.post('/login', loginUser);

router.post('/otp-login', sendOTP)
router.post('/otp-verify', verifyOTP)
router.post('/forget', forgetPass)
//router.post('/updatepasswd', updatePassword)
router.post('/updateuser', updateUser)
router.post('/news', startNewsServer)




export default router;
