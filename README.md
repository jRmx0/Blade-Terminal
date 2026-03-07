# bun-react-template

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Docker

The project includes two Dockerfiles — one for Linux containers (default) and one for Windows containers.

### Linux containers

Make sure Docker Desktop is set to **Linux containers** mode, then run:

```bash
docker build --pull -t blade-terminal .
docker run -p 3000:3000 blade-terminal
```

### Windows containers

Make sure Docker Desktop is set to **Windows containers** mode, then run:

```powershell
docker build --pull -f Dockerfile.windows -t blade-terminal .
docker run -p 3000:3000 blade-terminal
```

By default, the Windows build uses Bun v1.2.3. To use a different version, pass the `BUN_VERSION` build argument:

```powershell
docker build --pull -f Dockerfile.windows --build-arg BUN_VERSION=1.2.3 -t blade-terminal .
```

The app will be available at `http://localhost:3000`.
