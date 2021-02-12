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

    const issuer = await Issuer.discover(oauthServer + '/aad/.well-known/openid-configuration');
    console.log(`Discovered issuer ${issuer.issuer}`);
    return new issuer.Client(
        {
            client_id: 'audience',
            redirect_uris: ['http://localhost:3000/oauth2/callback'],
            token_endpoint_auth_method: 'private_key_jwt',
            token_endpoint_auth_signing_alg: 'RS256',
        },
        {
            // Disse skal komme fra secrets
            keys: [
                {
                    "p": "36qWbr6zTCe4xM3OLpT_x9mcSbNvnx9Sr-z9GHHS4aCQS7JWirw3ez-8vWM71jypLIbUUj7ym_Dbd98IJtc9S6o8j5QejC92Y5EJqtnmKEkKnD4HWLPruCIf8mPlWFPsQQxHeAB6vv1ki036cfaHnmlV7_Fsv2ftYKHfp86-ozE",
                    "kty": "RSA",
                    "q": "19dG8TqsgmvM37F5C_0V0EjBXd2FcJQUkeoZbZRBcAGeoFyDklkMuUwlIogF0fQPrp-UBoCoY_efz5Y4Y_jR00W9xpPcb2spC9UdmMRVaw6YhKHY1NOdvF_9pV8hI5QtpSglaCr9o6lCp78_wELjZe7-tFcZyN7C-LvyX63W7qc",
                    "d": "MK-8k59azRASyjD59fPySFdeo4BzHYsjObZ5Vxmblz2uD4CDKgLldQzG7ELiO4FCDhfpQklQFTpa1wIt-wFFMYW3-crTJv3gC-s3u5215yZIQ3ilMQXdXliultOQKGUnm9QHaTW0RZpgwOmOe4iRkbunrCUTPhbmiAJWzOXg1KtMAcc_q1-F5n1YpplzKLAORgRYcvfwaEKLag-FHQgqfokTp8-Lm2zWQ_2xr34ifKuQFWi79M8PMdpMzExGVoc_rDBbweXt4CxuZQTUzYp_F9D-RP4XOPl1Xb1kVXb5vW-dw3QlFHWOszwb7GK0GLHahJrs6sUHZ4I2HIHvrRPbAQ",
                    "e": "AQAB",
                    "use": "sig",
                    "kid": "test-id",
                    "qi": "heuqSTOqX0terJoTuYmudRYuldWg52KU4U-hsEFSYiOoGCuY5O-Wkqs66i28gGOlFAaU9rGvxIQd1ro9ag1TiZxyWPPtrVdyD-HwNYs11tdROTZ8lVFs6OYj3NhwZYd5TXpq4HNf-jf7yru2NF7jSWg6UR1TBXeBTHchQKdgnTo",
                    "dp": "Wi8VUvgPoYBOrwPww7WOYM2sh8cTFczycT8UWhvjFNjB9dOls3DqygZMGuz9PofdCrgeuj7pYdk_FNlYFxkofO7aVmY53vpwOPtNM5eChvHUlmUoXyrEu8z-pqSC4BeOpjfGRWukEohnVwgNGJB35HbCkOn-mDrWauU6IhZppbE",
                    "alg": "RS256",
                    "dq": "hGbwg8XkUNTkBkyN3obPvMcEpxneY2LTA3dBRfDt-1FjByf5JesuXPSSyw351AMNI6eMXDjMExaxl9ukl97oh9t-QLQvQsHPmgyPbUjyxQtdD-9gXZ26YvXXWHx0jai2H1vzJmVI1f5cfx5Ycw4VBFCJOgM8M_ZCT-arFXpEIH0",
                    "n": "vJRalsEoApXYdEFsrYo7QOcM36shQXTQvyXuiJPzqq-WpwOM7dCLUQJ7HRO07kKJAfdldwV7j1k1KELjwUozXQC_uGL28xByaP3BZ5JcTmBWz_X2tIRkxOcj8QYJYUaRBWF8gjISkbZC_Cli94NI5qkdSegGV4tjHYwGhk3qX1Pp0NULhxmfdiiMtkMj2PEGQGxl87tgUQrWjBZj1pcn-d7Tnw8uUNMt5tfqCzVXQcJefkuPTOetvFMSyMk8ismd1uxLie1sQ4I-KFnD9OMLVAHfuXNtLrQoPaYJVzqE7ix3f9y5kS8VMn8-UN42gxm6AMenJ0TXJFaAUnGAogoC9w"
                }
            ]
        }
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
        sessionKey: 'altinn-meldinger-session-id'
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
