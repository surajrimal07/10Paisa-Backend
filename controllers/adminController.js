import User from '../models/userModel.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: "No users found" });
        }

        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: "An error occurred while fetching users" });
    }
};

export const deleteUserByToken = async (req, res) => {
    const { token } = req.body;

    try {
        const deletedUser = await User.findOneAndDelete({ token });

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "User deleted successfully", deletedUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: "An error occurred while deleting the user" });
    }
};

export const editUserByToken = async (req, res) => {
    const { token, newData } = req.body;

    try {
        const updatedUser = await User.findOneAndUpdate({ token }, newData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "User updated successfully", updatedUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: "An error occurred while updating the user" });
    }
};