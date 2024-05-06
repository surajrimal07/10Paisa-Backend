
export function sessionMiddleware(req, res, next) {
    if (!req.session.activeUsers) {
        req.session.activeUsers = {};
    }
    req.session.activeUsers[req.sessionID] = true;
    next();

};