# BOSS + GitHub Integration

## How BOSS Leverages GitHub for Project Management and Human Oversight

This document details how BOSS (Business-Orchestrated Software System) uses **GitHub** as its project management system, enabling human oversight through pull requests, issues, and project boards - no additional infrastructure required.

---

## Why GitHub for BOSS Project Management?

### The Problem with Traditional Project Management Tools

Traditional PM tools (Jira, Plane, Linear) require:
- ❌ Separate infrastructure to maintain
- ❌ Context switching between code and tasks
- ❌ Manual synchronization with git workflows
- ❌ Additional authentication and access control

### The GitHub Solution

GitHub provides everything BOSS needs for human oversight:
- ✅ **Pull Requests** → Natural approval gates for specs, plans, and implementations
- ✅ **PR Reviews** → Human feedback mechanism with inline comments
- ✅ **Issues** → Task tracking and prioritization
- ✅ **Projects** → Visual workflow boards
- ✅ **Discussions** → Clarifications and architectural decisions
- ✅ **Already integrated** → GitHub MCP required for code anyway
- ✅ **Zero additional infrastructure** → No Docker containers to maintain

---

## BOSS + GitHub Architecture

### How BOSS Uses GitHub MCP

```
┌─────────────────────────────────────────────────────────┐
│  Claude Code/Cursor (BOSS Configuration)                │
│                                                         │
│  • BOSS skills (orchestration logic)                    │
│  • GitHub MCP ← Project management via this             │
│  • Container-Use MCP (spawn workers)                    │
│  • Knowledge Base MCP (context)                         │
│  • 1Password CLI (op) - secret setup when requested     │
└────────────┬────────────────────────────────────────────┘
             │
             │ GitHub MCP Operations:
             │ • createPullRequest()
             │ • getPullRequestReviews()
             │ • getPullRequestComments()
             │ • createIssue()
             │ • updateProjectBoard()
             │ • getDiscussions()
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Repository                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Pull Requests (Approval Gates)                         │
│  ├─► Draft PR: Spec Review                             │
│  ├─► Draft PR: Planning Review                         │
│  └─► Implementation PRs (one per worker)                │
│                                                         │
│  Issues (Task Tracking)                                 │
│  ├─► Issue #1: User Authentication Feature              │
│  ├─► Issue #2: Payment Integration                     │
│  └─► Issue #3: Dashboard UI                            │
│                                                         │
│  Projects (Workflow Visualization)                      │
│  ├─► Column: Backlog                                   │
│  ├─► Column: Specification                             │
│  ├─► Column: Planning                                  │
│  ├─► Column: Implementation                            │
│  └─► Column: Review & Done                             │
│                                                         │
│  Discussions (Decisions & Clarifications)               │
│  └─► Architecture decisions, tech stack choices         │
└─────────────────────────────────────────────────────────┘
```

---

## Bootstrap with GitHub Integration

### What Happens During Bootstrap

When you run `boss bootstrap`, BOSS creates both local structure AND GitHub setup:

```bash
boss bootstrap --template nextjs-app-turbo --github your-org/your-repo

# BOSS executes:
# 1. Local repository initialization
# 2. GitHub repository creation (if doesn't exist)
# 3. Initial commit with BOSS structure
# 4. GitHub Project board creation
# 5. Initial issues creation
# 6. Welcome PR with project overview
```

### Step-by-Step Bootstrap Process

#### 1. Local Repository Setup

```bash
# BOSS creates local structure
.
├── .boss/
│   ├── workflows/           # BOSS workflow definitions
│   ├── workers/             # Worker configurations
│   └── state/               # Workflow state tracking
│
├── .specify/
│   ├── memory/
│   │   └── constitution.md  # Project governing principles
│   ├── specs/               # Feature specifications (empty)
│   └── templates/           # Spec-Kit templates
│
├── .github/
│   ├── workflows/
│   │   ├── boss-ci.yml      # CI/CD for BOSS-generated code
│   │   └── boss-gates.yml   # Quality gate automation
│   └── CODEOWNERS           # Auto-assign reviews
│
├── src/                     # Template-specific code
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

#### 2. GitHub Repository Creation

```typescript
// BOSS uses GitHub MCP to create repo

const repo = await mcp.github.createRepository({
  name: "your-repo",
  description: "Project bootstrapped by BOSS",
  private: true,
  auto_init: false,  // BOSS handles initialization
  has_issues: true,
  has_projects: true,
  has_wiki: false
});

// Push initial commit
await mcp.github.pushCommit({
  repo: repo.full_name,
  branch: "main",
  message: "chore: BOSS bootstrap - initial project structure",
  files: [
    /* all bootstrapped files */
  ]
});
```

#### 3. Project Board Creation

```typescript
// Create GitHub Project (Beta) for workflow tracking

const project = await mcp.github.createProject({
  repo: repo.full_name,
  name: "BOSS Workflow",
  body: "Automated workflow tracking for BOSS-orchestrated development",
  template: "automated-kanban-v2"
});

// Create custom columns matching BOSS phases
await mcp.github.createProjectColumns(project.id, [
  { name: "📋 Backlog", automation: "to do" },
  { name: "📝 Specification", automation: null },
  { name: "🎯 Planning", automation: null },
  { name: "⚙️ Implementation", automation: "in progress" },
  { name: "👀 Review", automation: "in review" },
  { name: "✅ Done", automation: "done" }
]);
```

#### 4. Initial Issues Creation

```typescript
// Create welcome issue with project overview

