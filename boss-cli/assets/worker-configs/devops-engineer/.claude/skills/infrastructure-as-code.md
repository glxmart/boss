# Infrastructure as Code

## Description

Create, modify, and manage infrastructure using code-based tools like Terraform, Docker, and CI/CD pipelines. Use when setting up deployments, configuring environments, automating builds, or managing infrastructure for BOSS projects.

## Overview

DevOps engineers in BOSS manage infrastructure as code, ensuring reproducible, version-controlled, and automated deployments. All infrastructure changes must be code-based, reviewed, and tested.

**Core Tools**:
- **Terraform/OpenTofu** - Infrastructure provisioning and management
- **Docker** - Containerization and deployment
- **GitHub Actions** - CI/CD automation
- **Monitoring** - Observability and alerting

## Terraform/OpenTofu

### Project Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   ├── compute/
│   └── monitoring/
├── backend.tf               # Remote state configuration
└── versions.tf              # Provider versions
```

### Basic Configuration

```hcl
# terraform/environments/production/main.tf
terraform {
  required_version = ">= 1.6"

  backend "s3" {
    bucket = "my-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Use modules
module "networking" {
  source = "../../modules/networking"

  vpc_cidr = var.vpc_cidr
  environment = "production"
}

module "database" {
  source = "../../modules/database"

  vpc_id = module.networking.vpc_id
  subnet_ids = module.networking.private_subnet_ids
  instance_class = "db.t3.medium"
}
```

### Common Resources

**VPC and Networking**:
```hcl
# modules/networking/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.environment}-private-${count.index}"
  }
}
```

**RDS Database**:
```hcl
# modules/database/main.tf
resource "aws_db_instance" "postgres" {
  identifier     = "${var.environment}-postgres"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_encrypted = true

  db_name  = var.database_name
  username = var.database_username
  password = var.database_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.environment}-postgres-final-snapshot"

  tags = {
    Environment = var.environment
  }
}
```

### Terraform Workflow

```bash
# Initialize
terraform init

# Format code
terraform fmt -recursive

# Validate
terraform validate

# Plan changes
terraform plan -out=plan.tfplan

# Apply changes
terraform apply plan.tfplan

# Destroy (careful!)
terraform destroy
```

### Best Practices

```hcl
# ✅ Good - use modules for reusability
module "app_server" {
  source = "../../modules/compute"

  instance_type = var.instance_type
  vpc_id = module.networking.vpc_id
}

# ✅ Good - use variables
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# ✅ Good - remote state
terraform {
  backend "s3" {
    # State stored remotely, supports locking
  }
}

# ❌ Bad - hardcoded values
resource "aws_instance" "web" {
  ami           = "ami-12345678" # Hardcoded!
  instance_type = "t3.micro"    # Hardcoded!
}
```

## Docker

### Dockerfile Best Practices

```dockerfile
# Multi-stage build for Next.js
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@postgres:5432/${DATABASE_NAME}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src:ro

volumes:
  postgres_data:
  redis_data:
```

### Docker Best Practices

```dockerfile
# ✅ Good - specific base image version
FROM node:20.10.0-alpine

# ✅ Good - minimize layers
RUN apk add --no-cache \
    git \
    openssh \
    build-base

# ✅ Good - .dockerignore
# .dockerignore file:
node_modules
.git
.env
dist
*.log

# ✅ Good - non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs

# ❌ Bad - using 'latest' tag
FROM node:latest

# ❌ Bad - running as root
# (no USER directive - runs as root)
```

## GitHub Actions CI/CD

### Workflow Structure

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: .next/
```

### Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: my-app
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production-cluster \
            --service my-app-service \
            --force-new-deployment
```

### Caching Strategy

```yaml
# Efficient caching
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: |
      ~/.pnpm-store
      **/node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-

