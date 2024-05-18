
import { Router } from 'express';
import { deleteUserByEmail,fetchUserLogs, editUserByEmail, getAllPortfolios, getAllUsers, makeadmin } from '../controllers/adminController.js';
import { authGuardAdmin } from '../middleware/authGuard.js';

const adminrouter = Router();

//admin routes
adminrouter.get('/allusers', authGuardAdmin, getAllUsers);
adminrouter.delete('/deleteUser', authGuardAdmin, deleteUserByEmail);
adminrouter.put('/edituser', authGuardAdmin, editUserByEmail);
adminrouter.get('/allportfolios', authGuardAdmin, getAllPortfolios);
adminrouter.post('/makeadmin', authGuardAdmin, makeadmin);
adminrouter.get('/fetchuserlogs', authGuardAdmin, fetchUserLogs);


export default adminrouter;