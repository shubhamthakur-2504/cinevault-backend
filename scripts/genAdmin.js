import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config({ path: "./scripts/.env" });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");

        const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME } = process.env;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_USERNAME) {
            throw new Error("Admin credentials missing in env");
        }

        const existingAdmin = await User.findOne({
            email: ADMIN_EMAIL.toLowerCase()
        });

        if (existingAdmin) {
            console.log("Admin already exists. Skipping creation.");
            process.exit(0);
        }

        const adminUser = await User.create({
            userName: ADMIN_USERNAME,
            email: ADMIN_EMAIL.toLowerCase(),
            passwordHash: ADMIN_PASSWORD, // will be hashed by pre-save hook
            role: "ADMIN",
            isActive: true
        });

        console.log("✅ Admin user created successfully:");
        console.log({
            id: adminUser._id,
            email: adminUser.email,
            role: adminUser.role
        });

        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create admin:", err.message);
        process.exit(1);
    }
};

seedAdmin();
