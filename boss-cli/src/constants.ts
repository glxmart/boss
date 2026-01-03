/**
 * BOSS CLI Constants
 *
 * Central configuration values used across the CLI
 */

/**
 * Docker Image Configuration
 *
 * The BOSS worker base image is published to GitHub Container Registry (ghcr.io)
 * and includes pre-installed tools to optimize worker spawn times:
 * - Node.js 22 (LTS)
 * - System dependencies (git, curl, build-essential)
 * - pnpm (package manager)
 * - claude-code (Anthropic CLI)
 */
export const DOCKER_BASE_IMAGE = 'ghcr.io/glxmart/boss-worker-base';
export const DOCKER_IMAGE_VERSION = 'latest'; // Auto-updated on version releases (v1.0.0, etc)
export const DOCKER_IMAGE_FULL = `${DOCKER_BASE_IMAGE}:${DOCKER_IMAGE_VERSION}`;

/**
 * BOSS Version
 */
export const BOSS_VERSION = '1.0.0-beta.0';