await mcp.github.createIssue({
  repo: repo.full_name,
  title: "🎉 Project Initialized by BOSS",
  body: `
# Welcome to Your BOSS-Orchestrated Project!

This project has been bootstrapped with the **BOSS** (Business-Orchestrated Software System) framework.

## What's Included

- ✅ **Spec-Kit** structure for specification-driven development
- ✅ **BOSS workflows** for autonomous AI agent orchestration
- ✅ **Quality gates** enforcing 80%+ coverage and TDD
- ✅ **GitHub integration** for project management and human oversight

## Next Steps

1. **Define your first feature:**
   \`\`\`bash
   # Tell BOSS what to build
   "I want to build a user authentication system with email and password"
   \`\`\`

2. **BOSS will:**
   - Create a specification PR for your review
   - Wait for your approval
   - Plan the implementation
   - Spawn workers to build it
   - Create implementation PRs for your review

3. **You manage via GitHub:**
   - Review and approve specs in PRs
   - Provide feedback via PR comments
   - Track progress on the Project board
   - Prioritize features with issue labels

## Project Structure

- \`.boss/\` - BOSS orchestration configuration
- \`.specify/\` - Spec-Kit artifacts (specs, plans, tasks)
- \`.github/\` - CI/CD and quality gates

## Resources

- [BOSS Documentation](../BOSS-ENHANCED-VISION.md)
- [Spec-Kit Integration](../BOSS-SPEC-KIT-INTEGRATION.md)
- [GitHub Integration](../BOSS-GITHUB-INTEGRATION.md)

---

🤖 This project is managed by BOSS. Approve PRs to advance the workflow.
  `,
  labels: ["boss-info", "good-first-issue"]
});

// Create template issue for feature requests
await mcp.github.createIssue({
  repo: repo.full_name,
  title: "Feature Request Template",
  body: `
# Feature Request Template

Use this template to request new features from BOSS.

## Feature Description

[Describe what you want to build in plain business terms]

## User Stories

[Optional: Provide user stories if you have them]
- As a [user type], I want to [action] so that [benefit]

## Success Criteria

[How will we know this feature is complete?]

## Priority

- [ ] P0 - Critical
- [ ] P1 - High
- [ ] P2 - Medium
- [ ] P3 - Low

---

After creating this issue, BOSS will:
1. Create a specification PR
2. Ask clarifying questions if needed
3. Wait for your approval to proceed
  `,
  labels: ["boss-template"]
});
```

#### 5. Welcome PR Creation

```typescript
// Create initial PR introducing the project structure

await mcp.github.createPullRequest({
  repo: repo.full_name,
  title: "🎉 BOSS Bootstrap - Project Structure",
  body: `
# Project Bootstrap Complete!

This PR contains the initial BOSS project structure.

## What's Included

### BOSS Orchestration (\`.boss/\`)
- Worker configurations for different development roles
- Workflow definitions for the 8-phase Spec-Kit process
- State management for resumable workflows

### Spec-Kit Structure (\`.specify/\`)
- **constitution.md** - Project governing principles (customize this!)
- Templates for specs, plans, and tasks
- Scripts for Spec-Kit automation

### Quality Gates (\`.github/workflows/\`)
- **boss-ci.yml** - Automated testing, linting, type checking
- **boss-gates.yml** - Coverage and mutation testing requirements

### Application Code (\`src/\`)
Based on template: **${template}**

${templateSpecificDetails}

## Next Steps

1. **Review and customize** \`.specify/memory/constitution.md\`
   - Set your project's architectural principles
   - Define coding standards
   - Specify testing requirements

2. **Merge this PR** to accept the project structure

3. **Start building features:**
   - Create an issue describing what you want
   - BOSS will create a spec PR for your review
   - Approve the spec → BOSS builds it

## Template Details

**Template:** ${template}
**Quality Preset:** ${qualityPreset}
**Tech Stack:**
${techStack.map(t => `- ${t}`).join('\n')}

---

🤖 Generated by BOSS | [Learn More](../README.md)
  `,
  head: "boss/bootstrap",
  base: "main",
  draft: false,
  labels: ["boss-bootstrap"]
});
```

#### 6. User Feedback via GitHub

After bootstrap completes, user sees:

```
✅ BOSS Bootstrap Complete!

Repository: https://github.com/your-org/your-repo
├─► Project board created: https://github.com/your-org/your-repo/projects/1
├─► Welcome issue: https://github.com/your-org/your-repo/issues/1
└─► Bootstrap PR: https://github.com/your-org/your-repo/pull/1

Next steps:
1. Review and merge the bootstrap PR
2. Customize .specify/memory/constitution.md
3. Create your first feature request:

   You: "Build a user authentication system"

   BOSS will create a specification PR for your review.
```

---

## BOSS Workflow with GitHub

### Phase 0: Constitution

**Human edits `.specify/memory/constitution.md` to set project principles:**

```markdown
# Project Constitution

## Architectural Principles
- API-first design with OpenAPI contracts
- Microservices architecture with clear boundaries
- Event-driven communication via message queues

## Development Methodology
- Test-First (NON-NEGOTIABLE)
- Minimum 80% code coverage
- Mutation testing score ≥ 80%

## Technology Stack
Allowed: [nextjs, typescript, prisma, postgresql, redis]
Prohibited: [javascript, mongodb, class-based-components]

