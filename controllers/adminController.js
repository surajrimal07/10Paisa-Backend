import User from '../models/userModel.js';
import { respondWithData, respondWithError } from '../utils/response_utils.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (!users || users.length === 0) {
            return respondWithError(res, 'NOT_FOUND', 'No users found');
        }

        return respondWithData(res, 'SUCCESS', 'Users fetched successfully', users);
    } catch (error) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching users');
    }
};

export const deleteUserByToken = async (req, res) => {
    const { token } = req.body;

    try {
        const deletedUser = await User.findOneAndDelete({ token });

        if (!deletedUser) {
            return respondWithError(res, 'NOT_FOUND', 'User not found');
        }
        return respondWithData(res, 'SUCCESS', 'User deleted successfully', deletedUser);
    } catch (error) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting the user');
    }
};

export const editUserByToken = async (req, res) => {
    const { token, newData } = req.body;

    try {
        const updatedUser = await User.findOneAndUpdate({ token }, newData, { new: true });

        if (!updatedUser) {
            return respondWithError(res, 'NOT_FOUND', 'User not found');
        }

        return respondWithData(res, 'SUCCESS', 'User updated successfully', updatedUser);
    } catch (error) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while updating the user');
    }
};