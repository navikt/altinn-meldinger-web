const express = require('express');
const { getConfiguredRouter } = require('./router');
const { createProxyMiddleware } = require('http-proxy-middleware');
const passport = require('passport');
const session = require('express-session');
const { Issuer, Strategy } = require('openid-client');
const { BASE_PATH } = require('./konstanter');


const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_API_PATH = BASE_PATH + '/api';
const BACKEND_API_PATH = '/altinn-meldinger-api';
const BACKEND_BASEURL = 'http://localhost:8080';

const oauthServer = 'http://localhost:9000';

const getConfiguredAzureClient = async () => {
    const azureIssuer = await Issuer.discover(
        oauthServer + '/aad/.well-known/openid-configuration'
    );
    return new azureIssuer.Client({
        client_id: 'zELcpfANLqY7Oqas',
        client_secret:
            'TQV5U29k1gHibH5bx1layBo0OSAvAbRT3UYW3EWrSYBB5swxjVfWUa1BS8lqzxG/0v9wruMcrGadany3',
        redirect_uris: ['http://localhost:3000/oauth2/callback'],
        response_types: ['code'],
        id_token_signed_response_alg: 'RS256',
        token_endpoint_auth_method: 'client_secret_basic',
    });
};


const strategy = client => {
    const verify = (tokenSet, done) => {
        if (tokenSet.expired()) {
            return done(null, false)
        }
        const user = {
            'tokenSets': {
                [authUtils.tokenSetSelfId]: tokenSet
            },
            'claims': tokenSet.claims()
        };
        return done(null, user);
    };
    const options = {
        client: client,
        params: {
            response_types: ['code'],
            response_mode: 'query',
            scope: 'openid'
        },
        passReqToCallback: false,
        usePKCE: 'S256'
    };
    return new Strategy(options, verify);
};

const proxy = createProxyMiddleware(FRONTEND_API_PATH, {
    target: BACKEND_BASEURL,
    changeOrigin: true,
    pathRewrite: (path, req) => path.replace(FRONTEND_API_PATH, BACKEND_API_PATH),
    secure: true,
    xfwd: true,
});

const sessionOptions = {
    cookie: {
        maxAge: 3600000, // One hour
        sameSite: 'lax',
        httpOnly: true,
    },
    secret: 'testSecret',
    name: 'altinn-meldinger-session-id',
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
};
// if (process.env.NODE_ENV !== 'development') {
//     options.cookie.secure = true;
//     options.store = setupRedis();
// }

const startServer = async () => {

    app.use(session(sessionOptions));
    const azureClient = await getConfiguredAzureClient();
    const router = getConfiguredRouter(azureClient);

    app.use(passport.initialize());
    app.use(passport.session());
    passport.use('azureOidc', strategy(azureClient));
    // app.use(proxy);

    app.use('/', router);

    app.listen(PORT, () => {
        console.log('Server listening on port', PORT);
    });
};

startServer();
