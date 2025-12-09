import { HTTP_COOKIE_EXPIRES_IN } from "../config/const";

const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return false;
    const cleaned = email.trim().toLowerCase();
    return regex.test(cleaned);
}

const httpCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false, // False for development
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "lax" allows cookies in dev mode
    maxAge: HTTP_COOKIE_EXPIRES_IN,
};
export { validateEmail, httpCookieOptions };