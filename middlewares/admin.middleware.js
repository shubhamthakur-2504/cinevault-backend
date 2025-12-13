import { apiError } from "../utils/apiError.js";

export const adminOnly = (req, _, next) => {
    if (req.user?.role !== "ADMIN") {
        console.log(req.user);
        throw new apiError(403, "Admin access required");
    }
    next();
}