## Security Requirements
- All secrets via 1Password (op:// references)
- No credentials in code or environment files
- Rate limiting on all public APIs
```

Commit and push:
```bash
git add .specify/memory/constitution.md
git commit -m "chore: customize project constitution"
git push
```

---

### Phase 1: Feature Request → Specification (GATE 1)

#### Step 1: User Creates Feature Request

```markdown
# Create GitHub Issue

Title: User Authentication System

Body:
I want users to be able to register, log in, and reset passwords.

Requirements:
- Email and password authentication
- JWT tokens for session management
- Password reset via email
- Rate limiting to prevent brute force

Priority: P0
```

#### Step 2: BOSS Creates Specification PR

```typescript
// BOSS detects new issue via GitHub MCP

const issues = await mcp.github.listIssues({
  repo: repo.full_name,
  labels: ["feature-request"],
  state: "open"
});

// BOSS spawns Clarifier worker to gather details
const clarifier = await mcp.containerUse.createEnvironment({
  title: "clarifier-issue-1",
  config: ".boss/workers/clarifier/container-config.json"
});

await mcp.containerUse.executeInEnvironment({
  env_id: clarifier.env_id,
  prompt: `
Analyze this feature request and create detailed user stories.

Feature Request:
${issue.body}

Create .specify/specs/001-auth/spec.md with:
- User stories in Given/When/Then format
- Acceptance criteria
- Edge cases and error scenarios
- Security considerations
  `
});

// BOSS creates spec PR
const specPR = await mcp.github.createPullRequest({
  repo: repo.full_name,
  title: "[BOSS Spec] User Authentication System",
  body: `
## Specification Review Required

This PR contains the specification for: **User Authentication System**

Related Issue: #${issue.number}

### What's Included
- \`.specify/specs/001-auth/spec.md\` - User stories and acceptance criteria

### User Stories

1. **User Registration**
   - Given: I am a new user
   - When: I provide email and password
   - Then: Account is created and I receive confirmation email

2. **User Login**
   - Given: I am a registered user
   - When: I provide correct credentials
   - Then: I receive a JWT token for authenticated requests

3. **Password Reset**
   - Given: I forgot my password
   - When: I request password reset
   - Then: I receive reset link via email

### Acceptance Criteria
- ✅ Passwords hashed with bcrypt (cost factor 12)
- ✅ JWT tokens expire after 24 hours
- ✅ Rate limiting: 5 attempts per minute per IP
- ✅ Email verification required before login
- ✅ Password strength requirements enforced

### Security Considerations
- OWASP compliance for authentication
- Protection against timing attacks
- Secure password reset token generation
- Rate limiting to prevent brute force

---

## 🚦 GATE 1: Human Approval Required

**Please review this specification and:**

1. **Add comments** if anything is unclear or missing
2. **Request changes** if requirements are incorrect
3. **Approve this PR** when specification is satisfactory

After approval, BOSS will:
- Create technical planning documents
- Break work into parallelizable tasks
- Wait for your planning approval before implementation

---

🤖 Generated by BOSS Clarifier Worker | Environment: ${clarifier.env_id}
  `,
  head: "boss/spec-001-auth",
  base: "main",
  draft: true,  // Draft until human approves
  labels: ["boss-spec", "needs-review"],
  assignees: [repo.owner]  // Auto-assign to repo owner
});

// Link PR to issue
await mcp.github.createIssueComment({
  repo: repo.full_name,
  issue_number: issue.number,
  body: `
📝 Specification PR created: #${specPR.number}

Please review and approve the specification before BOSS proceeds with planning.
  `
});

// Update project board
await mcp.github.moveProjectCard({
  project_id: project.id,
  issue_id: issue.id,
  column: "📝 Specification"
});
```

#### Step 3: Human Reviews Specification

**User reviews in GitHub PR:**

```markdown
# PR Review Comments by Human

File: .specify/specs/001-auth/spec.md
Line: 45

> Comment:
> We also need social login (Google, GitHub). Can you add that to the spec?

---

File: .specify/specs/001-auth/spec.md
Line: 78

> Comment:
> Rate limiting should be 10 attempts, not 5. We have users on flaky connections.

---

# PR Review Decision: Request Changes
```

#### Step 4: BOSS Incorporates Feedback

```typescript
// BOSS monitors PR reviews via GitHub MCP

const reviews = await mcp.github.getPullRequestReviews({
  repo: repo.full_name,
  pull_number: specPR.number
});

const latestReview = reviews[reviews.length - 1];

if (latestReview.state === "CHANGES_REQUESTED") {
  // Get review comments
  const comments = await mcp.github.getPullRequestComments({
    repo: repo.full_name,
    pull_number: specPR.number
  });

  // BOSS updates spec based on feedback
  await mcp.containerUse.executeInEnvironment({
    env_id: clarifier.env_id,
    prompt: `
Update the specification based on this feedback:

${comments.map(c => `- ${c.body}`).join('\n')}

Specifically:
1. Add social login (Google, GitHub OAuth)
2. Change rate limiting from 5 to 10 attempts per minute
    `
  });

  // BOSS updates PR
  await mcp.github.updatePullRequest({
    pull_number: specPR.number,
    body: `
${specPR.body}

---

## 🔄 Updated Based on Feedback

Changes made:
- ✅ Added social login (Google, GitHub OAuth) user stories
- ✅ Updated rate limiting to 10 attempts per minute
- ✅ Added OAuth token management requirements

Please review the updated specification.
    `
  });

  // Request re-review
  await mcp.github.requestReview({
    pull_number: specPR.number,
    reviewers: [repo.owner]
  });
}
```

#### Step 5: Human Approves Specification

```markdown
# PR Review by Human

✅ Approved

Comment:
Looks great! The social login addition is perfect.
Proceed with planning.
```

---

### Phase 2: Planning (GATE 2)

#### BOSS Creates Planning Documents

```typescript
// BOSS detects approval via GitHub MCP

if (latestReview.state === "APPROVED") {
  // Spawn Planner worker
  const planner = await mcp.containerUse.createEnvironment({
    title: "planner-spec-001-auth",
    config: ".boss/workers/planner/container-config.json"
  });

  // Query knowledge base for relevant patterns
  const context = await mcp.knowledgeBase.search({
    query: "authentication OAuth JWT patterns",
    filters: { tech_stack: ["nodejs", "typescript", "oauth"] }
  });

  await mcp.containerUse.executeInEnvironment({
    env_id: planner.env_id,
    prompt: `
Create technical planning documents for User Authentication.

Specification: [link to spec.md]

Knowledge Base Context:
${context}

Create:
1. .specify/specs/001-auth/plan.md - Technical approach
2. .specify/specs/001-auth/data-model.md - Database schema
3. .specify/specs/001-auth/contracts/auth-api.yaml - OpenAPI spec
4. .specify/specs/001-auth/tasks.md - Task breakdown with [P] markers

Use patterns from knowledge base where applicable.
Identify all secrets needed (mark in tasks.md).
    `
  });

  // BOSS adds planning docs to same PR
  await mcp.github.updatePullRequestFiles({
    pull_number: specPR.number,
    files: [
      ".specify/specs/001-auth/plan.md",
      ".specify/specs/001-auth/data-model.md",
      ".specify/specs/001-auth/contracts/auth-api.yaml",
      ".specify/specs/001-auth/tasks.md"
    ]
  });

  await mcp.github.updatePullRequest({
    pull_number: specPR.number,
    body: `
${specPR.body}

---

## 🎯 Planning Documents Added

BOSS has created the technical plan:

### Technical Approach (\`plan.md\`)
- JWT-based session management
- OAuth 2.0 integration (Google, GitHub)
- bcrypt password hashing (cost: 12)
- Redis for token blacklisting
- SendGrid for email delivery

### Database Schema (\`data-model.md\`)
- \`users\` table with email, hashed password, verification status
- \`oauth_tokens\` table for social login
- \`password_reset_tokens\` table with expiry

### API Contracts (\`contracts/auth-api.yaml\`)
- OpenAPI 3.0 specification
- Endpoints: POST /auth/register, /auth/login, /auth/reset, /auth/oauth

### Task Breakdown (\`tasks.md\`)
- 12 tasks identified
- 8 can run in parallel (marked with [P])
- Estimated: 3-4 hours with 5 workers

### Secrets Required
- SENDGRID_API_KEY (email delivery)
- JWT_SECRET (token signing)
- GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
- GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET

---

## 🚦 GATE 2: Planning Approval Required

**Please review the technical plan and:**

1. **Comment** if you want different technology choices
2. **Request changes** if architecture needs adjustment
3. **Approve** when planning is satisfactory

After approval, BOSS will:
- Spawn 5 parallel workers for implementation
- Each worker creates a separate PR
- Workers follow TDD (tests before implementation)
- Quality gates enforce 80%+ coverage

---

🤖 Generated by BOSS Planner Worker | Environment: ${planner.env_id}
    `
  });

  // Request planning review
  await mcp.github.requestReview({
    pull_number: specPR.number,
    reviewers: [repo.owner]
  });

  // Update project board
  await mcp.github.moveProjectCard({
    project_id: project.id,
    issue_id: issue.id,
    column: "🎯 Planning"
  });
}
```

#### Human Reviews Planning

```markdown
# PR Review Comments

File: .specify/specs/001-auth/plan.md
Line: 23

> Comment:
> Instead of Redis for token blacklisting, use PostgreSQL with a tokens table.
> We want to minimize infrastructure dependencies.

---

# PR Review Decision: Request Changes
```

#### BOSS Updates Plan

```typescript
// BOSS updates plan based on feedback

await mcp.containerUse.executeInEnvironment({
  env_id: planner.env_id,
  prompt: `
Update plan.md and data-model.md:
- Replace Redis token blacklisting with PostgreSQL tokens table
- Update technical approach section
- Add tokens table to data-model.md
  `
});

// Update PR
await mcp.github.updatePullRequest({
  pull_number: specPR.number,
  body: `
${specPR.body}

---

## 🔄 Plan Updated Based on Feedback

Changes:
- ✅ Replaced Redis with PostgreSQL tokens table
- ✅ Updated data model with blacklisted_tokens table
- ✅ Simplified infrastructure (PostgreSQL only)

No external cache needed - simpler deployment.
  `
});
```

#### Human Approves Planning

```markdown
# PR Review

✅ Approved

Comment:
Perfect! The PostgreSQL-only approach is much cleaner.
Ready for implementation.
```

---

### Phase 3: Implementation (GATE 3)

#### BOSS Spawns Workers

```typescript
// BOSS detects planning approval

if (latestReview.state === "APPROVED") {
  // Parse tasks.md to find parallelizable tasks
  const tasks = parseTasks(".specify/specs/001-auth/tasks.md");

  // Group tasks by [P] markers
  const parallelGroups = groupParallelTasks(tasks);

  // Spawn workers for first parallel group
  const workers = [];

  for (const task of parallelGroups[0]) {
    const worker = await mcp.containerUse.createEnvironment({
      title: `developer-${task.id}`,
      config: `.boss/workers/${task.workerType}/container-config.json`
    });

    // Get knowledge base context for this task
    const context = await mcp.knowledgeBase.search({
      query: task.description,
      filters: { tech_stack: ["nodejs", "typescript"] }
    });

    // Execute worker
    await mcp.containerUse.executeInEnvironment({
      env_id: worker.env_id,
      prompt: `
# ${task.userStory}

${context}  // Relevant patterns from knowledge base

## Your Task
${task.description}

## Constitution
${constitution}  // Project-specific rules

## Quality Gates
- Tests BEFORE implementation (TDD)
- Coverage ≥ 80%
- All TypeScript checks pass
- Integration tests with real APIs (test mode)

## Available Secrets
${task.secrets.map(s => `- ${s}`).join('\n')}

## Related Files
${task.files.map(f => `- ${f}`).join('\n')}
      `,
      skills: task.requiredSkills,
      max_iterations: 50
    });

    workers.push({ ...worker, task });
  }

  // Create implementation PR for each worker
  for (const worker of workers) {
    const implPR = await mcp.github.createPullRequest({
      repo: repo.full_name,
      title: `[BOSS] ${worker.task.userStory}`,
      body: `
## Implementation: ${worker.task.userStory}

**Specification:** #${specPR.number}
**Worker Type:** ${worker.task.workerType}
**Environment:** ${worker.env_id}
**Branch:** ${worker.branch}

### Task Details

${worker.task.description}

### Files Changed

This PR implements:
${worker.task.files.map(f => `- \`${f}\``).join('\n')}

### Testing

- ✅ Unit tests written FIRST (TDD)
- ✅ Integration tests with real APIs (test mode)
- ✅ Coverage: [will be updated by worker]
- ✅ All TypeScript checks passing

### Quality Gates

Worker will run:
- TypeScript compilation
- ESLint + Prettier
- Vitest (unit + integration)
- Coverage report (target: ≥80%)

---

## 🤖 Auto-generated by BOSS

This PR is created by a BOSS worker running in an isolated container-use environment.

**Environment:** ${worker.env_id}
**Worker Config:** ${worker.task.workerType}

The worker follows TDD methodology and will update this PR with test results.

---

**Please review and provide feedback via PR comments.**
BOSS will pass your feedback to the worker for iteration.
      `,
      head: worker.branch,
      base: "main",
      draft: true,  // Draft until worker completes
      labels: ["boss-implementation", worker.task.workerType, worker.task.userStory],
      assignees: [repo.owner]
    });

    worker.pr = implPR;
  }

  // Update project board
  await mcp.github.moveProjectCard({
    project_id: project.id,
    issue_id: issue.id,
    column: "⚙️ Implementation"
  });

  // Comment on spec PR
  await mcp.github.createPullRequestComment({
    pull_number: specPR.number,
    body: `
## 🚀 Implementation Started

BOSS has spawned ${workers.length} workers for parallel implementation:

${workers.map((w, i) => `
${i + 1}. **${w.task.userStory}** - PR #${w.pr.number}
   - Worker: ${w.task.workerType}
   - Environment: ${w.env_id}
`).join('\n')}

Each worker is implementing with TDD and will create tests before code.

Track progress on individual PRs above.
    `
  });

  // Mark spec PR as ready for review (no longer draft)
  await mcp.github.updatePullRequest({
    pull_number: specPR.number,
    draft: false
  });
}
```

#### Worker Completes and Updates PR

```typescript
// Worker completes implementation

// Run quality gates
const qualityGates = await mcp.containerUse.getQualityGateResults({
  env_id: worker.env_id
});

if (qualityGates.allPassed) {
  // Update implementation PR with results
  await mcp.github.updatePullRequest({
    pull_number: worker.pr.number,
    body: `
${worker.pr.body}

---

## ✅ Implementation Complete

### Quality Gate Results

- ✅ **TypeScript:** 0 errors
- ✅ **ESLint:** 0 warnings
- ✅ **Tests:** ${qualityGates.tests.passed}/${qualityGates.tests.total} passing
- ✅ **Coverage:** ${qualityGates.coverage}% (required: ≥80%)
- ✅ **Mutation Score:** ${qualityGates.mutationScore}% (required: ≥80%)

### Test Summary

\`\`\`
Unit Tests:        ${qualityGates.tests.unit} passing
Integration Tests: ${qualityGates.tests.integration} passing
Total:            ${qualityGates.tests.total} passing
\`\`\`

### Coverage by File

${qualityGates.coverageByFile.map(f => `
- \`${f.file}\`: ${f.coverage}%
`).join('\n')}

---

## 🚦 Ready for Review

This implementation:
- ✅ Follows TDD (tests written first)
- ✅ Passes all quality gates
- ✅ Adheres to project constitution
- ✅ Includes integration tests

**Please review and approve to merge.**
    `,
    draft: false  // Remove draft status
  });

  // Request review
  await mcp.github.requestReview({
    pull_number: worker.pr.number,
    reviewers: [repo.owner]
  });

  // Move to review column
  await mcp.github.moveProjectCard({
    project_id: project.id,
    card_id: worker.pr.id,
    column: "👀 Review"
  });
}
```

#### Human Reviews Implementation

```markdown
# PR Review on Implementation PR

File: src/auth/register.ts
Line: 34

> Comment:
> Good implementation! But we should also validate email format
> server-side, not just rely on client validation.

---

File: tests/auth/register.test.ts
Line: 56

> Comment:
> Add a test for duplicate email registration -
> should return 409 Conflict.

---

# PR Review Decision: Request Changes
```

#### BOSS Passes Feedback to Worker

```typescript
// BOSS monitors implementation PR for feedback

const comments = await mcp.github.getPullRequestComments({
  pull_number: worker.pr.number
});

const reviews = await mcp.github.getPullRequestReviews({
  pull_number: worker.pr.number
});

const latestReview = reviews[reviews.length - 1];

if (latestReview.state === "CHANGES_REQUESTED") {
  // BOSS passes feedback to worker
  await mcp.containerUse.executeInEnvironment({
    env_id: worker.env_id,
    prompt: `
## Human Feedback from PR Review

Please address the following feedback:

${comments.map((c, i) => `
${i + 1}. **${c.path}:${c.line}**
   ${c.body}
`).join('\n')}

Update your implementation to address all feedback points.
Re-run tests after changes.
    `
  });

  // Worker updates implementation
  // Re-runs quality gates
  // Updates PR

  await mcp.github.updatePullRequest({
    pull_number: worker.pr.number,
    body: `
${worker.pr.body}

---

## 🔄 Updated Based on Feedback

Changes made:
- ✅ Added server-side email format validation
- ✅ Added test for duplicate email (409 Conflict response)
- ✅ Re-ran all tests - still passing

All quality gates still passing. Ready for re-review.
    `
  });

  // Request re-review
  await mcp.github.requestReview({
    pull_number: worker.pr.number,
    reviewers: [repo.owner]
  });
}
```

#### Human Approves and Merges

```markdown
# PR Review

✅ Approved

Comment:
Perfect! Email validation looks good and the test coverage is excellent.
```

```typescript
// BOSS detects approval and merges

if (latestReview.state === "APPROVED") {
  // Merge via GitHub MCP
  await mcp.github.mergePullRequest({
    pull_number: worker.pr.number,
    merge_method: "squash",
    commit_message: `feat: ${worker.task.userStory}\n\n${worker.task.description}`
  });

  // Delete worker environment
  await mcp.containerUse.deleteEnvironment({
    env_id: worker.env_id
  });

  // Move to Done column
  await mcp.github.moveProjectCard({
    project_id: project.id,
    card_id: worker.pr.id,
    column: "✅ Done"
  });

  // Comment on spec PR with progress
  await mcp.github.createPullRequestComment({
    pull_number: specPR.number,
    body: `
✅ **${worker.task.userStory}** completed and merged!

PR #${worker.pr.number} has been approved and merged.

Progress: ${completedTasks.length}/${totalTasks.length} tasks complete
    `
  });
}
```

---

### Phase 4: Consolidation

When all implementation PRs are merged:

```typescript
// BOSS spawns Consolidator worker

const consolidator = await mcp.containerUse.createEnvironment({
  title: "consolidator-spec-001",
  config: ".boss/workers/consolidator/container-config.json"
});

await mcp.containerUse.executeInEnvironment({
  env_id: consolidator.env_id,
  prompt: `
All implementation PRs for User Authentication have been merged.

Create consolidation artifacts:

1. .specify/specs/001-auth/quickstart.md
   - How to set up authentication in the app
   - How to test it locally
   - Required secrets configuration

2. .specify/specs/001-auth/checklist.md
   - Final validation checklist
   - Deployment readiness checks

3. Run integration tests across all auth features
   - Register flow
   - Login flow (email + OAuth)
   - Password reset flow
   - Token validation

4. Update main README.md with auth documentation
  `
});

// Create consolidation PR
const consolidationPR = await mcp.github.createPullRequest({
  repo: repo.full_name,
  title: "[BOSS] User Authentication - Final Integration",
  body: `
## Feature Complete: User Authentication

All implementation PRs have been merged. This PR adds:

### Documentation
- \`.specify/specs/001-auth/quickstart.md\` - Setup guide
- \`.specify/specs/001-auth/checklist.md\` - Deployment checklist
- \`README.md\` - Updated with authentication docs

### Integration Testing
- ✅ Full registration flow tested
- ✅ Email + OAuth login flows tested
- ✅ Password reset flow tested
- ✅ Token validation tested

### Deployment Checklist
- [ ] Set SENDGRID_API_KEY in production
- [ ] Set JWT_SECRET in production
- [ ] Configure Google OAuth credentials
- [ ] Configure GitHub OAuth credentials
- [ ] Run database migrations
- [ ] Test email delivery in production

---

## 🎉 Ready for Production

After merging this PR, the User Authentication feature is ready to deploy.

Related:
- Specification: #${specPR.number}
- Original Issue: #${issue.number}
  `,
  head: "boss/consolidate-001-auth",
  base: "main",
  labels: ["boss-consolidation"]
});

