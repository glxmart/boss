# Spec-Kit Commands

**Spec-Kit is the foundation of our development methodology.** Workers use Spec-Kit commands throughout the development lifecycle. BOSS should understand these commands to coordinate workers effectively.

## Available Spec-Kit Commands

- **`/speckit.constitution`** - Create or update project constitution (used by `architect`)
- **`/speckit.clarify`** - Identify underspecified areas and ask targeted clarification questions (used by `clarifier` and `product-owner`)
- **`/speckit.specify`** - Create or update feature specifications (used by `spec-writer`)
- **`/speckit.plan`** - Generate technical implementation plans (used by `planner`)
- **`/speckit.tasks`** - Break down plans into actionable tasks with [P] parallel markers (used by `planner`)
- **`/speckit.implement`** - Execute implementation following task breakdown (used by `developer-*` workers)
- **`/speckit.checklist`** - Generate requirement quality checklists (used by `spec-writer`, `tester`, `security-engineer`, `technical-writer`)
- **`/speckit.analyze`** - Run project consistency analysis (used by `reviewer`, `code-reviewer`, `consolidator`)

## Spec-Kit Structure

- **Templates**: `.specify/templates/` - Template files for specs, plans, tasks, checklists
- **Scripts**: `.specify/scripts/` - Executable scripts for Spec-Kit commands
- **Memory**: `.specify/memory/constitution.md` - Governing principles (NON-NEGOTIABLE)
- **Specs**: `.specify/specs/[feature-name]/` - Feature specifications, plans, tasks, checklists

## When Workers Use Spec-Kit Commands

- **Phase 1 (Constitution)**: `architect` uses `/speckit.constitution` or follows constitution template
- **Phase 2 (Clarification)**: `clarifier` uses `/speckit.clarify` to identify ambiguities
- **Phase 3 (Specification)**: `spec-writer` uses `/speckit.specify` and `/speckit.checklist`
- **Phase 4 (Planning)**: `planner` uses `/speckit.plan` to generate technical plans
- **Phase 6 (Task Breakdown)**: `planner` uses `/speckit.tasks` to create task breakdown
- **Phase 7 (Implementation)**: `developer-*` workers use `/speckit.implement` or follow TDD manually
- **Phase 5 & 7 (Validation/Review)**: `reviewer` and `code-reviewer` use `/speckit.analyze`
- **Cross-Phase**: `tester`, `security-engineer`, `technical-writer` use `/speckit.checklist` as needed

## BOSS Methodology

This project uses Spec-Kit for specification-driven development with the following phases:

1. **Constitution** - Governing principles (NON-NEGOTIABLE)
2. **Clarification** - Business requirements gathering
3. **Specification** - User stories in Given/When/Then format
4. **Planning** - Technical approach and architecture
5. **Validation** - Constitution compliance check
6. **Task Breakdown** - Granular tasks with [P] parallel markers
7. **Implementation** - TDD + BDD with feature documentation
8. **Consolidation** - Integration and delivery artifacts

