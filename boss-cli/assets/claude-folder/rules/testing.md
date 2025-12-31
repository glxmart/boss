# Testing Requirements

## Test-First (NON-NEGOTIABLE)

- Write tests BEFORE implementation
- Follow TDD cycle: red → green → refactor
- All tests must pass before committing

## BDD (Mandatory)

- Use Given/When/Then format for test descriptions
- Use BDD test frameworks (Cucumber, Gherkin, or equivalent)
- Tests should read like specifications

## Coverage

- Unit tests: ≥80% coverage
- Integration tests: Required for all API endpoints
- Mutation testing: ≥80% score

## Test Structure

\`\`\`
describe('Feature Name', () => {
  describe('Given [context]', () => {
    it('When [action], Then [expected result]', () => {
      // Test implementation
    });
  });
});
\`\`\`

