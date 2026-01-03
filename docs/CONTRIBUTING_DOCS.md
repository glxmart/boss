# Documentation Guidelines

> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md)

This guide explains when and where to add documentation in the BOSS project.

---

## Quick Reference: Where to Add Documentation

| Type of Documentation                            | Location                                   | Index to Update              |
| ------------------------------------------------ | ------------------------------------------ | ---------------------------- |
| **High-level architecture or design**            | `/docs/`                                   | `/docs/README.md`            |
| **BOSS CLI usage, commands, or troubleshooting** | `/boss-cli/docs/`                          | `/boss-cli/docs/index.md`    |
| **Conductor MCP architecture or API**            | `/conductor-mcp/docs/`                     | `/conductor-mcp/INDEX.md`    |
| **Development process or planning notes**        | `/docs/` (with PHASE* or PLANNING* prefix) | `/docs/README.md`            |
| **Package-specific README**                      | Package root (e.g., `/boss-cli/README.md`) | No index update needed       |
| **Root project overview**                        | `/README.md`                               | Update `/CLAUDE.md` to match |

---

## Documentation Structure Overview

```
boss/
├── README.md                    # Project overview (update CLAUDE.md to match)
├── CLAUDE.md                    # Claude Code instructions (mirror README links)
├── docs/                        # Core architecture documentation
│   ├── README.md               # Main docs index - UPDATE THIS!
│   ├── BOSS-ENHANCED-VISION.md
│   ├── BOSS-SPEC-KIT-INTEGRATION.md
│   ├── BOSS-CONTAINER-USE-INTEGRATION.md
│   ├── BOSS-GITHUB-INTEGRATION.md
│   ├── BOSS-HOST-SETUP.md
│   ├── DOCKER-SETUP.md
│   ├── PHASE_*.md              # Development milestones
│   └── CONTRIBUTING_DOCS.md    # This file
│
├── boss-cli/
│   ├── README.md               # CLI usage overview
│   └── docs/
│       ├── index.md            # CLI docs index - UPDATE THIS!
│       └── common-issues.md
│
└── conductor-mcp/
    ├── README.md               # MCP overview
    ├── INDEX.md                # Main index - UPDATE THIS!
    ├── CHANGELOG.md            # Version history
    └── docs/
        ├── guides/
        ├── architecture/
        ├── api/
        ├── design/
        └── development/
```

---

## When to Add Documentation

### ✅ Always Create Documentation For:

1. **New Features**
   - If adding a major feature to BOSS CLI → Create doc in `boss-cli/docs/`
   - If adding MCP tools → Update `conductor-mcp/docs/api/TOOLS.md`
   - If changing architecture → Update relevant doc in `/docs/`

2. **New Architectural Patterns**
   - Major system design → `/docs/` (e.g., `BOSS-NEW-PATTERN.md`)
   - Worker patterns → `conductor-mcp/docs/architecture/`
   - CLI patterns → `boss-cli/docs/`

3. **Configuration Changes**
   - MCP configuration → Update `conductor-mcp/docs/guides/INSTALLATION.md`
   - CLI configuration → Update `boss-cli/README.md`
   - Docker setup → Update `/docs/DOCKER-SETUP.md`

4. **Troubleshooting Information**
   - CLI issues → `boss-cli/docs/common-issues.md`
   - MCP issues → `conductor-mcp/docs/guides/INSTALLATION.md`
   - General setup → `/docs/BOSS-HOST-SETUP.md`

5. **API Changes**
   - New MCP tools → `conductor-mcp/docs/api/TOOLS.md`
   - New error types → `conductor-mcp/docs/api/ERRORS.md`
   - Worker config schema → `conductor-mcp/docs/architecture/WORKER-CONFIG.md`

### ⚠️ Consider Documentation For:

1. **Bug Fixes** - If the fix reveals a common misunderstanding
2. **Performance Optimizations** - If they change usage patterns
3. **Refactoring** - If it affects how users/contributors interact with code
4. **Dependencies** - If adding/removing major dependencies

### ❌ Don't Create Separate Documentation For:

1. **Code Comments** - Use inline comments instead
2. **Obvious Changes** - Self-explanatory code changes
3. **Internal Implementation Details** - Unless they affect architecture
4. **Temporary Solutions** - Mark with TODO comments instead

---

## How to Add Documentation

### Step 1: Choose the Right Location

Use the table at the top to determine where your documentation belongs.

### Step 2: Create the Document

Follow this template structure:

```markdown
# [Title]

[Brief description]

> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md) | [Other relevant links]

---

## Overview

[What this document covers]

## [Main Content Sections]

...

## Related Documentation

- [Link to related docs]

---

**Questions or issues?**

See [main documentation](./README.md) or open a GitHub issue.
```

### Step 3: Add Navigation Links

Add a navigation breadcrumb at the top (see the `> **📖 Documentation:**` line above).

Include links to:

- Local index (e.g., `./README.md` or `./index.md`)
- Root README (`../README.md` or `../../README.md`)
- Related documentation

### Step 4: Update All Relevant Indexes

**CRITICAL:** You must update ALL of these:

#### For /docs/ Documents:

- [ ] `/docs/README.md` - Add to appropriate section
- [ ] `/README.md` - Add to Documentation Structure section
- [ ] `/CLAUDE.md` - Add to Documentation Structure section (mirror README)

