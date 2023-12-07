import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const newSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
      },
    picture:String,
    name:{
      type: String,
      required: true,
    },
    email:{
      type: String,
      required: true,
    },
    password:{
      type: String,
      required: true,
    },
    phone:{
      type: String,
      required: true,
    },
    style:String,
    defaultport: {
      type: Number,
      default: 1,
    },
    isAdmin: {
      type: Boolean,
      default: false,
  },
});

const User = mongoose.model('User',newSchema);


export default User;