import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const newSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  style: {
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
  dpImage: {
    type: String,
    default: "https://res.cloudinary.com/dio3qwd9q/image/upload/v1703030558/ktsqwgc2zpeiynaekfct.png"
  },
  userAmount: {
    type: Number,
    default: 0,
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
    default: new Date(Math.floor(Date.now() / 1000) * 1000),
    required: true
  },
  previousPasswords: {
    type: [String],
    default: [],
  },

});

newSchema.methods.isPasswordExpired = function () {
  const expirationDays = process.env.PASSWORD_EXPIRATION_DAYS || 30;
  const currentDate = new Date();
  const lastPasswordChangeDate = this.LastPasswordChangeDate || currentDate;
  const differenceInDays = Math.ceil((currentDate - lastPasswordChangeDate) / (1000 * 60 * 60 * 24));
  return differenceInDays > expirationDays;
};

newSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};



newSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const newPasswordHash = await bcrypt.hash(this.password, 10);

  if (!this.previousPasswords) {
    this.previousPasswords = [];
  }

  this.previousPasswords.push(newPasswordHash);

  this.password = newPasswordHash;

  this.LastPasswordChangeDate = new Date(Math.floor(Date.now() / 1000) * 1000);
  next();
});


const User = mongoose.model('User', newSchema);

export default User;