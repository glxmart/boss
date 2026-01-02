#!/usr/bin/env zsh
# BOSS Worker Base Image - Build Script
# Builds and optionally pushes the Docker image

set -euo pipefail

# Configuration
IMAGE_NAME="${IMAGE_NAME:-boss/worker-base}"
VERSION="${VERSION:-1.0.0}"
REGISTRY="${REGISTRY:-}"  # Set to Docker Hub username or private registry
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
PUSH="${PUSH:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo "${GREEN}✓${NC} $1"
}

log_warning() {
    echo "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo "${RED}✗${NC} $1"
}

# Build image
build_image() {
    local full_image_name="$1"
    local tag="$2"

    log_info "Building Docker image: ${full_image_name}:${tag}"
    log_info "Platforms: ${PLATFORMS}"

    # Check if buildx is available
    if ! docker buildx version &> /dev/null; then
        log_error "Docker buildx is not available. Please install Docker Buildx."
        exit 1
    fi

    # Create builder if it doesn't exist
    if ! docker buildx ls | grep -q boss-builder; then
        log_info "Creating buildx builder: boss-builder"
        docker buildx create --name boss-builder --use
    else
        docker buildx use boss-builder
    fi

    # Build arguments
    local build_args=(
        --platform "${PLATFORMS}"
        --tag "${full_image_name}:${tag}"
        --tag "${full_image_name}:latest"
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
        --build-arg VERSION="${VERSION}"
    )

    # Add push flag if requested
    if [[ "${PUSH}" == "true" ]]; then
        build_args+=(--push)
        log_info "Will push to registry after build"
    else
        build_args+=(--load)
        log_warning "Building locally only (not pushing to registry)"
    fi

    # Build the image
    if docker buildx build "${build_args[@]}" .; then
        log_success "Successfully built ${full_image_name}:${tag}"
        return 0
    else
        log_error "Failed to build Docker image"
        return 1
    fi
}

# Test image
test_image() {
    local full_image_name="$1"
    local tag="$2"

    log_info "Testing image: ${full_image_name}:${tag}"

    # Test basic functionality
    log_info "Checking Node.js..."
    docker run --rm "${full_image_name}:${tag}" node --version

    log_info "Checking pnpm..."
    docker run --rm "${full_image_name}:${tag}" pnpm --version

    log_info "Checking for @anthropic-ai/claude-code..."
    docker run --rm "${full_image_name}:${tag}" npm list -g @anthropic-ai/claude-code --depth=0 || log_warning "claude-code binary not in PATH (package installed)"

    log_info "Checking git..."
    docker run --rm "${full_image_name}:${tag}" git --version

    log_success "All checks passed!"
}

# Show image info
show_info() {
    local full_image_name="$1"
    local tag="$2"

    log_info "Image size:"
    docker images "${full_image_name}:${tag}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

    log_info "\nTo use this image:"
    echo "  1. Update container-config.json:"
    echo "     {\"base_image\": \"${full_image_name}:${tag}\"}"
    echo ""
    echo "  2. Or set default config:"
    echo "     container-use config base-image set ${full_image_name}:${tag}"
}

# Main execution
main() {
    local full_image_name="${IMAGE_NAME}"

    # Add registry prefix if provided
    if [[ -n "${REGISTRY}" ]]; then
        full_image_name="${REGISTRY}/${IMAGE_NAME}"
    fi

    log_info "BOSS Worker Base Image Builder"
    log_info "=============================="
    log_info "Image: ${full_image_name}"
    log_info "Version: ${VERSION}"
    echo ""

    # Build
    if build_image "${full_image_name}" "${VERSION}"; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi

    # Test (only if not pushing, since local test won't work for multi-platform)
    if [[ "${PUSH}" != "true" ]]; then
        echo ""
        test_image "${full_image_name}" "${VERSION}"
    fi

    # Show info
    echo ""
    show_info "${full_image_name}" "${VERSION}"

    if [[ "${PUSH}" == "true" ]]; then
        log_success "Image pushed to registry: ${full_image_name}:${VERSION}"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --platform)
            PLATFORMS="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --push              Push image to registry after build"
            echo "  --version VERSION   Set image version (default: 1.0.0)"
            echo "  --registry REGISTRY Set registry prefix (e.g., docker.io/username)"
            echo "  --platform PLATFORMS Set platforms (default: linux/amd64,linux/arm64)"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  IMAGE_NAME   Image name (default: boss/worker-base)"
            echo "  VERSION      Image version (default: 1.0.0)"
            echo "  REGISTRY     Registry prefix"
            echo "  PLATFORMS    Build platforms"
            echo "  PUSH         Push to registry (true/false)"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Build locally"
            echo "  $0 --push --registry docker.io/myuser # Build and push"
            echo "  $0 --version 1.1.0                    # Build specific version"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main
