const { BASE_PATH } = require('./konstanter');
const passport = require('passport');

const express = require('express');

const router = express.Router();

const getConfiguredRouter = (azureClient) => {
    router.get('/login', passport.authenticate('azureOidc', { failureRedirect: '/login' }));
    router.use(
        '/oauth2/callback',
        passport.authenticate('azureOidc', { failureRedirect: '/login' }),
        (req, res) => {
            res.redirect('/');
        }
    );
    return router;
};

module.exports = { getConfiguredRouter };