// Close original issue with completion comment
await mcp.github.closeIssue({
  issue_number: issue.number,
  comment: `
## ✅ Feature Complete!

User Authentication has been fully implemented and tested.

### What Was Built
- Email/password registration and login
- OAuth login (Google, GitHub)
- Password reset via email
- JWT-based session management
- Rate limiting and security measures

### PRs
- Specification: #${specPR.number}
- Implementation: #${workers.map(w => w.pr.number).join(', #')}
- Consolidation: #${consolidationPR.number}

### Next Steps
Merge consolidation PR #${consolidationPR.number} and deploy!

---

🤖 Completed by BOSS in [X hours]
  `
});
```

---

## GitHub Project Board Workflow

### Board Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  BOSS Workflow Board                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Backlog    │ 📝 Spec    │ 🎯 Plan    │ ⚙️ Impl    │ 👀 Review │ ✅ Done
│                │            │            │            │          │
│  Issue #2      │ Issue #1   │            │            │          │ Issue #1
│  Payment       │ [Spec PR]  │            │            │          │ [All PRs]
│  Integration   │            │            │            │          │
│                │            │            │            │          │
│  Issue #3      │            │            │            │          │
│  Dashboard     │            │            │            │          │
│  UI            │            │            │            │          │
└─────────────────────────────────────────────────────────────────┘
```

