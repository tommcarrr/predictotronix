<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Verify before completing any task

Before considering ANY task complete, run `npm run verify`. It mirrors the CI
pipeline (`.github/workflows/ci.yml`) — running the full test suite and a
production build — so deploy-breaking issues (syntax errors, type errors,
failing tests, broken builds) are caught locally rather than on Render. The
task is not done until `npm run verify` passes.
