export function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "User is not authenticated" });
}


// check if the user is an admin
export function isOwner(req, res, next) {
    if (req.isAuthenticated() && req.user.userType === 'owner') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Owner role required." });
    }
}

// check if the user is a customer
export function isCustomer(req, res, next) {
    if (req.isAuthenticated() && req.user.userType === 'customer') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Customer role required." });
    }
}

