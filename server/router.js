const { BASE_PATH } = require('./konstanter');
const { ensureAuthenticated } = require('./ensureAuthenticated');
const passport = require('passport');
const express = require('express');

const router = express.Router();

const getConfiguredRouter = (azureClient) => {
    router.get(
        '/login',
        passport.authenticate('azureOidc', {
            successRedirect: '/success',
            failureRedirect: '/login',
        })
    );
    router.use(
        '/oauth2/callback',
        passport.authenticate('azureOidc', { failureRedirect: '/login' }),
        (req, res) => {
            res.redirect('/');
        }
    );

    router.use(ensureAuthenticated);

    router.get('/hello', (req, res) => res.send('hello world'));

    return router;
};

module.exports = { getConfiguredRouter };
