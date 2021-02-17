const { TokenSet } = require('openid-client');
const session = require('express-session');
const BACKEND_CLIENT_ID = 'BACKEND_CLIENT_ID';
const {
    FRONTEND_BASE_URL,
    OAUTH2_ON_BEHALF_SCOPE,
} = require('./konstanter');

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
        res.redirect(`${FRONTEND_BASE_URL}/login`);
    }
};

const getOnBehalfOfAccessToken = (authClient, req) => {
    return new Promise((resolve, reject) => {
        if (hasValidAccessToken(req, BACKEND_CLIENT_ID)) {
            const tokenSets = getTokenSetsFromSession(req);
            resolve(tokenSets[BACKEND_CLIENT_ID].access_token);
        } else {
            resolve(req.user.tokenSets['self'].id_token);
            // authClient
            //     .grant({
            //         grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            //         client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            //         requested_token_use: 'on_behalf_of',
            //         scope: OAUTH2_ON_BEHALF_SCOPE,
            //         assertion: req.user.tokenSets['self'].access_token,
            //     })
            //     .then((tokenSet) => {
            //         req.user.tokenSets[BACKEND_CLIENT_ID] = tokenSet;
            //         resolve(tokenSet.access_token);
            //     })
            //     .catch((err) => {
            //         console.error('kunne ikke grante token');
            //         console.error(err);
            //         reject(err);
            //     });
        }
    });
};

module.exports = {
    ensureAuthenticated,
    getOnBehalfOfAccessToken,
};
