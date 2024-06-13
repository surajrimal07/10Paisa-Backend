import { Mongoose } from 'mongoose';
import { clientOptions } from '../database/db.js';
import Portfolio from '../models/portfolioModel.js';
import Watchlist from '../models/watchlistModel.js';
import User from '../models/userModel.js';
import { adminLogger } from '../utils/logger/adminlogger.js';
import { respondWithData, respondWithError,respondWithSuccess } from '../utils/response_utils.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (!users || users.length === 0) {
            adminLogger.error("No users found");
            return respondWithError(res, 'NOT_FOUND', 'No users found');
        }

        return respondWithData(res, 'SUCCESS', 'Users fetched successfully', users);
    } catch (error) {
        adminLogger.error(`Error while fetching users: ${error}`);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching users');
    }
};

export const deleteUserByEmail = async (req, res) => {
    const { email } = req.body;
    adminLogger.info(`Delete User by email requested for email:${email}`);

    try {
        const deletedUser = await User.findOne({ email });

        if (!deletedUser) {
            adminLogger.error(`User not found for email:${email}`);
            return respondWithError(res, 'NOT_FOUND', 'User not found');
        }

        await Promise.all([
            Portfolio.deleteMany({ userEmail: email }), //many or findOneAndDelete
            Watchlist.deleteMany({ userEmail: email }),
            User.deleteOne({ email: email })
        ]);

        adminLogger.info(`User deleted successfully for email:${email}`);
        return respondWithData(res, 'SUCCESS', 'User deleted successfully', deletedUser);
    } catch (error) {
        adminLogger.error(`Error while deleting user: ${error}`);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting the user');
    }
};

export const getAllPortfolios = async (req, res) => {
    try {
        const portfolios = await Portfolio.find();

        if (!portfolios || portfolios.length === 0) {
            adminLogger.error("No portfolios found in the database");
            return respondWithError(res, 'NOT_FOUND', 'No portfolios found');
        }

        return respondWithData(res, 'SUCCESS', 'Portfolios fetched successfully', portfolios);
    } catch (error) {
        adminLogger.error(`Error while fetching portfolios: ${error}`);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching portfolios');
    }
};

export const editUserByEmail = async (req, res) => {
    const { email, newData } = req.body;

    try {
        const updatedUser = await User.findOneAndUpdate({ email }, newData, { new: true });

        if (!updatedUser) {
            adminLogger.error(`User not found for email:${email}`);
            return respondWithError(res, 'NOT_FOUND', 'User not found');
        }

        return respondWithData(res, 'SUCCESS', 'User updated successfully', updatedUser);
    } catch (error) {
        adminLogger.error(`Error while updating user: ${error}`);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while updating the user');
    }
};


export const makeadmin = async (req, res) => {
    const email = req.body.email;
    const makeAdmin = req.body.makeAdmin === 'true' ? true : false;

    try {
        const user = await User.findOne({ email: email });

        if (!user) {
            return respondWithError(res, 'NOT_FOUND', "User not found");
        }

        user.isAdmin = makeAdmin;
        await user.save();

        adminLogger.info(`Admin status changed for :${email}`);
        return respondWithSuccess(res, 'SUCCESS', "Made user Admin");

    } catch (error) {
        console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
    }
};

export const fetchUserLogs = async (req, res) => {
    let db = new Mongoose();
    try {
        // eslint-disable-next-line no-undef
        await db.connect(process.env.NEW_DB_URL, clientOptions);
        const collection = db.connection.collection('sessionlogs');
        const logsCursor = collection.find({});
        const logs = await logsCursor.toArray();

        const formattedLogs = logs.map(log => {
            const message = JSON.parse(log.message);
            return {
                user: message.user,
                method: message.method,
                url: message.url,
                statusCode: message.statusCode,
                responseTime: message.responseTime,
                clientIP: message.clientIP,
                serverHostname: log.hostname,
                environment: message.environment,
                timestamp: log.timestamp,
                clientAddress: message.clientAddress,
                sessionID: message.sessionID
            };
        });

        await db.disconnect();
        return respondWithData(res, 'SUCCESS', 'Logs fetched successfully', formattedLogs);
    }
    catch (error) {
        if (db.connection.readyState !== 0) {
            await db.disconnect();
        } adminLogger.error(`Error while fetching logs: ${error}`);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', error.toString());
    }
};