const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Issuer } = require('openid-client');

const staticPath = path.join(__dirname, '/static');
const BASE_PATH = "/altinn-meldinger-client";
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_API_PATH = BASE_PATH + '/api';
const BACKEND_API_PATH = '/altinn-meldinger-api';
const BACKEND_BASEURL = 'http://localhost:8080';

const oauthServer = 'http://localhost:11115'

Issuer.discover(oauthServer + '/aad/.well-known/openid-configuration').then(azureIssuer => {

    const client = new azureIssuer.Client({
        client_id: 'zELcpfANLqY7Oqas',
        client_secret: 'TQV5U29k1gHibH5bx1layBo0OSAvAbRT3UYW3EWrSYBB5swxjVfWUa1BS8lqzxG/0v9wruMcrGadany3',
        redirect_uris: ['http://localhost:3000/altinn-meldinger-client/hei'],
        response_types: ['code'],
        id_token_signed_response_alg: "RS256",
        token_endpoint_auth_method: "client_secret_basic",
    });
    const url = client.authorizationUrl({
        scope: 'openid',
    });
    console.log('auth url: ' + url)
});

const proxy = createProxyMiddleware(
    FRONTEND_API_PATH, {
        target: BACKEND_BASEURL,
        changeOrigin: true,
        pathRewrite: (path, req) => path.replace(FRONTEND_API_PATH, BACKEND_API_PATH),
        secure: true,
        xfwd: true
    });

const startServer = () => {
    app.use(proxy);
    app.use(BASE_PATH + '/', express.static(staticPath));
    app.listen(PORT, () => {
        console.log('Server listening on port', PORT);
    });
}

startServer();