### Automation Rules

```typescript
// GitHub Project automation

// When issue is created → Move to Backlog
await mcp.github.addProjectCard({
  project_id: project.id,
  column: "📋 Backlog",
  content_type: "Issue",
  content_id: issue.id
});

// When BOSS creates spec PR → Move to Specification
await mcp.github.moveProjectCard({
  card_id: issue.id,
  column: "📝 Specification"
});

// When spec approved → Move to Planning
await mcp.github.moveProjectCard({
  card_id: issue.id,
  column: "🎯 Planning"
});

// When workers spawned → Move to Implementation
await mcp.github.moveProjectCard({
  card_id: issue.id,
  column: "⚙️ Implementation"
});

// When all impl PRs created → Add to Review
for (const pr of implPRs) {
  await mcp.github.addProjectCard({
    project_id: project.id,
    column: "👀 Review",
    content_type: "PullRequest",
    content_id: pr.id
  });
}

// When PR merged → Move to Done
await mcp.github.moveProjectCard({
  card_id: pr.id,
  column: "✅ Done"
});
```

---

## Feedback Mechanisms

### 1. PR Review Comments (Primary Feedback)

**Human leaves inline comments on code:**

```markdown
File: src/auth/login.ts
Line: 23

> This password comparison is vulnerable to timing attacks.
> Use constant-time comparison: crypto.timingSafeEqual()
```

