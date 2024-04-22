import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const newSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
      },
    name:{
      type: String,
      required: true,
    },
    email:{
      type: String,
      unique: true,
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
    premium: {
      type: Boolean,
      default: false,
    },
    dpImage : {
    type: String,
    default: "https://res.cloudinary.com/dio3qwd9q/image/upload/v1703030558/ktsqwgc2zpeiynaekfct.png"
    },
    userAmount : {
      type: Number,
      default: 100000,
    },
    portfolio: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' }],

    //new code
    wallets: {
      type: Number,
      default: 0,
      min: 0,
      max: 3, // 0: No wallet,
      //1: Khalti, 2: Esewa,
      //3: Both (Khalti and Esewa)
  },
    LastPasswordChangeDate: {
      type: Date,
      default: Date.now,
  },

});

newSchema.methods.isPasswordExpired = function () {
  const expirationDays = process.env.PASSWORD_EXPIRATION_DAYS || 30;
  const currentDate = new Date();
  const lastPasswordChangeDate = this.LastPasswordChangeDate || currentDate;
  const differenceInDays = Math.ceil((currentDate - lastPasswordChangeDate) / (1000 * 60 * 60 * 24));
  return differenceInDays > expirationDays;
};

//single code to compare password, update other code too
newSchema.methods.comparePassword = async function(candidatePassword) {
  //return bcrypt.compare(candidatePassword, this.password);
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User',newSchema);

export default User;