#### For boss-cli/docs/ Documents:

- [ ] `/boss-cli/docs/index.md` - Add to appropriate section
- [ ] `/boss-cli/README.md` - Add reference if it's a major doc

#### For conductor-mcp/docs/ Documents:

- [ ] `/conductor-mcp/INDEX.md` - Add to appropriate section
- [ ] `/conductor-mcp/docs/` subdirectory - Add to subsection if applicable
- [ ] `/conductor-mcp/README.md` - Add reference if it's a major doc

### Step 5: Add Cross-Links

Update related documents to link to your new documentation:

1. **Find related docs** - Which existing docs should reference this?
2. **Add contextual links** - Add links where readers would naturally look
3. **Update "Related Documentation" sections** - Add mutual links

---

## Index Files to Always Update

When adding documentation, **always** update these index files:

### Primary Indexes

| Index File                | Purpose                | When to Update                        |
| ------------------------- | ---------------------- | ------------------------------------- |
| `/docs/README.md`         | Main documentation hub | Any new doc in `/docs/`               |
| `/boss-cli/docs/index.md` | CLI documentation hub  | Any new doc in `/boss-cli/docs/`      |
| `/conductor-mcp/INDEX.md` | MCP documentation hub  | Any new doc in `/conductor-mcp/docs/` |

### Secondary Indexes

| Index File                 | Purpose                  | When to Update                           |
| -------------------------- | ------------------------ | ---------------------------------------- |
| `/README.md`               | Project overview         | Major docs in `/docs/`                   |
| `/CLAUDE.md`               | Claude Code instructions | When `/README.md` changes (keep in sync) |
| `/boss-cli/README.md`      | CLI usage                | Major CLI docs                           |
| `/conductor-mcp/README.md` | MCP overview             | Major MCP docs                           |

---

## Documentation Checklist

Use this checklist when adding documentation:

```markdown
- [ ] Created document in correct location
- [ ] Added navigation breadcrumb at top
- [ ] Included clear overview section
- [ ] Added related documentation links
- [ ] Updated primary index (/docs/README.md, /boss-cli/docs/index.md, or /conductor-mcp/INDEX.md)
- [ ] Updated /README.md (if major doc in /docs/)
- [ ] Updated /CLAUDE.md (if updated /README.md)
- [ ] Added cross-links in related documents
- [ ] Verified all links work
```

---

## Examples

### Example 1: Adding a New Architecture Document

**Goal:** Document a new worker orchestration pattern

**Steps:**

1. Create `/docs/BOSS-WORKER-PATTERN.md`
2. Add navigation: `> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md) | [BOSS Vision](./BOSS-ENHANCED-VISION.md)`
3. Update `/docs/README.md` - Add to "Core Documentation" section
4. Update `/README.md` - Add to "Documentation Structure" section
5. Update `/CLAUDE.md` - Mirror the change from `/README.md`
6. Update related docs:
   - Add link in `BOSS-ENHANCED-VISION.md`
   - Add link in `conductor-mcp/docs/architecture/OVERVIEW.md`

### Example 2: Adding CLI Troubleshooting

**Goal:** Document a common CLI issue

**Steps:**

1. Add section to `/boss-cli/docs/common-issues.md` (existing file)
2. Update `/boss-cli/docs/index.md` - Ensure common-issues.md is listed
3. If significant, mention in `/boss-cli/README.md` troubleshooting section

### Example 3: Adding MCP API Documentation

**Goal:** Document a new MCP tool

**Steps:**

1. Add section to `/conductor-mcp/docs/api/TOOLS.md` (existing file)
2. Update `/conductor-mcp/INDEX.md` - Ensure TOOLS.md is listed
3. Update `/conductor-mcp/docs/guides/BOSS-GUIDE.md` - Add usage example
4. Update `/docs/README.md` - Update description if needed

---

## Common Mistakes to Avoid

### ❌ Don't:

- Create documentation without updating indexes
- Add docs to wrong location (e.g., CLI docs in root /docs/)
- Forget to add navigation breadcrumbs
- Skip cross-linking to related docs
- Update /README.md without updating /CLAUDE.md
- Create orphan docs with no links from anywhere

### ✅ Do:

- Always update all relevant indexes
- Follow the location guidelines
- Add navigation at the top of every doc
- Cross-link related documentation
- Keep /README.md and /CLAUDE.md in sync
- Verify all links work

---

## Documentation Maintenance

### When Reorganizing Docs:

1. **Update all links** - Use find/replace to update references
2. **Update all indexes** - Ensure paths are correct
3. **Test all links** - Verify nothing is broken
4. **Update breadcrumbs** - Ensure navigation still works

### When Deleting Docs:

1. **Remove from all indexes**
2. **Remove cross-links** from other docs
3. **Check for orphaned references**
4. **Update /README.md and /CLAUDE.md**

---

## Questions or Issues?

- **Where should this doc go?** - Check the table at the top
- **Which indexes to update?** - See "Index Files to Always Update"
- **How to structure the doc?** - Follow the template in "How to Add Documentation"
- **Still unclear?** - Open a GitHub issue or ask in discussions

---

**Remember:** Good documentation is always cross-linked and indexed!
