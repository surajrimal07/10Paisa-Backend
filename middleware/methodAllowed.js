

// Middleware to block requests with disallowed methods //not working
export const allowOnly = (allowedMethods) => {
    return (req, res, next) => {
        if (!allowedMethods.includes(req.method)) {
            return res.status(405).json({ error: 'Method Not Allowed', message: `${req.method} method is not allowed on this route` });
        }
        next();
    };
};

export default allowOnly;