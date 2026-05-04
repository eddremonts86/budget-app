/**
 * Seed script — Pipeline Flow #1: edd-app-template production deploy
 *
 * Usage:
 *   cd apps/budget-app
 *   pnpm tsx scripts/db/seed-tracker-pipeline-1.ts
 *
 * Idempotent: uses ON CONFLICT DO UPDATE — safe to re-run.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../src/shared/lib/db/schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL is not set. Run with: DATABASE_URL=... pnpm tsx ...')
  process.exit(1)
}

const client = postgres(connectionString, { prepare: false })
const db = drizzle(client, { schema })

// --- Project ---

const PROJECT = {
  id: 'pipeline-001',
  slug: 'edd-app-template-deploy',
  title: 'edd-app-template: Production Deploy (Pipeline #1)',
  description:
    'First complete end-to-end autonomous pipeline exercise. Deploy edd-app-template to https://profile.eduardoinerarte.dk via Coolify + Hetzner.',
  status: 'active' as const,
  priority: 1,
  repo: 'eddremonts86/edd-app-template',
  domain: 'https://profile.eduardoinerarte.dk',
}

// --- Tasks ---

const TASKS: Array<{
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  assignee: 'openCode' | 'openClaw' | 'human'
  priority: number
  phase: string
  dependsOn: string[]
}> = [
  // Phase 0 — Pre-flight
  {
    id: 'T-01',
    projectId: 'pipeline-001',
    title: 'Verify production TypeScript build',
    description:
      'Run `pnpm build` inside `apps/edd-app-template`. Fix any TypeScript or Vite errors. Build must exit 0 with no type errors before proceeding.',
    status: 'done', // ✅ verified — builds in 549ms
    assignee: 'openCode',
    priority: 1,
    phase: 'pre-flight',
    dependsOn: [],
  },
  {
    id: 'T-02',
    projectId: 'pipeline-001',
    title: 'Docker prod build succeeds',
    description:
      'Run `docker build --target prod -t edd-app-template:local .` from `apps/edd-app-template`. Must complete without errors.',
    status: 'todo',
    assignee: 'openCode',
    priority: 1,
    phase: 'pre-flight',
    dependsOn: ['T-01'],
  },
  {
    id: 'T-03',
    projectId: 'pipeline-001',
    title: 'Local prod stack smoke test',
    description:
      'Start `docker-compose.prod.yml` locally. App must respond on port 3000 with HTTP 200.',
    status: 'todo',
    assignee: 'openCode',
    priority: 1,
    phase: 'pre-flight',
    dependsOn: ['T-02'],
  },
  {
    id: 'T-04',
    projectId: 'pipeline-001',
    title: 'DB migrations run clean in prod container',
    description:
      'Run `pnpm db:migrate` against the local prod DB container. Verify users, sessions, accounts tables exist.',
    status: 'todo',
    assignee: 'openCode',
    priority: 1,
    phase: 'pre-flight',
    dependsOn: ['T-03'],
  },
  {
    id: 'T-05',
    projectId: 'pipeline-001',
    title: 'Auth flow verified locally against prod container',
    description:
      'Using playwright auth tests or manual browser, verify: sign-up creates user, sign-in returns session, dashboard loads, sign-out redirects to landing.',
    status: 'todo',
    assignee: 'openCode',
    priority: 1,
    phase: 'pre-flight',
    dependsOn: ['T-04'],
  },
  // Phase 1 — Visual audit
  {
    id: 'T-06',
    projectId: 'pipeline-001',
    title: 'Identify existing visual direction (open-design step 2b)',
    description:
      'Read `src/shared/styles/`, tailwind config, components.json. Identify: palette, typography, tokens, dark mode approach. Do NOT redesign.',
    status: 'done', // ✅ verified — monochrome-minimal, Geist, neutral shadcn
    assignee: 'openClaw',
    priority: 2,
    phase: 'visual-audit',
    dependsOn: [],
  },
  {
    id: 'T-07',
    projectId: 'pipeline-001',
    title: 'Document existing visual identity in BRAND.md',
    description:
      'Create `docs/projects/user-generated/edd-app-template/BRAND.md` documenting: visual direction, colors, typography, tokens, dark/light strategy.',
    status: 'done', // ✅ created
    assignee: 'openClaw',
    priority: 2,
    phase: 'visual-audit',
    dependsOn: ['T-06'],
  },
  // Phase 2 — Hetzner + Coolify setup
  {
    id: 'T-08',
    projectId: 'pipeline-001',
    title: 'Add payment method to Hetzner Cloud',
    description:
      'Go to https://console.hetzner.cloud → Account → Billing → Add payment method. Required before server creation.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'infra-setup',
    dependsOn: [],
  },
  {
    id: 'T-09',
    projectId: 'pipeline-001',
    title: 'Create Hetzner CX32 server (conductor-01)',
    description:
      'Create server: `hcloud server create --name conductor-01 --type cx32 --image ubuntu-24.04 --location fsn1 --ssh-key <key>`. Note server IP.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'infra-setup',
    dependsOn: ['T-08'],
  },
  {
    id: 'T-10',
    projectId: 'pipeline-001',
    title: 'Configure DNS wildcard A record',
    description:
      'Add: A *.eduardoinerarte.dk → <server-ip>, A eduardoinerarte.dk → <server-ip>. DNS propagation may take up to 24 h.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'infra-setup',
    dependsOn: ['T-09'],
  },
  {
    id: 'T-11',
    projectId: 'pipeline-001',
    title: 'Install Coolify on conductor-01',
    description:
      'SSH into conductor-01. Run: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`. Complete initial wizard.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'infra-setup',
    dependsOn: ['T-09'],
  },
  {
    id: 'T-12',
    projectId: 'pipeline-001',
    title: 'Connect GitHub to Coolify',
    description:
      'In Coolify → Settings → Source Control → Add GitHub OAuth App. Authorize eddremonts86 account.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'infra-setup',
    dependsOn: ['T-11'],
  },
  // Phase 3 — Coolify project setup
  {
    id: 'T-13',
    projectId: 'pipeline-001',
    title: 'Create Coolify project for edd-app-template',
    description:
      'In Coolify UI → Projects → New Project. Name: `edd-app-template`. Add environment: `production`.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'coolify-setup',
    dependsOn: ['T-12'],
  },
  {
    id: 'T-14',
    projectId: 'pipeline-001',
    title: 'Add PostgreSQL 16 service in Coolify',
    description:
      'Add Service → Database → PostgreSQL 16. Set: DB=eddapp_prod, user=eddapp, generate strong password. Note internal hostname for DATABASE_URL.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'coolify-setup',
    dependsOn: ['T-13'],
  },
  {
    id: 'T-15',
    projectId: 'pipeline-001',
    title: 'Add application source in Coolify',
    description:
      'Add Application → GitHub → repo: eddremonts86/edd-app-template, branch: main. Build pack: Dockerfile. Target: prod. Port: 3000.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'coolify-setup',
    dependsOn: ['T-14'],
  },
  {
    id: 'T-16',
    projectId: 'pipeline-001',
    title: 'Set production env vars in Coolify',
    description:
      'Set all vars from .env.production.example with real values: DATABASE_URL, BETTER_AUTH_SECRET (openssl rand -base64 32), BETTER_AUTH_URL, MINIMAX_API_KEY.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'coolify-setup',
    dependsOn: ['T-15'],
  },
  {
    id: 'T-17',
    projectId: 'pipeline-001',
    title: 'Set domain and enable HTTPS in Coolify',
    description:
      'Domain: profile.eduardoinerarte.dk. Enable Let\'s Encrypt SSL. Verify DNS propagated before enabling.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'coolify-setup',
    dependsOn: ['T-16', 'T-10'],
  },
  // Phase 4 — Deploy
  {
    id: 'T-18',
    projectId: 'pipeline-001',
    title: 'Trigger first production deploy',
    description:
      'In Coolify app → Deploy. Watch build log: pnpm install → pnpm build → container starts → health check passes.',
    status: 'todo',
    assignee: 'human',
    priority: 1,
    phase: 'deploy',
    dependsOn: ['T-17'],
  },
  {
    id: 'T-19',
    projectId: 'pipeline-001',
    title: 'Run DB migrations in production container',
    description:
      'Exec into production container: `docker exec -it <container> pnpm db:migrate`. Verify users, sessions, accounts tables created.',
    status: 'todo',
    assignee: 'openCode',
    priority: 1,
    phase: 'deploy',
    dependsOn: ['T-18'],
  },
  {
    id: 'T-20',
    projectId: 'pipeline-001',
    title: 'Verify app responds at production domain',
    description:
      'Run: `curl -I https://profile.eduardoinerarte.dk`. Expected: HTTP/2 200, valid TLS cert, content-type: text/html.',
    status: 'todo',
    assignee: 'openCode',
    priority: 1,
    phase: 'deploy',
    dependsOn: ['T-19'],
  },
  // Phase 5 — Smoke tests
  {
    id: 'T-21',
    projectId: 'pipeline-001',
    title: 'Landing page renders all sections',
    description:
      'Playwright against https://profile.eduardoinerarte.dk: verify Hero, Features, Pricing, CTA, Footer render. No JS console errors.',
    status: 'todo',
    assignee: 'openCode',
    priority: 2,
    phase: 'smoke-tests',
    dependsOn: ['T-20'],
  },
  {
    id: 'T-22',
    projectId: 'pipeline-001',
    title: 'Auth E2E smoke (sign-up, sign-in, sign-out)',
    description:
      'Run Playwright auth tests against production URL. All three (sign-up, sign-in, sign-out) must pass.',
    status: 'todo',
    assignee: 'openCode',
    priority: 1,
    phase: 'smoke-tests',
    dependsOn: ['T-20'],
  },
  {
    id: 'T-23',
    projectId: 'pipeline-001',
    title: 'AI endpoint smoke test (MiniMax)',
    description:
      'Run `pnpm test:ai-integration` pointing to production. MiniMax provider must return a chat completion response.',
    status: 'todo',
    assignee: 'openCode',
    priority: 3,
    phase: 'smoke-tests',
    dependsOn: ['T-20'],
  },
  {
    id: 'T-24',
    projectId: 'pipeline-001',
    title: 'Review Coolify logs — no 5xx in first 30 min',
    description:
      'Monitor Coolify log stream for 30 minutes post-deploy. Document any errors found.',
    status: 'todo',
    assignee: 'openClaw',
    priority: 2,
    phase: 'smoke-tests',
    dependsOn: ['T-20'],
  },
  // Phase 6 — CI/CD
  {
    id: 'T-25',
    projectId: 'pipeline-001',
    title: 'Enable auto-deploy on push to main',
    description:
      'Coolify app → Settings → Auto-deploy: enable webhook on push to main. Verify GitHub webhook appears in repo Settings → Webhooks.',
    status: 'todo',
    assignee: 'openCode',
    priority: 2,
    phase: 'cicd',
    dependsOn: ['T-22'],
  },
  {
    id: 'T-26',
    projectId: 'pipeline-001',
    title: 'Verify auto-deploy triggers on push',
    description:
      'Push trivial commit to main. Verify: Coolify receives webhook, build starts, new container deployed with zero downtime.',
    status: 'todo',
    assignee: 'openCode',
    priority: 2,
    phase: 'cicd',
    dependsOn: ['T-25'],
  },
  {
    id: 'T-27',
    projectId: 'pipeline-001',
    title: 'Add GitHub Actions CI gate (type-check + lint)',
    description:
      'Create .github/workflows/ci.yml: runs pnpm type-check && pnpm lint on push to main. Optional — add if team grows.',
    status: 'todo',
    assignee: 'openCode',
    priority: 4,
    phase: 'cicd',
    dependsOn: ['T-26'],
  },
  // Phase 7 — Monitoring
  {
    id: 'T-28',
    projectId: 'pipeline-001',
    title: 'Monitor logs for 24 h post-deploy',
    description:
      'openClaw monitors Coolify log stream for 24 h. Report: total requests, error rate, 5xx events. Create DEPLOY_LOG.md.',
    status: 'todo',
    assignee: 'openClaw',
    priority: 2,
    phase: 'monitoring',
    dependsOn: ['T-22'],
  },
  {
    id: 'T-29',
    projectId: 'pipeline-001',
    title: 'Set up external uptime monitoring',
    description:
      'Configure BetterStack free tier or UptimeRobot to ping https://profile.eduardoinerarte.dk every 5 min. Alert via Telegram.',
    status: 'todo',
    assignee: 'openCode',
    priority: 3,
    phase: 'monitoring',
    dependsOn: ['T-22'],
  },
  {
    id: 'T-30',
    projectId: 'pipeline-001',
    title: 'Write pipeline retrospective',
    description:
      'Create RETRO.md: what each pipeline step did, time taken, what to automate next, problems + solutions, recommendation for Pipeline Flow #2.',
    status: 'todo',
    assignee: 'openClaw',
    priority: 2,
    phase: 'monitoring',
    dependsOn: ['T-28'],
  },
  // Phase 8 — Tracker API (these tasks are self-referential — they build the system we're seeding into)
  {
    id: 'T-31',
    projectId: 'pipeline-001',
    title: 'Add tracker projects + tasks tables to budget-app schema',
    description:
      'Add tracker_projects and tracker_tasks Drizzle tables with enums. Run pnpm db:generate && pnpm db:migrate.',
    status: 'done', // ✅ schema added
    assignee: 'openCode',
    priority: 2,
    phase: 'tracker-api',
    dependsOn: [],
  },
  {
    id: 'T-32',
    projectId: 'pipeline-001',
    title: 'Implement tracker API server functions',
    description:
      'Create src/modules/tracker/api/tracker.fn.ts with: listTrackerProjects, createTrackerProject, listTrackerTasks, createTrackerTask, updateTrackerTaskStatus.',
    status: 'done', // ✅ implemented
    assignee: 'openCode',
    priority: 2,
    phase: 'tracker-api',
    dependsOn: ['T-31'],
  },
  {
    id: 'T-33',
    projectId: 'pipeline-001',
    title: 'Seed Pipeline #1 project + tasks in budget-app',
    description:
      'Run: `pnpm tsx scripts/db/seed-tracker-pipeline-1.ts`. Seeds edd-app-template-deploy project and all 35 tasks. Idempotent.',
    status: 'in_progress', // ← this task is being executed right now
    assignee: 'openCode',
    priority: 2,
    phase: 'tracker-api',
    dependsOn: ['T-32'],
  },
  {
    id: 'T-34',
    projectId: 'pipeline-001',
    title: 'Add tracker Kanban/list UI in budget-app dashboard',
    description:
      'Add tracker module with Kanban or list view grouped by phase. Assignee badge (openCode=blue, openClaw=purple, human=orange).',
    status: 'todo',
    assignee: 'openCode',
    priority: 3,
    phase: 'tracker-api',
    dependsOn: ['T-32'],
  },
]

async function main() {
  console.log('🌱 Seeding Symphony Pipeline Tracker — Flow #1: edd-app-template deploy...\n')

  // 1. Upsert project
  console.log(`📁 Project: ${PROJECT.slug}`)
  await db
    .insert(schema.trackerProjects)
    .values(PROJECT)
    .onConflictDoUpdate({
      target: schema.trackerProjects.slug,
      set: {
        title: PROJECT.title,
        description: PROJECT.description,
        status: PROJECT.status,
        priority: PROJECT.priority,
        repo: PROJECT.repo,
        domain: PROJECT.domain,
        updatedAt: new Date(),
      },
    })
  console.log('  ✅ Project upserted\n')

  // 2. Upsert tasks
  console.log(`📋 Tasks (${TASKS.length} total):`)
  for (const task of TASKS) {
    await db
      .insert(schema.trackerTasks)
      .values(task)
      .onConflictDoUpdate({
        target: schema.trackerTasks.id,
        set: {
          title: task.title,
          description: task.description,
          status: task.status,
          assignee: task.assignee,
          priority: task.priority,
          phase: task.phase,
          dependsOn: task.dependsOn,
          updatedAt: new Date(),
        },
      })
    const icon =
      task.status === 'done' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳'
    console.log(`  ${icon} ${task.id}: ${task.title} [${task.assignee}]`)
  }

  const done = TASKS.filter((t) => t.status === 'done').length
  const inProgress = TASKS.filter((t) => t.status === 'in_progress').length
  const todo = TASKS.filter((t) => t.status === 'todo').length

  console.log(`\n📊 Summary:`)
  console.log(`  ✅ Done:        ${done}`)
  console.log(`  🔄 In progress: ${inProgress}`)
  console.log(`  ⏳ Todo:        ${todo}`)
  console.log(`\n🎉 Seed complete!`)

  await client.end()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