**BOSS reads and acts on feedback:**

```typescript
const comments = await mcp.github.getPullRequestComments({
  pull_number: pr.number
});

// BOSS categorizes feedback
const feedback = {
  security: ["Timing attack vulnerability on line 23"],
  performance: [],
  architecture: []
};

// Pass to worker with priority
await mcp.containerUse.executeInEnvironment({
  env_id: worker.env_id,
  prompt: `
CRITICAL SECURITY FEEDBACK:
${feedback.security.join('\n')}

Address immediately - security issues block merge.
  `
});
```

### 2. PR Review Suggestions

**GitHub's suggestion feature:**

```diff
File: src/auth/login.ts
Line: 23

- if (password === user.hashedPassword) {
+ if (await bcrypt.compare(password, user.hashedPassword)) {
```

**BOSS can accept suggestions automatically if they align with constitution:**

```typescript
const suggestions = await mcp.github.getReviewSuggestions({
  pull_number: pr.number
});

for (const suggestion of suggestions) {
  // Check if suggestion aligns with project constitution
  if (await isConstitutionallySound(suggestion)) {
    // Auto-apply suggestion
    await mcp.github.applySuggestion({
      suggestion_id: suggestion.id
    });
  } else {
    // Flag for human review
    await mcp.github.commentOnSuggestion({
      suggestion_id: suggestion.id,
      body: "This conflicts with project constitution. Please review."
    });
  }
}
```

