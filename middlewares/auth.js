function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please log in first');
    res.redirect('/auth/login');
}

function ensureAdmin(req, res, next) {
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    } else {
        req.flash('error', 'You are not authorized to view this page');
        return res.redirect('/');
    }
}

module.exports = { ensureAuthenticated, ensureAdmin };