# Turbo cache
- name: Cache Turbo
  uses: actions/cache@v3
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-
```

## Monitoring and Observability

### Application Monitoring

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function initMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
  });
}

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function trackEvent(name: string, data?: Record<string, any>) {
  Sentry.captureMessage(name, { extra: data });
}
```

### Logging

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }),
});

// Usage
logger.info({ userId: '123' }, 'User logged in');
logger.error({ error }, 'Failed to process payment');
```

### Metrics and Alerts

```yaml
# Prometheus metrics
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nextjs-app'
    static_configs:
      - targets: ['localhost:3000']
```

```typescript
// Metrics endpoint
import { register } from 'prom-client';

export async function GET() {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: { 'Content-Type': register.contentType },
  });
}
```

## Security Best Practices

### Secrets Management

```yaml
# GitHub Actions secrets
- name: Deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_KEY: ${{ secrets.API_KEY }}
  run: pnpm deploy

# Terraform secrets
variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Never commit:
# .env
# *.tfvars
# secrets.yaml
```

### Security Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * *' # Daily
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'my-image:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
```

## Common Infrastructure Patterns

### Blue-Green Deployment

```yaml
# Two identical environments
# Route traffic to blue (current production)
# Deploy to green (new version)
# Test green
# Switch traffic to green
# Keep blue as rollback

resource "aws_lb_target_group" "blue" {
  name = "app-blue"
  # ... config
}

resource "aws_lb_target_group" "green" {
  name = "app-green"
  # ... config
}

# Switch between blue and green
resource "aws_lb_listener_rule" "main" {
  listener_arn = aws_lb_listener.main.arn

  action {
    type             = "forward"
    target_group_arn = var.active_target_group # blue or green
  }
}
```

### Auto-Scaling

```hcl
# Auto-scaling group
resource "aws_autoscaling_group" "app" {
  name                = "${var.environment}-app-asg"
  vpc_zone_identifier = var.subnet_ids
  target_group_arns   = [aws_lb_target_group.app.arn]

  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-app-instance"
    propagate_at_launch = true
  }
}

# Auto-scaling policy
resource "aws_autoscaling_policy" "cpu_scale_up" {
  name                   = "${var.environment}-cpu-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70

  alarm_actions = [aws_autoscaling_policy.cpu_scale_up.arn]
}
```

## Anti-Patterns

### ❌ Manual Infrastructure Changes

```bash
# ❌ Bad - manual changes via console/CLI
aws ec2 create-instance ...

# ✅ Good - infrastructure as code
terraform apply
```

### ❌ Hardcoded Secrets

```hcl
# ❌ Bad - secrets in code
resource "aws_db_instance" "main" {
  password = "SuperSecret123" # NO!
}

# ✅ Good - use variables/secrets management
variable "db_password" {
  sensitive = true
}

resource "aws_db_instance" "main" {
  password = var.db_password
}
```

### ❌ No Rollback Strategy

```yaml
# ❌ Bad - no rollback plan
- name: Deploy
  run: deploy-to-production

# ✅ Good - versioned deployment with rollback
- name: Deploy version
  run: deploy --version=${{ github.sha }}

- name: Health check
  run: check-health

- name: Rollback on failure
  if: failure()
  run: deploy --version=${{ env.PREVIOUS_VERSION }}
```

## When to Use This Skill

- Setting up CI/CD pipelines for BOSS projects
- Provisioning infrastructure with Terraform
- Containerizing applications with Docker
- Implementing monitoring and alerting
- Managing deployments and rollbacks
- Configuring auto-scaling and load balancing

## Related Skills

- `security-best-practices.md` - Security in infrastructure
- `nextjs-turbo-stack.md` - Application stack to deploy

## Key Takeaways

1. **Everything as Code** - All infrastructure defined in version control
2. **Immutable Infrastructure** - Replace, don't modify
3. **Automated Deployments** - No manual steps
4. **Monitoring First** - Observability from day one
5. **Security by Default** - Secrets management, scanning, least privilege
6. **Rollback Strategy** - Always have a way back
