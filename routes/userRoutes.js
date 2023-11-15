import { Router } from 'express';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { createUser, deleteAccount, fetchToken, forgetPass, loginUser, updateUser, verifyData, verifyUser } from '../controllers/userController.js';
import { startNewsServer } from '../server/newsServer.js';

// Create an instance of Router
const router = Router();

router.post('/create', createUser);
router.post('/login', loginUser);

router.post('/otp-login', sendOTP);
router.post('/otp-verify', verifyOTP);
router.post('/forget', forgetPass);
router.post('/updateuser', updateUser);
router.post('/news', startNewsServer);
router.post('/verify', verifyUser);
//router.post('/savetkn', saveToken);
router.post('/whattoken', fetchToken);
router.post('/delete-acc',deleteAccount);
router.post('/pre-verify',verifyData);


export default router;