### 3. GitHub Discussions

**For architectural decisions:**

```typescript
// BOSS creates discussion for major decisions

await mcp.github.createDiscussion({
  repo: repo.full_name,
  category: "Architecture",
  title: "Database Choice for Session Storage",
  body: `
## Context

We need to choose session storage for JWT token blacklisting.

## Options

### Option A: PostgreSQL
- ✅ Simpler infrastructure (already using PostgreSQL)
- ✅ ACID guarantees
- ❌ Slightly slower for high-frequency reads

### Option B: Redis
- ✅ Faster reads/writes
- ❌ Additional infrastructure
- ❌ Persistence concerns

## Recommendation

BOSS recommends **Option A (PostgreSQL)** for simpler deployment.

**Please vote or comment with your preference.**
  `
});

// Wait for human decision
// BOSS proceeds based on discussion outcome
```

### 4. Issue Labels for Prioritization

```typescript
// Human adds priority labels to issues

Issue #2: Payment Integration
Labels: ["P0", "revenue-critical"]

Issue #3: Dashboard UI Polish
Labels: ["P2", "enhancement"]

// BOSS prioritizes based on labels
const issues = await mcp.github.listIssues({
  labels: ["P0"]  // Get critical items first
});

// BOSS works on P0 issues before others
```

---

## GitHub Actions Integration

### Quality Gate Automation

