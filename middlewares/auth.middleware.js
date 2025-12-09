import JWT from "jsonwebtoken";
import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { JWT_ACCESS_SECRET } from "../config/const.js";

export const verifyJwtToken = asyncHandler(async (req, _, next) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = bearerToken || req.cookies?.accessToken;
    
    if (!token) {
        throw new apiError(401, "Access token is required")
    }

    let decodedToken

    try {
        decodedToken = JWT.verify(token, JWT_ACCESS_SECRET)
    } catch (error) {
        throw new apiError(401, "Invalid or expired access token")
    }

    if (!decodedToken || !decodedToken?.userId || !mongoose.Types.ObjectId.isValid(decodedToken?.userId)) {
        throw new apiError(401, "Invalid access token")
    }

    const user = await User.findById(decodedToken?.userId).select("-passwordHash -refreshToken");

    if (!user) {
        throw new apiError(401, "Invalid access token")
    }

    if (!user.isActive) {
        throw new apiError(403, "User account is deactivated")
    }

    req.user = user
    next()
})