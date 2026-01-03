# BOSS Worker Base Image

Pre-configured Docker image for BOSS workers that eliminates 60-90s of setup time per worker spawn.

## What's Included

- **Base:** Node.js 22 (LTS) slim variant
- **System Tools:** bash, git, curl, build-essential
- **Package Managers:** npm, pnpm
- **BOSS Tools:** claude-code (Anthropic CLI)
- **Pre-configured:** Git config, directory structure, environment variables

## Performance Impact

| Metric              | Before | After | Savings    |
| ------------------- | ------ | ----- | ---------- |
| Container Setup     | 60-90s | 5-10s | **50-80s** |
| apt-get operations  | 40s    | 0s    | 40s        |
| npm global installs | 30s    | 0s    | 30s        |

## Usage

### Local Development

```bash
# Build the image
cd conductor-mcp/docker/boss-worker-base
./build.sh

# Build and test
./build.sh --version 1.0.0

# Build for specific platform
./build.sh --platform linux/amd64
```

### Production

```bash
# Build and push to Docker Hub
./build.sh --push --registry docker.io/yourusername --version 1.0.0

# Build and push to private registry
./build.sh --push --registry registry.example.com/boss --version 1.0.0
```

### Using the Image

**Option 1: Update worker configs**

Edit `conductor-mcp/worker-configs/*/container-config.json`:

```json
{
  "base_image": "boss/worker-base:1.0.0",
  "setup_commands": [],
  "install_commands": [],
  "environment_variables": {
    "WORKER_ROLE": "${workerName}"
  }
}
```

**Option 2: Set as default**

```bash
# Set project-wide default
container-use config base-image set boss/worker-base:1.0.0

# Verify
container-use config base-image get
```

## Versioning Strategy

Use semantic versioning for predictable caching and rollback capability:

- `1.0.0` - Specific version (recommended for production)
- `1.0` - Minor version (auto-updates patches)
- `1` - Major version (auto-updates minor and patches)
- `latest` - Always latest (not recommended for production)

**Recommendation:** Always use specific versions (e.g., `1.0.0`) in production for reproducibility.

## Updating the Image

When dependencies need updates:

1. **Update Dockerfile** - Modify versions or add packages
2. **Bump version** - Increment version number
3. **Build and test** - `./build.sh --version X.Y.Z`
4. **Push to registry** - `./build.sh --push --version X.Y.Z`
5. **Update configs** - Update worker configs to use new version
6. **Test with single worker** - Verify before rolling out to all workers

## Customization

### Adding System Packages

```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        your-package-here \
        another-package && \
    rm -rf /var/lib/apt/lists/*
```

### Adding Global npm Packages

```dockerfile
RUN npm install -g \
    pnpm@latest \
    @anthropic-ai/claude-code@latest \
    your-package@version
```

### Pinning Versions

For maximum reproducibility, pin exact versions:

```dockerfile
RUN npm install -g \
    pnpm@9.0.0 \
    @anthropic-ai/claude-code@1.2.3
```

## Multi-Platform Builds

The build script supports multi-platform builds using Docker Buildx:

```bash
# Build for multiple architectures
./build.sh --platform linux/amd64,linux/arm64

# Build for Apple Silicon
./build.sh --platform linux/arm64

# Build for Intel/AMD
./build.sh --platform linux/amd64
```

## Troubleshooting

### Build Fails

```bash
# Check Docker version
docker --version  # Should be 20.10+ with buildx support

# Check buildx
docker buildx version

# Reset builder
docker buildx rm boss-builder
./build.sh
```

### Image Size Too Large

```bash
# Check image size
docker images boss/worker-base:1.0.0

# Analyze layers
docker history boss/worker-base:1.0.0

# Use dive for detailed analysis
dive boss/worker-base:1.0.0
```

### Slow Builds

- Use `.dockerignore` to exclude unnecessary files
- Leverage Docker layer caching
- Use multi-stage builds if needed
- Consider using buildkit cache mounts

## CI/CD Integration

See `.github/workflows/build-docker-images.yml` for automated builds on:

- Push to main (latest tag)
- Git tags (versioned releases)
- Pull requests (testing only)

## Security Considerations

- Image is based on official `node:22-slim` from Docker Hub
- Minimal attack surface (slim variant)
- No secrets baked into image
- Secrets managed via container-use secrets config
- Regular updates for security patches

## Maintenance

**Monthly:**

- Update Node.js version if new LTS available
- Update pnpm and claude-code to latest versions
- Rebuild and test all workers

**Quarterly:**

- Review system package versions
- Check for security advisories
- Optimize image size

**On Breaking Changes:**

- Bump major version (2.0.0)
- Document migration path
- Maintain old version for rollback

## Related Documentation

- [Container-Use Configuration](https://container-use.com/environment-configuration)
- [Performance Optimization Plan](/Users/joe/code-glx/boss/OPTIMIZATION_PLAN.md)
- [BOSS Architecture](/Users/joe/code-glx/boss/CLAUDE.md)
