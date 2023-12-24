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
      type: Number,
      required: true,
    },
    style:{
      type: Number,
      default: 0,
    },
    defaultport: {
      type: Number,
      default: 1,
    },
    isAdmin: {
      type: Boolean,
      default: false,
  },
    dpImage : {
    type: String,
    default: "https://res.cloudinary.com/dio3qwd9q/image/upload/v1703030558/default_ww723l.png"
    },
    userAmount : {
      type: Number,
      default: 100000,
    },
    portfolio: [{ type: Schema.Types.ObjectId, ref: 'Portfolio' }],
});

const User = mongoose.model('User',newSchema);


export default User;