export const verifySecurityKey = (req, res, next) => {
    const clientKey = req.headers['x-security-key'];

    if (!clientKey || clientKey !== process.env.SECURITY_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or missing security key',
        });
    }

    next();
};

