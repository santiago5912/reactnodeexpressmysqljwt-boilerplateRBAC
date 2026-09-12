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

Set `DB_HOST` to a reachable MySQL hostname when MySQL runs outside the container.
`DB_PORT` defaults to `3306`; `DB_HOST` defaults to `localhost` for local development.

The image runs `node server.js` with production dependencies. Puppeteer's unused
browser download is disabled; browser automation would require installing a browser
and its system dependencies.

## GitHub Actions: build and publish to Docker Hub

The reusable workflow in `.github/workflows/server-docker.yml` is called by
**Repository CI** only after the frontend build and server tests pass. It builds
the server image on every CI run; pushes and manual runs on `main` also publish
to Docker Hub. Other branches and pull requests only build the image and do not
require Docker Hub credentials. To trigger it manually, run **Repository CI**
from the Actions tab. The Docker workflow has no independent triggers.

Create a Docker Hub repository, then configure these settings under GitHub
**Settings > Secrets and variables > Actions**:

| Type | Name | Value |
| --- | --- | --- |
| Variable | `DOCKERHUB_USERNAME` | Docker Hub username used to sign in |
| Variable | `DOCKERHUB_IMAGE` | Full image name, e.g. `your-user/jwt-server` |
| Secret | `DOCKERHUB_TOKEN` | Docker Hub access token with write access to the image repository |

Published images have `latest` and `sha-<full-commit-sha>` tags. For example:

```sh
docker pull your-user/jwt-server:latest
```

The workflow builds Linux AMD64 images using the existing server Dockerfile and
caches Docker build layers between runs. This JavaScript server has no compilation
step; the Docker build installs its production dependencies and packages its source.
The pipeline publishes the image; deployment and runtime configuration are handled
separately using the Docker instructions above.

Reference: [Docker's GitHub Actions guide](https://docs.docker.com/guides/gha/).
