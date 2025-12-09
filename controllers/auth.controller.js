import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { JWT_REFRESH_SECRET } from "../config/const.js";
import { validateEmail, httpCookieOptions } from "../utils/utils.js";

const registerUser = asyncHandler(async (req, res) => {

    let { userName, email } = req.body;
    const { password } = req.body;

    email = email?.trim().toLowerCase();
    userName = userName?.trim();

    if (!userName || !email || !password) {
        throw new apiError(400, "All fields are required");
    }
    if (!validateEmail(email)) {
        throw new apiError(400, "Invalid email format");
    }
    if (typeof password !== "string" || password.length < 8) {
        throw new apiError(400, "Password must be at least 8 characters long");
    }
    if (userName.length < 3) {
        throw new apiError(400, "Username must be at least 3 characters long");
    }

    const existingUser = await User.findOne({ $or: [{ userName: userName }, { email: email }] });
    if (existingUser) {
        throw new apiError(409, "User with this email or username already exists");
    }

    try {
        const newUser = await User.create({ userName, email, passwordHash: password });
        const createdUser = await User.findById(newUser._id).select("-passwordHash -refreshToken -createdAt -updatedAt");

        res.status(201).json({
            statusCode: 201,
            message: "User created successfully",
            data: createdUser
        });
    } catch (error) {
        if (error.code === 11000) {
            const dupField = Object.keys(error.keyValue || {})[0] || "field";
            throw new apiError(409, `User with this ${dupField} already exists`);
        }
        throw new apiError(500, "Failed to register user");
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new apiError(400, "Email and password are required");
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user) {
        throw new apiError(401, "Invalid email or password");
    }
    if (!await user.comparePassword(password)) {
        throw new apiError(401, "Invalid email or password");
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    res.cookie("refreshToken", refreshToken, httpCookieOptions);
    return res.status(200).json({
        statusCode: 200,
        message: "Login successful",
        data: { accessToken }
    });

});

const getUserProfile = asyncHandler(async (req, res) => {
    return res.status(200).json({
        statusCode: 200,
        message: "User profile fetched successfully",
        data: req.user
    });
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        throw new apiError(401, "Refresh token is required");
    }

    let decodedToken;
    try {
        decodedToken = JWT.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
        res.clearCookie("refreshToken", httpCookieOptions);
        throw new apiError(401, "Invalid or expired refresh token");
    }

    if (!decodedToken || !decodedToken?.userId || !mongoose.Types.ObjectId.isValid(decodedToken?.userId)) {
        res.clearCookie("refreshToken", httpCookieOptions);
        throw new apiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken.userId).select("+refreshToken");
    if (!user) {
        res.clearCookie("refreshToken", httpCookieOptions);
        throw new apiError(401, "Invalid refresh token");
    }
    if (user.refreshToken !== refreshToken) {
        res.clearCookie("refreshToken", httpCookieOptions);
        throw new apiError(401, "Invalid refresh token");
    }

    const accessToken = user.generateAccessToken();

    return res.status(200).json({
        statusCode: 200,
        message: "Access token refreshed successfully",
        data: { accessToken }
    });
})

const logoutUser = asyncHandler(async (req, res) => {
    if (typeof req.user.revokeRefreshToken === "function") {
        await req.user.revokeRefreshToken();
    } else {
        req.user.refreshToken = null;
        await req.user.save();
    }
    res.clearCookie("refreshToken", httpCookieOptions);
    return res.status(200).json({
        statusCode: 200,
        message: "Logout successful"
    });
})

export { registerUser, loginUser, getUserProfile, refreshAccessToken, logoutUser };