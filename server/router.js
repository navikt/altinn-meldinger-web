const { BASE_PATH } = require('./konstanter');
const { ensureAuthenticated } = require('./utils');
const passport = require('passport');
const express = require('express');
const expressHttpProxy = require('express-http-proxy');
const { getOnBehalfOfAccessToken } = require('./utils');

const router = express.Router();


const FRONTEND_API_PATH = BASE_PATH + '/api';
const BACKEND_API_PATH = '/altinn-meldinger-api';
const BACKEND_BASEURL = 'http://localhost:8080';

/*
*
const proxy = createProxyMiddleware(FRONTEND_API_PATH, {
    target: BACKEND_BASEURL,
    changeOrigin: true,
    pathRewrite: (path, req) => path.replace(FRONTEND_API_PATH, BACKEND_API_PATH),
    secure: true,
    xfwd: true,
});
*
* */

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

    router.use(FRONTEND_API_PATH, expressHttpProxy(
        BACKEND_API_PATH, {
            proxyReqPathResolver: (req) => req.originalUrl,
            proxyReqOptDecorator: (options, req) => {
                return new Promise((resolve, reject) =>
                    getOnBehalfOfAccessToken(azureClient, req).then(
                        (access_token) => {
                            options.headers.Authorization = `Bearer ${access_token}`;
                            resolve(options);
                        },
                        (error) => reject(error)
                    )
                );
            },
        }
    ));

    return router;
};

module.exports = { getConfiguredRouter };
