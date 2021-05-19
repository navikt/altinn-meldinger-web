Frontend som kobler seg til https://github.com/navikt/altinn-meldinger-api.

Mer informasjon kommer.

## Secrets
Lag secret:
`kubectl create secret generic -n permittering-og-nedbemanning altinn-meldinger-web-session-secret --from-literal=ALTINN_MELDINGER_WEB_SESSION_SECRET=<secret>`

Les secret:
`kubectl get secret -n permittering-og-nedbemanning altinn-meldinger-web-session-secret -o jsonpath="{.data.ALTINN_MELDINGER_WEB_SESSION_SECRET}" | base64 --decode`
