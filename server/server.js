const express = require('express');
const { getConfiguredRouter } = require('./router');
const passport = require('passport');
const session = require('express-session');
const { Issuer, Strategy } = require('openid-client');
const {
    ALTINN_MELDINGER_WEB_SESSION_NAME,
    ALTINN_MELDINGER_WEB_SESSION_SECRET,
    AZURE_APP_CLIENT_ID,
    AZURE_APP_JWKS,
    OAUTH2_REDIRECT_URI,
    AZURE_APP_WELL_KNOWN_URL
} = require('./konstanter');

const app = express();
const PORT = process.env.PORT || 3000;

const getConfiguredAzureClient = async () => {
    const issuer = await Issuer.discover(AZURE_APP_WELL_KNOWN_URL);
    console.log(`Discovered issuer ${issuer.issuer}`);
    return new issuer.Client(
        {
            client_id: AZURE_APP_CLIENT_ID,
            redirect_uris: [OAUTH2_REDIRECT_URI],
            token_endpoint_auth_method: 'private_key_jwt',
            token_endpoint_auth_signing_alg: 'RS256',
        },
        AZURE_APP_JWKS
    );
};

const strategy = (client) => {
    const verify = (tokenSet, done) => {
        if (tokenSet.expired()) {
            return done(null, false);
        }
        const user = {
            tokenSets: {
                self: tokenSet,
            },
            claims: tokenSet.claims(),
        };
        return done(null, user);
    };
    const options = {
        client: client,
        params: {
            response_types: ['code'],
            response_mode: 'query',
            scope: 'openid',
        },
        passReqToCallback: false,
        usePKCE: 'S256',
        sessionKey: ALTINN_MELDINGER_WEB_SESSION_NAME
    };
    return new Strategy(options, verify);
};

const sessionOptions = {
    cookie: {
        maxAge: 3600000, // One hour
        sameSite: 'lax',
        httpOnly: true,
    },
    secret: ALTINN_MELDINGER_WEB_SESSION_SECRET,
    name: ALTINN_MELDINGER_WEB_SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
};

const startServer = async () => {
    console.log('Starter server ...');

    try {
        app.use(session(sessionOptions));
        const azureClient = await getConfiguredAzureClient();
        const router = getConfiguredRouter(azureClient);

        app.use(passport.initialize());
        app.use(passport.session());
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((user, done) => done(null, user));
        passport.use('azureOidc', strategy(azureClient));

        app.use('/altinn-meldinger-web', router);

        app.listen(PORT, () => {
            console.log('Server listening on port', PORT);
        });
    } catch (e) {
        console.log(e);
    }
};

startServer();
