import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const newSchema = new Schema({
    name:String,
    email:String,
    password:String,
    phone:String,  //might throw error in number //new code
    style:String  //new code
});

const User = mongoose.model('User',newSchema);

export default User;