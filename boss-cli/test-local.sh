#!/bin/bash

# BOSS CLI Local Testing Script
# This script automates the setup and testing of the BOSS CLI locally

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_PROJECT_NAME="${TEST_PROJECT_NAME:-test-boss-project}"
TEST_TEMPLATE="${TEST_TEMPLATE:-t3-prisma}"
TEST_QUALITY="${TEST_QUALITY:-startup}"
TEST_DIR="${TEST_DIR:-$HOME}"
LINK_GLOBALLY="${LINK_GLOBALLY:-false}"
CLEANUP="${CLEANUP:-false}"
AUTO_CLEAN="${AUTO_CLEAN:-true}"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    local missing=0
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        missing=1
    else
        log_success "Node.js $(node --version) is installed"
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed"
        log_info "Install with: npm install -g pnpm"
        missing=1
    else
        log_success "pnpm $(pnpm --version) is installed"
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        missing=1
    else
        log_success "git $(git --version | cut -d' ' -f3) is installed"
    fi
    
    if [ $missing -eq 1 ]; then
        log_error "Missing prerequisites. Please install them and try again."
        exit 1
    fi
}

# Validate parameters
validate_parameters() {
    log_step "Validating Parameters"
    
    local errors=0
    
    # Validate project name
    if [ -z "$TEST_PROJECT_NAME" ]; then
        log_error "Project name is required"
        errors=1
    elif [[ ! "$TEST_PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Project name must contain only letters, numbers, hyphens, and underscores"
        errors=1
    else
        log_success "Project name: $TEST_PROJECT_NAME"
    fi
    
    # Validate template
    local valid_templates=("t3-prisma" "t3-drizzle" "nestjs-typeorm" "fastify-native" "astro-portfolio")
    local template_valid=false
    for t in "${valid_templates[@]}"; do
        if [ "$TEST_TEMPLATE" = "$t" ]; then
            template_valid=true
            break
        fi
    done

    if [ "$template_valid" = false ]; then
        log_error "Invalid template: $TEST_TEMPLATE"
        log_info "Valid templates: ${valid_templates[*]}"
        errors=1
    else
        log_success "Template: $TEST_TEMPLATE"
    fi
    
    # Validate quality preset
    local valid_qualities=("startup" "production" "enterprise")
    local quality_valid=false
    for q in "${valid_qualities[@]}"; do
        if [ "$TEST_QUALITY" = "$q" ]; then
            quality_valid=true
            break
        fi
    done
    
    if [ "$quality_valid" = false ]; then
        log_error "Invalid quality preset: $TEST_QUALITY"
        log_info "Valid quality presets: ${valid_qualities[*]}"
        errors=1
    else
        log_success "Quality preset: $TEST_QUALITY"
    fi
    
    # Validate test directory
    if [ -z "$TEST_DIR" ]; then
        log_error "Test directory is required"
        errors=1
    elif [ ! -d "$(dirname "$TEST_DIR")" ] && [ "$(dirname "$TEST_DIR")" != "." ]; then
        log_error "Parent directory of test directory does not exist: $(dirname "$TEST_DIR")"
        errors=1
    else
        log_success "Test directory: $TEST_DIR"
    fi
    
    if [ $errors -eq 1 ]; then
        log_error "Parameter validation failed"
        exit 1
    fi
}

# Build the CLI
build_cli() {
    log_step "Building BOSS CLI"
    
    cd "$SCRIPT_DIR"
    
    log_info "Installing dependencies..."
    if ! pnpm install; then
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    log_info "Building TypeScript..."
    if ! pnpm build; then
        log_error "Failed to build CLI"
        exit 1
    fi
    
    # Verify build was successful
    if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
        log_error "Build failed: dist/index.js not found"
        exit 1
    fi
    
    log_success "CLI built successfully"
}

# Link CLI globally (optional)
link_cli() {
    if [ "$LINK_GLOBALLY" = "true" ]; then
        log_step "Linking CLI Globally"
        
        cd "$SCRIPT_DIR"
        
        log_info "Linking boss command globally..."
        if pnpm link --global; then
            log_success "CLI linked globally"
            
            # Verify it works
            if boss --version &> /dev/null; then
                log_success "boss command is available globally"
            else
                log_warning "boss command may not be in PATH"
            fi
        else
            log_error "Failed to link CLI globally"
            exit 1
        fi
    else
        log_info "Skipping global link (set LINK_GLOBALLY=true to enable)"
    fi
}

# Run doctor command
run_doctor() {
    log_step "Running Doctor Check"
    
    cd "$SCRIPT_DIR"
    
    if [ "$LINK_GLOBALLY" = "true" ]; then
        boss doctor || log_warning "Doctor check completed with warnings"
    else
        node dist/index.js doctor || log_warning "Doctor check completed with warnings"
    fi
}

# Create test project
create_test_project() {
    log_step "Creating Test Project"
    
    local test_dir="$TEST_DIR/$TEST_PROJECT_NAME"
    
    # Ensure test directory exists
    mkdir -p "$TEST_DIR"
    
    # Check if project already exists
    if [ -d "$test_dir" ]; then
        if [ "$AUTO_CLEAN" = "true" ]; then
            log_warning "Test project directory already exists: $test_dir"
            log_info "Auto-removing existing test project..."
            rm -rf "$test_dir"
        else
            log_warning "Test project directory already exists: $test_dir"
            if [ -t 0 ]; then
                # Only prompt if running interactively (stdin is a terminal)
                read -p "Remove it and create a new one? (y/N) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    log_info "Removing existing test project..."
                    rm -rf "$test_dir"
                else
                    log_info "Skipping project creation"
                    return
                fi
            else
                log_error "Test project exists and AUTO_CLEAN=false. Use --auto-clean or remove manually: $test_dir"
                exit 1
            fi
        fi
    fi
    
    log_info "Creating project: $TEST_PROJECT_NAME"
    log_info "Template: $TEST_TEMPLATE"
    log_info "Quality: $TEST_QUALITY"
    log_info "Location: $test_dir"
    
    # Change to test directory (where project will be created)
    cd "$TEST_DIR"
    
    if [ "$LINK_GLOBALLY" = "true" ]; then
        boss bootstrap \
            --template "$TEST_TEMPLATE" \
            --quality "$TEST_QUALITY" \
            --name "$TEST_PROJECT_NAME" \
            --non-interactive
    else
        # Use the built version - it's already compiled and doesn't need pnpm workspace
        node "$SCRIPT_DIR/dist/index.js" bootstrap \
            --template "$TEST_TEMPLATE" \
            --quality "$TEST_QUALITY" \
            --name "$TEST_PROJECT_NAME" \
            --non-interactive
    fi
    
    if [ ! -d "$test_dir" ]; then
        log_error "Test project was not created"
        exit 1
    fi
    
    log_success "Test project created at: $test_dir"
}

# Verify monorepo template-specific structure
verify_monorepo_template() {
    log_info "Running monorepo-specific verification..."

    local checks_passed=0
    local checks_failed=0

    # Check helper function
    check_item() {
        local type=$1
        local path=$2

        if [ "$type" = "dir" ] && [ -d "$path" ]; then
            log_success "  ✓ $path exists"
            checks_passed=$((checks_passed + 1))
        elif [ "$type" = "file" ] && [ -f "$path" ]; then
            log_success "  ✓ $path exists"
            checks_passed=$((checks_passed + 1))
        else
            log_error "  ✗ $path is missing"
            checks_failed=$((checks_failed + 1))
        fi
    }

    # Workspace configuration
    log_info "Checking workspace configuration..."
    check_item "file" "pnpm-workspace.yaml"
    check_item "file" "turbo.json"
    check_item "file" "package.json"
    check_item "file" "tsconfig.json"

    # Applications
    log_info "Checking applications..."
    check_item "dir" "apps/web"
    check_item "file" "apps/web/package.json"
    check_item "file" "apps/web/next.config.ts"
    check_item "file" "apps/web/app/page.tsx"

    check_item "dir" "apps/admin"
    check_item "file" "apps/admin/package.json"
    check_item "file" "apps/admin/next.config.ts"
    check_item "file" "apps/admin/app/page.tsx"

    # Packages
    log_info "Checking shared packages..."

    # UI package
    check_item "dir" "packages/ui"
    check_item "file" "packages/ui/package.json"
    check_item "file" "packages/ui/src/components/ui/button.tsx"
    check_item "dir" "packages/ui/.storybook"

    # Database package
    check_item "dir" "packages/database"
    check_item "file" "packages/database/package.json"
    check_item "file" "packages/database/prisma/schema.prisma"

    # tRPC package
    check_item "dir" "packages/trpc"
    check_item "file" "packages/trpc/package.json"
    check_item "file" "packages/trpc/src/routers/_app.ts"

    # Auth package
    check_item "dir" "packages/auth"
    check_item "file" "packages/auth/package.json"
    check_item "file" "packages/auth/src/index.ts"

    # Config package
    check_item "dir" "packages/config"
    check_item "file" "packages/config/package.json"
    check_item "file" "packages/config/eslint/react-library.js"
    check_item "file" "packages/config/typescript/base.json"

    # Utils package
    check_item "dir" "packages/utils"
    check_item "file" "packages/utils/package.json"
    check_item "file" "packages/utils/src/string.ts"

    # Docker & Deployment
    log_info "Checking Docker and deployment files..."
    check_item "dir" "docker"
    check_item "file" "docker/Dockerfile.web"
    check_item "file" "docker/Dockerfile.admin"
    check_item "file" "docker/docker-compose.yml"

    check_item "dir" "config/kamal"
    check_item "file" "config/kamal/deploy.yml"
    check_item "file" "scripts/deploy.sh"
    check_item "file" "scripts/setup-db.sh"

    # Verify pnpm workspace configuration
    if [ -f "pnpm-workspace.yaml" ] && [ -f "package.json" ]; then
        if grep -q '"private": true' package.json; then
            log_success "  ✓ Root package.json and pnpm-workspace.yaml are properly configured"
            checks_passed=$((checks_passed + 1))
        else
            log_error "  ✗ Root package.json is not marked as private"
            checks_failed=$((checks_failed + 1))
        fi
    else
        log_error "  ✗ pnpm workspace configuration is missing"
        checks_failed=$((checks_failed + 1))
    fi

    # Verify Turborepo configuration (Turbo 2.x uses "tasks", older versions use "pipeline")
    if [ -f "turbo.json" ]; then
        if grep -q '"tasks"' turbo.json || grep -q '"pipeline"' turbo.json; then
            log_success "  ✓ Turborepo tasks/pipeline is configured"
            checks_passed=$((checks_passed + 1))
        else
            log_error "  ✗ Turborepo tasks/pipeline is missing"
            checks_failed=$((checks_failed + 1))
        fi
    fi

    return $checks_failed
}

# Verify project structure
verify_project() {
    log_step "Verifying Project Structure"

    local test_dir="$TEST_DIR/$TEST_PROJECT_NAME"

    if [ ! -d "$test_dir" ]; then
        log_error "Test project directory not found: $test_dir"
        return 1
    fi

    cd "$test_dir"

    local checks_passed=0
    local checks_failed=0

    # Check critical directories
    check_dir() {
        if [ -d "$1" ]; then
            log_success "$1 exists"
            checks_passed=$((checks_passed + 1))
        else
            log_error "$1 is missing"
            checks_failed=$((checks_failed + 1))
        fi
    }

    # Check critical files
    check_file() {
        if [ -f "$1" ]; then
            log_success "$1 exists"
            checks_passed=$((checks_passed + 1))
        else
            log_error "$1 is missing"
            checks_failed=$((checks_failed + 1))
        fi
    }

    # Common BOSS files (all templates)
    log_info "Checking common BOSS structure..."
    check_dir ".boss"
    check_dir ".specify"
    check_dir ".container-use"
    check_dir ".claude"
    check_dir ".github/workflows"
    check_dir ".git"

    check_file "CLAUDE.md"
    check_file "start-boss.sh"
    check_file "docker-compose.yml"
    check_file ".boss/config.yaml"

    # Template-specific verification can be added here for each template type
    # Currently using external templates that don't have monorepo structure

    # Check git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        log_success "Git repository initialized"
        checks_passed=$((checks_passed + 1))
        log_info "Git log:"
        git log --oneline -3 || true
    else
        log_error "Git repository not initialized"
        checks_failed=$((checks_failed + 1))
    fi

    # Summary
    echo
    log_info "Verification Summary: $checks_passed passed, $checks_failed failed"

    if [ $checks_failed -eq 0 ]; then
        log_success "All checks passed!"
        return 0
    else
        log_warning "Some checks failed"
        return 1
    fi
}

# Cleanup test project
cleanup() {
    log_step "Cleaning Up"
    
    local test_dir="$TEST_DIR/$TEST_PROJECT_NAME"
    
    if [ -d "$test_dir" ]; then
        log_info "Removing test project: $test_dir"
        rm -rf "$test_dir"
        log_success "Test project removed"
    else
        log_info "Test project not found, nothing to clean"
    fi
    
    if [ "$LINK_GLOBALLY" = "true" ]; then
        read -p "Unlink boss command globally? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$SCRIPT_DIR"
            pnpm unlink --global
            log_success "CLI unlinked globally"
        fi
    fi
}

# Show usage
show_usage() {
    cat << EOF
BOSS CLI Local Testing Script

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -n, --name NAME         Test project name (default: test-boss-project)
    -t, --template TEMPLATE Template to use (default: t3-prisma)
                           Options: t3-prisma, t3-drizzle, nestjs-typeorm, fastify-native, astro-portfolio
    -q, --quality QUALITY   Quality preset (default: startup)
                           Options: startup, production, enterprise
    -d, --dir DIR           Directory to create test project in (default: $HOME)
    -l, --link              Link CLI globally after building
    -c, --cleanup           Clean up test project after verification
    --no-auto-clean         Don't automatically remove existing test projects
    --verify-only           Only verify existing test project (skip build/create)
    --cleanup-only          Only clean up test project

Environment Variables:
    TEST_PROJECT_NAME       Test project name
    TEST_TEMPLATE           Template to use
    TEST_QUALITY            Quality preset
    TEST_DIR                Directory to create test project in (default: $HOME)
    LINK_GLOBALLY           Set to 'true' to link globally
    AUTO_CLEAN              Set to 'false' to disable auto-removal of existing projects

Examples:
    # Basic test
    $0

    # Test with specific template and quality
    $0 --template t3-prisma --quality production

    # Link globally and test
    $0 --link

    # Clean up only
    $0 --cleanup-only

    # Verify existing project
    $0 --verify-only

EOF
}

# Main execution
main() {
    local verify_only=false
    local cleanup_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -n|--name)
                TEST_PROJECT_NAME="$2"
                shift 2
                ;;
            -t|--template)
                TEST_TEMPLATE="$2"
                shift 2
                ;;
            -q|--quality)
                TEST_QUALITY="$2"
                shift 2
                ;;
            -d|--dir)
                TEST_DIR="$2"
                shift 2
                ;;
            -l|--link)
                LINK_GLOBALLY="true"
                shift
                ;;
            -c|--cleanup)
                CLEANUP="true"
                shift
                ;;
            --no-auto-clean)
                AUTO_CLEAN="false"
                shift
                ;;
            --verify-only)
                verify_only=true
                shift
                ;;
            --cleanup-only)
                cleanup_only=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Handle cleanup-only mode
    if [ "$cleanup_only" = true ]; then
        cleanup
        exit 0
    fi
    
    # Handle verify-only mode
    if [ "$verify_only" = true ]; then
        verify_project
        exit $?
    fi
    
    # Normal flow
    check_prerequisites
    validate_parameters
    build_cli
    link_cli
    run_doctor
    create_test_project
    verify_project
    
    if [ "$CLEANUP" = "true" ]; then
        cleanup
    else
        local test_dir="$TEST_DIR/$TEST_PROJECT_NAME"
        echo
        log_success "Test project is available at: $test_dir"
        log_info "Run with --cleanup-only to remove it"
    fi
}

# Run main
main "$@"

