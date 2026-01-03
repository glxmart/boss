# BOSS Local Infrastructure Setup

> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md) | [BOSS Vision](./BOSS-ENHANCED-VISION.md) | [Spec-Kit Integration](./BOSS-SPEC-KIT-INTEGRATION.md) | [Container-Use Integration](./BOSS-CONTAINER-USE-INTEGRATION.md) | [GitHub Integration](./BOSS-GITHUB-INTEGRATION.md) | [Host Setup](./BOSS-HOST-SETUP.md)

This docker-compose configuration runs the minimal BOSS infrastructure locally. **GitHub is used for project management** - no separate PM tool needed!

## Services Included

### Knowledge Base Stack (3 containers)

- **PostgreSQL** (port 5432) - Structured data (projects, artifacts, dependencies)
- **Qdrant** (ports 6333, 6334) - Vector database for embeddings
- **HuggingFace Text Embeddings Inference** (port 8080) - Local embedding generation
  - Model: `BAAI/bge-large-en-v1.5` (1024 dimensions)
  - Replaces Voyage AI with open-source alternative

### Project Management via GitHub

- **GitHub** - Pull requests, issues, projects, discussions (already required for code)
  - ✅ No additional infrastructure needed
  - ✅ Native developer workflow
  - ✅ Built-in approval gates (PR reviews)
  - ✅ Built-in project boards (GitHub Projects)
  - ✅ See [BOSS-GITHUB-INTEGRATION.md](./BOSS-GITHUB-INTEGRATION.md)

## Quick Start

### 1. Start All Services

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 2. Wait for Services to Initialize

First startup takes 2-5 minutes:

- PostgreSQL database initializes
- Embeddings model downloads (~1GB)
- Qdrant vector store starts

Check readiness:

```bash
# Check all services are healthy
docker-compose ps

# Should show all services as "healthy" or "running"
```

### 3. Access Services

| Service              | URL                             | Credentials                                            |
| -------------------- | ------------------------------- | ------------------------------------------------------ |
| **Qdrant Dashboard** | http://localhost:6333/dashboard | No auth required                                       |
| **PostgreSQL**       | localhost:5432                  | User: `boss`, Pass: `bosssecret`, DB: `boss_knowledge` |
| **Embeddings API**   | http://localhost:8080           | No auth required                                       |

### 4. Configure MCP Servers

Update your Claude Code/Cursor MCP configuration:

**~/.config/claude-code/mcp-servers.json:**

```json
{
  "mcpServers": {
    "boss-knowledge": {
      "command": "npx",
      "args": ["@glxmart/mcp-knowledge"],
      "env": {
        "DATABASE_URL": "postgresql://boss:bosssecret@localhost:5432/boss_knowledge",
        "QDRANT_URL": "http://localhost:6333",
        "EMBEDDING_SERVICE_URL": "http://localhost:8080",
        "EMBEDDING_MODEL": "BAAI/bge-large-en-v1.5",
        "EMBEDDING_DIMENSIONS": "1024"
      }
    },

    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "op://glx/github/token"
      }
    },

    "container-use": {
      "command": "container-use",
      "args": ["mcp"]
    }
  }
}
```

**Note on 1Password:** 1Password CLI (`op`) is used for secret management - there is NO 1Password MCP server.

**Secret Management Workflow:**

1. BOSS identifies secret needs during planning phase
2. BOSS creates GitHub issue with detailed setup instructions
3. Human creates secrets in 1Password vault manually using `op` CLI
4. Human configures container-use with `op://` references
5. Container-use workers resolve secrets at runtime via `op` CLI
6. Workers run with full permissions inside isolated containers
7. BOSS controls egress rules (network restrictions) per worker

**Note:** GitHub MCP handles repository operations and project management (issues, PRs, project boards). See [BOSS-GITHUB-INTEGRATION.md](./BOSS-GITHUB-INTEGRATION.md) for details.

## Database Initialization

### PostgreSQL Schema

Create the knowledge base schema:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U boss -d boss_knowledge

# Or from your host (if you have psql installed)
psql postgresql://boss:bosssecret@localhost:5432/boss_knowledge
```

Run initialization script (create this as `init-scripts/postgres/001-init.sql`):

```sql
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  tech_stack JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Artifacts table (specs, plans, code patterns)
CREATE TABLE IF NOT EXISTS artifacts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL,  -- 'spec', 'plan', 'pattern', 'adr'
  name VARCHAR(255) NOT NULL,
  path TEXT,
  content TEXT,
  metadata JSONB,
  embedding_id VARCHAR(255),  -- Reference to Qdrant vector
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dependencies table
CREATE TABLE IF NOT EXISTS project_dependencies (
  id SERIAL PRIMARY KEY,
  from_project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  to_project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50),  -- 'api', 'library', 'data'
  endpoint VARCHAR(255),
  status VARCHAR(50),  -- 'available', 'in_progress', 'planned'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type);
CREATE INDEX idx_dependencies_from ON project_dependencies(from_project_id);
CREATE INDEX idx_dependencies_to ON project_dependencies(to_project_id);
```

### Qdrant Collections

Initialize Qdrant collections via API:

```bash
# Create specs collection
curl -X PUT http://localhost:6333/collections/specs \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "size": 1024,
      "distance": "Cosine"
    }
  }'

