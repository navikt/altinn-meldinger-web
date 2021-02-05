const { createProxyMiddleware } = require('http-proxy-middleware');

proxy(config.api.url, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => {
        return req.originalUrl;
    },
    proxyReqOptDecorator: (options, req) => {
        return new Promise((resolve, reject) =>
            authUtils.getOnBehalfOfAccessToken(authClient, req).then(
                (access_token) => {
                    options.headers.Authorization = `Bearer ${access_token}`;
                    resolve(options);
                },
                (error) => reject(error)
            )
        );
    },
})
