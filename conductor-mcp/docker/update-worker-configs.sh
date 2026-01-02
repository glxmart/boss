#!/usr/bin/env zsh
# Update all worker container-config.json files to use the new base image
# This script modifies worker configs to use pre-built boss/worker-base image

set -euo pipefail

# Configuration
IMAGE_NAME="${IMAGE_NAME:-boss/worker-base}"
IMAGE_VERSION="${IMAGE_VERSION:-1.0.0}"
WORKER_CONFIGS_DIR="conductor-mcp/worker-configs"
BACKUP_DIR="conductor-mcp/docker/config-backups"
DRY_RUN="${DRY_RUN:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo "${BLUE}ℹ ${NC}$1"; }
log_success() { echo "${GREEN}✓${NC} $1"; }
log_warning() { echo "${YELLOW}⚠${NC} $1"; }
log_error() { echo "${RED}✗${NC} $1"; }

# Create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/${timestamp}"

    log_info "Creating backup at: ${backup_path}"
    mkdir -p "${backup_path}"

    for config in "${WORKER_CONFIGS_DIR}"/*/container-config.json; do
        if [[ -f "${config}" ]]; then
            local worker_type=$(basename $(dirname "${config}"))
            cp "${config}" "${backup_path}/${worker_type}.json"
        fi
    done

    log_success "Backup created successfully"
}

# Update a single config file
update_config() {
    local config_file="$1"
    local worker_type=$(basename $(dirname "${config_file}"))

    log_info "Updating ${worker_type}..."

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_warning "DRY RUN: Would update ${config_file}"
        return 0
    fi

    # Read current config
    local current_config=$(cat "${config_file}")

    # Create updated config using jq
    local updated_config=$(echo "${current_config}" | jq \
        --arg image "${IMAGE_NAME}:${IMAGE_VERSION}" \
        '
        # Update base_image
        .base_image = $image |

        # Clear setup_commands (now in base image)
        .setup_commands = [] |

        # Clear install_commands (now in base image)
        .install_commands = [] |

        # Keep environment_variables, secrets, and network unchanged
        .
        ')

    # Write updated config
    echo "${updated_config}" > "${config_file}"

    log_success "Updated ${worker_type}"
}

# Show differences
show_diff() {
    local config_file="$1"
    local worker_type=$(basename $(dirname "${config_file}"))
    local latest_backup=$(ls -t "${BACKUP_DIR}" | head -1)

    if [[ -n "${latest_backup}" ]]; then
        local backup_file="${BACKUP_DIR}/${latest_backup}/${worker_type}.json"
        if [[ -f "${backup_file}" ]]; then
            echo ""
            echo "=== Changes for ${worker_type} ==="
            diff -u "${backup_file}" "${config_file}" || true
        fi
    fi
}

# Verify all configs
verify_configs() {
    log_info "Verifying updated configurations..."
    local errors=0

    for config in "${WORKER_CONFIGS_DIR}"/*/container-config.json; do
        if [[ -f "${config}" ]]; then
            # Check if valid JSON
            if ! jq empty "${config}" 2>/dev/null; then
                log_error "Invalid JSON: ${config}"
                ((errors++))
                continue
            fi

            # Check if using correct base image
            local base_image=$(jq -r '.base_image' "${config}")
            if [[ "${base_image}" != "${IMAGE_NAME}:${IMAGE_VERSION}" ]]; then
                log_warning "Unexpected base_image in ${config}: ${base_image}"
            fi

            # Check if setup_commands is empty
            local setup_count=$(jq '.setup_commands | length' "${config}")
            if [[ "${setup_count}" != "0" ]]; then
                log_warning "Non-empty setup_commands in ${config}"
            fi

            # Check if install_commands is empty
            local install_count=$(jq '.install_commands | length' "${config}")
            if [[ "${install_count}" != "0" ]]; then
                log_warning "Non-empty install_commands in ${config}"
            fi
        fi
    done

    if [[ ${errors} -eq 0 ]]; then
        log_success "All configurations are valid"
        return 0
    else
        log_error "Found ${errors} configuration errors"
        return 1
    fi
}

# Show summary
show_summary() {
    log_info "\nSummary of changes:"
    echo ""
    echo "Updated configurations:"
    for config in "${WORKER_CONFIGS_DIR}"/*/container-config.json; do
        local worker_type=$(basename $(dirname "${config}"))
        local base_image=$(jq -r '.base_image' "${config}")
        local setup_count=$(jq '.setup_commands | length' "${config}")
        local install_count=$(jq '.install_commands | length' "${config}")

        printf "  %-25s base: %-30s setup: %d  install: %d\n" \
            "${worker_type}" \
            "${base_image}" \
            "${setup_count}" \
            "${install_count}"
    done
    echo ""
}

# Rollback to latest backup
rollback() {
    local latest_backup=$(ls -t "${BACKUP_DIR}" | head -1)

    if [[ -z "${latest_backup}" ]]; then
        log_error "No backups found"
        return 1
    fi

    log_warning "Rolling back to backup: ${latest_backup}"

    for backup_file in "${BACKUP_DIR}/${latest_backup}"/*.json; do
        local worker_type=$(basename "${backup_file}" .json)
        local config_file="${WORKER_CONFIGS_DIR}/${worker_type}/container-config.json"

        if [[ -f "${backup_file}" ]]; then
            cp "${backup_file}" "${config_file}"
            log_info "Restored ${worker_type}"
        fi
    done

    log_success "Rollback completed"
}

# Main execution
main() {
    log_info "BOSS Worker Config Updater"
    log_info "==========================="
    log_info "Image: ${IMAGE_NAME}:${IMAGE_VERSION}"
    log_info "Workers dir: ${WORKER_CONFIGS_DIR}"
    echo ""

    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Install with: brew install jq"
        exit 1
    fi

    # Check if worker configs directory exists
    if [[ ! -d "${WORKER_CONFIGS_DIR}" ]]; then
        log_error "Worker configs directory not found: ${WORKER_CONFIGS_DIR}"
        exit 1
    fi

    # Create backup
    create_backup

    # Update all configs
    local count=0
    for config in "${WORKER_CONFIGS_DIR}"/*/container-config.json; do
        if [[ -f "${config}" ]]; then
            update_config "${config}"
            ((count++))
        fi
    done

    log_success "Updated ${count} worker configurations"

    # Verify
    if verify_configs; then
        show_summary

        if [[ "${DRY_RUN}" != "true" ]]; then
            log_success "\nAll workers updated successfully!"
            log_info "Backup location: ${BACKUP_DIR}/$(ls -t ${BACKUP_DIR} | head -1)"
            log_info "\nTo rollback: $0 --rollback"
        fi
    else
        log_error "Verification failed"
        return 1
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            log_warning "DRY RUN MODE - No changes will be made"
            shift
            ;;
        --rollback)
            rollback
            exit $?
            ;;
        --version)
            IMAGE_VERSION="$2"
            shift 2
            ;;
        --image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run           Show what would be changed without making changes"
            echo "  --rollback          Restore configs from latest backup"
            echo "  --version VERSION   Set image version (default: 1.0.0)"
            echo "  --image IMAGE       Set image name (default: boss/worker-base)"
            echo "  --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                              # Update all configs"
            echo "  $0 --dry-run                    # Preview changes"
            echo "  $0 --version 1.1.0              # Use specific version"
            echo "  $0 --rollback                   # Restore from backup"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main
main
