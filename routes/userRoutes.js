import { Router } from 'express';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { createUser, forgetPass, loginUser } from '../controllers/userController.js';
// Create an instance of Router
const router = Router();

router.post('/create', createUser);
router.post('/login', loginUser);

router.post('/otp-login', sendOTP)
router.post('/otp-verify', verifyOTP)
router.post('/forget', forgetPass)


export default router;
