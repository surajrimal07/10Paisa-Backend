
import { Router } from 'express';
import { deleteUserByEmail, editUserByEmail, getAllPortfolios, getAllUsers } from '../controllers/adminController.js';
import { makeadmin } from '../controllers/userController.js';
import { authGuard, authGuardAdmin } from '../middleware/authGuard.js';
import { allowOnly } from '../middleware/methodAllowed.js';

const authrouter = Router();

//admin routes
authrouter.get('/allusers', allowOnly(['GET']), authGuardAdmin, getAllUsers);
authrouter.delete('/deleteUser', allowOnly(['DELETE']), authGuardAdmin, deleteUserByEmail);
authrouter.put('/edituser', allowOnly(['PUT']), authGuardAdmin, editUserByEmail);
authrouter.get('/allportfolios', allowOnly(['GET']), authGuardAdmin, getAllPortfolios);
authrouter.post('/makeadmin', allowOnly(['POST']), authGuardAdmin, makeadmin);


export default authrouter;