import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const newSchema = new Schema({
    name:String,
    email:String,
    password:String
});

const User = mongoose.model('User',newSchema);

export default User;