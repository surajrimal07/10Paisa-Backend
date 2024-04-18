import Portfolio from '../models/portfolioModel.js';
import User from '../models/userModel.js';
import { respondWithData, respondWithError } from '../utils/response_utils.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (!users || users.length === 0) {
            console.log("No users found");
            return respondWithError(res, 'NOT_FOUND', 'No users found');

        }

        return respondWithData(res, 'SUCCESS', 'Users fetched successfully', users);
    } catch (error) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching users');
    }
};

export const deleteUserByEmail = async (req, res) => {
    const { email } = req.body;
    console.log("Delete User by email requested for email: " + email );

    try {

        await Portfolio.deleteMany({ userEmail: email });

        const deletedUser = await User.findOneAndDelete({ email });

        if (!deletedUser) {
            console.log("User not found");
            return respondWithError(res, 'NOT_FOUND', 'User not found');
        }

          console.log("User deleted successfully"   );
        return respondWithData(res, 'SUCCESS', 'User deleted successfully', deletedUser);
    } catch (error) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting the user');
    }
};

export const getAllPortfolios = async (req, res) => {
    try {
        const portfolios = await Portfolio.find();

        if (!portfolios || portfolios.length === 0) {
            console.log("No portfolios found");
            return respondWithError(res, 'NOT_FOUND', 'No portfolios found');
        }

        return respondWithData(res, 'SUCCESS', 'Portfolios fetched successfully', portfolios);
    } catch (error) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching portfolios');
    }
};

export const editUserByEmail = async (req, res) => {
    const { email, newData } = req.body;

    try {
        const updatedUser = await User.findOneAndUpdate({ email }, newData, { new: true });

        if (!updatedUser) {
            console.log("User not found");
            return respondWithError(res, 'NOT_FOUND', 'User not found');
        }

        return respondWithData(res, 'SUCCESS', 'User updated successfully', updatedUser);
    } catch (error) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while updating the user');
    }
};

