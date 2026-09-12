# Node/express.js boilerplate

Node/express.js backend boilerplate only with JWT authentication. 

## Files or folders excluded but necessary for the app

1. .env

2. private

3. public

4. certs/jwtRS256.key

5. certs/jwtRS256.key.pub

## Docker

Build from the repository root:

```sh
docker build -t jwt-server ./server
```

Run with your configured environment file and JWT keys:

```sh
docker run --rm -p 5010:5010 --env-file ./server/.env --mount type=bind,source="$(pwd)/server/certs",target=/app/certs,readonly jwt-server
```

The command above uses a POSIX shell. In PowerShell, replace `$(pwd)` with `${PWD}`.
Provide both JWT key files listed above and ensure they are readable by the container's
`node` user. Mount private assets at `/app/private` and uploads at `/app/public/uploads`
if needed. Environment files, keys, and these runtime assets are excluded from the image.

The database configuration currently hardcodes `localhost`, which refers to the
container itself. Configure `server/config/db.js` with a reachable database hostname
before building when MySQL runs outside this container.

The image runs `node server.js` with production dependencies. Puppeteer's unused
browser download is disabled; browser automation would require installing a browser
and its system dependencies.