```yaml
# .github/workflows/boss-gates.yml

name: BOSS Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  quality-gates:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 22

      - name: Install dependencies
        run: pnpm install

      - name: TypeScript Check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Tests
        run: pnpm test

      - name: Coverage Check
        run: |
          pnpm test:coverage
          # Fail if coverage < 80%
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi

      - name: Mutation Testing
        run: pnpm test:mutation

      - name: Security Audit
        run: pnpm audit

      - name: Comment Results
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `
## ✅ Quality Gates Passed

- TypeScript: 0 errors
- ESLint: 0 warnings
- Tests: All passing
- Coverage: ${process.env.COVERAGE}%
- Mutation Score: ${process.env.MUTATION_SCORE}%
- Security: No vulnerabilities

Ready for human review!
              `
            })
```

### BOSS Trigger Workflow

```yaml
# .github/workflows/boss-trigger.yml

name: BOSS Workflow Trigger

on:
  issues:
    types: [labeled]
  pull_request_review:
    types: [submitted]

jobs:
  trigger-boss:
    runs-on: ubuntu-latest

    steps:
      - name: Check if BOSS should proceed
        uses: actions/github-script@v6
        with:
          script: |
            // If issue labeled "boss-feature" → trigger spec creation
            if (context.payload.label?.name === 'boss-feature') {
              // Trigger BOSS locally via webhook or API
              // (BOSS is running on your local machine)
            }

            // If PR review approved → trigger next phase
            if (context.payload.review?.state === 'approved') {
              const pr = context.payload.pull_request;
              if (pr.labels.some(l => l.name === 'boss-spec')) {
                // Notify BOSS: spec approved, proceed to planning
              }
            }
```

---

## Best Practices

### 1. Clear PR Titles

```
✅ Good:
[BOSS Spec] User Authentication System
[BOSS] Implement OAuth Login (User Story 2)
[BOSS] Consolidation: User Authentication

❌ Bad:
Update auth
Fix stuff
WIP
```

### 2. Detailed PR Descriptions

Always include:
- What was built
- How to test
- Quality gate results
- Related issues/PRs
- Worker environment ID (for debugging)

### 3. Review Etiquette

```markdown
# Good Review Comments

✅ Specific: "Line 23: Use bcrypt.compare() for password verification"
✅ Actionable: "Add test for duplicate email registration"
✅ Educational: "Consider rate limiting here to prevent brute force"

❌ Vague: "This looks wrong"
❌ Unhelpful: "Rewrite this"
```

### 4. Label Conventions

```
boss-spec          - Specification PRs
boss-implementation - Worker-generated implementation PRs
boss-consolidation - Final integration PRs
boss-blocked       - Waiting for human input
needs-review       - Requires human attention
P0, P1, P2, P3     - Priority levels
security           - Security-related changes
breaking-change    - API breaking changes
```

### 5. Project Board Hygiene

- Keep Backlog prioritized (P0 at top)
- Archive completed work after 30 days
- Review "blocked" items weekly
- Celebrate wins (add 🎉 emoji to Done cards)

---

## Troubleshooting

### BOSS Not Detecting Approvals

**Problem:** PR approved but BOSS doesn't proceed

**Solution:**
```bash
# Check GitHub MCP connection
claude-code mcp status

# Verify BOSS can read PR reviews
github.rest.pulls.listReviews({
  owner: 'your-org',
  repo: 'your-repo',
  pull_number: 123
})

# Manually trigger BOSS to check for approvals
boss workflow resume --check-gates
```

### PRs Not Auto-Assigning

**Problem:** BOSS PRs not assigned to you

**Solution:**
```yaml
# Add .github/CODEOWNERS
*       @your-username

# Or update BOSS config
# .boss/config.yaml
github:
  default_reviewer: your-username
  auto_assign: true
```

### Quality Gates Failing

**Problem:** Workers consistently failing coverage requirements

**Solution:**
```typescript
// Check worker prompt includes test requirements
worker.prompt = `
...
CRITICAL: Coverage must be ≥ 80%

Write comprehensive tests for:
- Happy path
- Error cases
- Edge cases
- Integration scenarios
`;

// Or adjust quality preset
// .boss/config.yaml
quality:
  coverage_threshold: 75  # Lower if needed
```

---

## Summary

### GitHub as BOSS Project Management

**Replaces:**
- ❌ Plane (10 Docker containers)
- ❌ Separate PM tool
- ❌ Manual task tracking
- ❌ External approval systems

**Provides:**
- ✅ Pull Requests → Approval gates
- ✅ PR Reviews → Feedback mechanism
- ✅ Issues → Task tracking
- ✅ Projects → Workflow visualization
- ✅ Discussions → Architectural decisions
- ✅ Actions → CI/CD automation
- ✅ Zero additional infrastructure

### Human Workflow

```
1. Create Issue → Describe feature
2. Review Spec PR → Approve or request changes
3. Review Planning PR → Approve architecture
4. Review Implementation PRs → Provide feedback
5. Approve & Merge → Feature complete
```

### BOSS Workflow

```
1. Read Issue → Create spec
2. Wait for approval → Proceed to planning
3. Wait for approval → Spawn workers
4. Monitor PRs → Pass feedback to workers
5. Merge approved work → Consolidate
6. Close issue → Feature complete
```

**Simple. Effective. No extra infrastructure.**

---

🤖 **Next:** Bootstrap your first BOSS project with GitHub integration!

```bash
boss bootstrap --template nextjs-app-turbo --github your-org/your-repo
```
