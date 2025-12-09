import mongoose from "mongoose";
import { DB_NAME, MONGODB_URL } from "./const.js";

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${MONGODB_URL}${DB_NAME}?retryWrites=true&w=majority`, {
            serverSelectionTimeoutMS: 30000,
        });
        console.log(`db: mongoose connected to ${connection.connection.host}`);
        console.log(`db: mongoose connected to ${connection.connection.db.databaseName}`);

    } catch (error) {
        console.log("db: mongoose connection error::", error);
        process.exit(1);
    }
}