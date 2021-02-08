const express = require('express');
const { getConfiguredRouter } = require('./router');
const passport = require('passport');
const session = require('express-session');
const { Issuer, Strategy } = require('openid-client');
const { BASE_PATH } = require('./konstanter');

const app = express();
const PORT = process.env.PORT || 3000;

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
    /*
    const issuer = await Issuer.discover(oauthServer + '/aad/.well-known/openid-configuration');
    console.log(`Discovered issuer ${issuer.issuer}`);
    return new issuer.Client(
        {
            client_id: 'CLIENT_ID',
            redirect_uris: ['http://localhost:3000/oauth2/callback'],
            token_endpoint_auth_method: 'private_key_jwt',
            token_endpoint_auth_signing_alg: 'RS256',
        },
        {
            keys: [
                {
                    kty: 'RSA',
                    e: 'AQAB',
                    kid: 'mock-oauth2-server-key',
                    n:
                        'r4N9A6UhKVU1ntywerhKbcq2bV80iVt11ILWPzWuh1LDymVqbZBXPMtxj85EcqZn4HNhnaMN5IeSjKc36w2I5X88msscFpjqXFyutnRv1PomccVtXXzr8DFZdMbb_YTHsweAvKh4S5SYrDJEJ8Lc93m_rNBRZ8iCN14h6VlvP_McS1Vj3yDRwk6tI-4owitmkpRqs3Q_eRDty4GLWZCAm87AQcnDukDp1_U21yvNVtRzC6_QyUAF_CV2NKLcVCf5jjvyeeSvH6GAgxKkY4lyHhDr1oCqE_3RhcJ3OfcUCWJnscEydaYBoTw92ScTw1rBtFDL1DqlGA0zI5ZHCR86LQ',
                },
            ],
        }
    );*/
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
    };
    return new Strategy(options, verify);
};

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
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));
    passport.use('azureOidc', strategy(azureClient));

    app.use('/', router);

    app.listen(PORT, () => {
        console.log('Server listening on port', PORT);
    });
};

startServer();
