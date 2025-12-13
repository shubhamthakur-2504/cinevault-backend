import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_ACCESS_SECRET, JWT_REFRESH_EXPIRY, JWT_ACCESS_EXPIRY } from "../config/const.js";

const userSchema = new Schema({
    userName: { 
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String, 
        required: true, 
        unique: true 
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    isActive: {
        type: Boolean,
        default: true 
    },
    refreshToken: {
        type: String,
        default: null,
        select: false
    }
}, { timestamps: true })

userSchema.pre('save', async function() {
    if (!this.isModified('passwordHash')) return;
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        { userId: this._id, userName: this.userName },
        JWT_ACCESS_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = async function() {
    const refreshToken = jwt.sign(
        { userId: this._id, userName: this.userName },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRY }
    );
    this.refreshToken = refreshToken;
    await this.save();
    return refreshToken;
};

userSchema.methods.revokeRefreshToken = async function() {
  this.refreshToken = null;
  await this.save();
};

userSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.passwordHash;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

export default User