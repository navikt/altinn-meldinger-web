const { TokenSet } = require('openid-client');
const session = require('express-session');

const getTokenSetsFromSession = (req) => {
    if (req && req.user) {
        return req.user.tokenSets;
    }
    return null;
};

const hasValidAccessToken = (req, key = 'self') => {
    const tokenSets = getTokenSetsFromSession(req);
    if (!tokenSets) {
        return false;
    }
    const tokenSet = tokenSets[key];
    if (!tokenSet) {
        return false;
    }
    return new TokenSet(tokenSet).expired() === false;
};

const ensureAuthenticated = async (req, res, next) => {
    if (req.isAuthenticated() && hasValidAccessToken(req)) {
        next();
    } else {
        session.redirectTo = req.originalUrl;
        res.redirect('/login');
    }
};

module.exports = {
    ensureAuthenticated
};