# Create patterns collection
curl -X PUT http://localhost:6333/collections/patterns \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "size": 1024,
      "distance": "Cosine"
    }
  }'

# Create decisions collection (ADRs)
curl -X PUT http://localhost:6333/collections/decisions \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "size": 1024,
      "distance": "Cosine"
    }
  }'
```

## Management Commands

### Start/Stop

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (DANGER: deletes all data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f embeddings
docker-compose logs -f qdrant
```

### Resource Usage

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df
```

### Backup & Restore

#### Backup PostgreSQL

```bash
# Knowledge base
docker-compose exec postgres pg_dump -U boss boss_knowledge > backup_kb.sql
```

#### Restore PostgreSQL

```bash
# Knowledge base
docker-compose exec -T postgres psql -U boss boss_knowledge < backup_kb.sql
```

#### Backup Qdrant

```bash
# Create snapshot via API
curl -X POST http://localhost:6333/collections/specs/snapshots

# Download snapshot (check response for snapshot name)
curl http://localhost:6333/collections/specs/snapshots/{snapshot-name} \
  --output qdrant_backup.snapshot
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs for errors
docker-compose logs

# Restart specific service
docker-compose restart postgres

# Rebuild and restart
docker-compose up -d --build
```

### Embeddings Model Download Fails

```bash
# Check logs
docker-compose logs embeddings

# If timeout, increase in docker-compose.yml:
#   start_period: 120s  # Increase from 60s

# Or download manually first:
docker-compose run embeddings /bin/bash
# Inside container: model will download to /data
```

### Qdrant Not Accessible

```bash
# Check Qdrant is running
docker-compose ps | grep qdrant

# Check Qdrant health
curl http://localhost:6333/healthz

# Restart Qdrant
docker-compose restart qdrant
```

### Port Conflicts

If ports are already in use, edit `docker-compose.yml`:

```yaml
# Example: Change PostgreSQL port
postgres:
  ports:
    - '5433:5432' # Host:Container (5433 instead of 5432)
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up unused images/containers
docker system prune -a

# Remove specific volumes (DANGER: data loss)
docker volume rm boss_postgres_data
```

## Performance Tuning

### PostgreSQL

Edit `docker-compose.yml` to add performance settings:

```yaml
postgres:
  command:
    - 'postgres'
    - '-c'
    - 'shared_buffers=256MB'
    - '-c'
    - 'max_connections=200'
    - '-c'
    - 'work_mem=4MB'
```

### Qdrant

For larger datasets, increase memory:

```yaml
qdrant:
  environment:
    QDRANT__STORAGE__PERFORMANCE__MAX_SEARCH_THREADS: 4
  deploy:
    resources:
      limits:
        memory: 4G
```

### Embeddings Service

For GPU acceleration (requires NVIDIA GPU + Docker GPU support):

```yaml
embeddings:
  image: ghcr.io/huggingface/text-embeddings-inference:latest # GPU version
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## Security Notes

### Production Deployment

For production use:

1. **Change default passwords:**

   ```yaml
   environment:
     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD} # Use env var
     SECRET_KEY: ${PLANE_SECRET_KEY}
   ```

2. **Use secrets file:**

   ```bash
   # Create .env file (add to .gitignore!)
   POSTGRES_PASSWORD=strong-random-password
   PLANE_SECRET_KEY=another-strong-password
   ```

3. **Enable SSL/TLS:**
   - Add nginx reverse proxy
   - Configure Let's Encrypt certificates

4. **Restrict network access:**

   ```yaml
   postgres:
     ports: [] # Don't expose to host, only internal network
   ```

5. **Regular backups:**
   - Automate daily backups
   - Test restore procedures
   - Store backups securely off-site

## Resource Requirements

### Minimum

- **RAM:** 8GB
- **CPU:** 4 cores
- **Disk:** 20GB

### Recommended

- **RAM:** 16GB
- **CPU:** 8 cores
- **Disk:** 50GB (includes space for embeddings model cache and data growth)

## Monitoring

### Health Checks

```bash
# Quick health check all services
docker-compose ps

# Detailed health status
for service in postgres qdrant embeddings; do
  echo "=== $service ==="
  docker-compose logs --tail=20 $service
done
```

### Metrics

Add Prometheus + Grafana for monitoring (optional):

Create `docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9091:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3001:3000'
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

## Next Steps

After infrastructure is running:

1. **Initialize Knowledge Base** - Run SQL initialization scripts
2. **Create Qdrant Collections** - Set up vector collections
3. **Update MCP Servers** - Point to local infrastructure
4. **Bootstrap Your First Project** - Run `boss bootstrap`
5. **Test Integration** - Verify Claude Code/Cursor can access all MCPs

## Support

For issues:

- Check logs: `docker-compose logs -f`
- Verify health: `docker-compose ps`
- Restart services: `docker-compose restart`
- Full reset: `docker-compose down -v && docker-compose up -d`
