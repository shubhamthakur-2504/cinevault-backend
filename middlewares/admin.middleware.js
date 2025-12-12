import { apiError } from "../utils/apiError";

export const adminOnly = (req, _, next) => {
    if (!req.user?.isAdmin !== "ADMIN") {
        throw new apiError(403, "Admin access required");
    }
    next();
}