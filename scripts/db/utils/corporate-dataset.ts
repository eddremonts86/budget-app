import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type IsoDateString = string

export interface CorporateSnapshotMetadata {
  companyName: string
  generatedAt: IsoDateString
  seed: number
  employeeCount: number
}

export interface CorporateSnapshot {
  metadata: CorporateSnapshotMetadata
  roles: Array<Record<string, unknown>>
  skills: Array<Record<string, unknown>>
  jobTitles: Array<Record<string, unknown>>
  experienceLevels: Array<Record<string, unknown>>
  aiTechnologies: Array<Record<string, unknown>>
  clients: Array<Record<string, unknown>>
  campaigns: Array<Record<string, unknown>>
  authUsers: Array<Record<string, unknown>>
  users: Array<Record<string, unknown>>
  externalIdentities: Array<Record<string, unknown>>
  userSkills: Array<Record<string, unknown>>
  departments: Array<Record<string, unknown>>
  projects: Array<Record<string, unknown>>
  projectSkills: Array<Record<string, unknown>>
  projectMembers: Array<Record<string, unknown>>
  todos: Array<Record<string, unknown>>
  todoDependencies: Array<Record<string, unknown>>
  transactions: Array<Record<string, unknown>>
  categories: Array<Record<string, unknown>>
  teams: Array<Record<string, unknown>>
  teamMembers: Array<Record<string, unknown>>
}

type EmployeeLayer = 'chief' | 'head' | 'director' | 'manager' | 'lead' | 'individual_contributor'

interface DepartmentBlueprint {
  id: string
  name: string
  slug: string
  size: number
  location: string
  budget: number
  headTitle: string
  executiveTitle: string
  directorTitles: string[]
  managerTitles: string[]
  leadTitles: string[]
  individualContributorTitles: string[]
  coreSkills: string[]
  projectThemes: string[]
  clientFacing: boolean
}

interface EmployeeRecord {
  id: string
  authUserId: string
  name: string
  email: string
  departmentId: string
  layer: EmployeeLayer
  roleId: string
  reportsTo: string | null
  jobTitleId: string
  jobTitleName: string
  experienceLevelId: string
  location: string
  salary: number
  hireDate: IsoDateString
  avatar: string
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

interface TeamRecord {
  id: string
  departmentId: string
  leadId: string
  memberIds: string[]
}

interface ProjectRecord {
  id: string
  departmentId: string
  name: string
  startDate: IsoDateString
  endDate: IsoDateString
  memberIds: string[]
  ownerId: string
  managerId: string
  skillIds: string[]
  categoryIds: string[]
  clientId: string | null
}

const COMPANY_NAME = 'Microsoft Demo Enterprise'
const SNAPSHOT_SEED = 20260316
const SNAPSHOT_DIRECTORY = path.resolve(process.cwd(), 'scripts/db/generated')
export const CORPORATE_SNAPSHOT_PATH = path.join(
  SNAPSHOT_DIRECTORY,
  'microsoft-enterprise.snapshot.json',
)
export const CORPORATE_SNAPSHOT_SUMMARY_PATH = path.join(
  SNAPSHOT_DIRECTORY,
  'microsoft-enterprise.summary.json',
)

const NOW = new Date('2026-03-16T12:00:00.000Z')
const CREATED_AT = iso('2026-03-16T08:00:00.000Z')

const FIRST_NAMES = [
  'Avery',
  'Jordan',
  'Taylor',
  'Morgan',
  'Parker',
  'Riley',
  'Casey',
  'Quinn',
  'Hayden',
  'Logan',
  'Sydney',
  'Cameron',
  'Reese',
  'Dakota',
  'Skyler',
  'Harper',
  'Emerson',
  'Rowan',
  'Kendall',
  'Blake',
  'Alex',
  'Drew',
  'Elliot',
  'Finley',
  'Jamie',
  'Kai',
  'Micah',
  'Noel',
  'Peyton',
  'River',
  'Sage',
  'Shawn',
  'Devon',
  'Jules',
  'Tatum',
  'Aria',
  'Mila',
  'Nora',
  'Layla',
  'Zoe',
  'Ivy',
  'Luna',
  'Aiden',
  'Ethan',
  'Mason',
  'Lucas',
  'Henry',
  'Amelia',
  'Charlotte',
  'Isla',
]

const LAST_NAMES = [
  'Anderson',
  'Bennett',
  'Carter',
  'Diaz',
  'Ellis',
  'Foster',
  'Garcia',
  'Hayes',
  'Iverson',
  'Jenkins',
  'Kim',
  'Lopez',
  'Mitchell',
  'Nguyen',
  'Owens',
  'Patel',
  'Quintero',
  'Robinson',
  'Singh',
  'Turner',
  'Usman',
  'Vasquez',
  'Walker',
  'Xu',
  'Young',
  'Zimmerman',
  'Brooks',
  'Chavez',
  'Davis',
  'Edwards',
  'Flores',
  'Griffin',
  'Howard',
  'Ingram',
  'Johnson',
  'Khan',
  'Larson',
  'Morales',
  'Nash',
  'Ortiz',
  'Price',
  'Reed',
  'Stewart',
  'Thomas',
  'Underwood',
  'Valdez',
  'Ward',
  'Yates',
  'Coleman',
  'Ramirez',
]

const INDUSTRIES = [
  'Enterprise Software',
  'Retail',
  'Healthcare',
  'Manufacturing',
  'Financial Services',
  'Public Sector',
  'Education',
  'Media',
  'Telecommunications',
  'Energy',
]

const CATEGORY_BLUEPRINTS = [
  {
    id: 'cat_delivery',
    name: 'Delivery',
    description: 'Delivery planning and execution work.',
    color: '#2563eb',
    children: [
      ['cat_delivery_engineering', 'Engineering Delivery'],
      ['cat_delivery_release', 'Release Planning'],
      ['cat_delivery_program', 'Program Coordination'],
    ],
  },
  {
    id: 'cat_product',
    name: 'Product',
    description: 'Product discovery and roadmap work.',
    color: '#0f766e',
    children: [
      ['cat_product_research', 'Research'],
      ['cat_product_roadmap', 'Roadmap'],
      ['cat_product_feedback', 'Customer Feedback'],
    ],
  },
  {
    id: 'cat_design',
    name: 'Design',
    description: 'Design system and experience work.',
    color: '#db2777',
    children: [
      ['cat_design_ux', 'UX'],
      ['cat_design_ui', 'UI'],
      ['cat_design_content', 'Content Design'],
    ],
  },
  {
    id: 'cat_data',
    name: 'Data & AI',
    description: 'Data engineering, ML, and AI operations.',
    color: '#7c3aed',
    children: [
      ['cat_data_ml', 'Machine Learning'],
      ['cat_data_governance', 'Data Governance'],
      ['cat_data_reporting', 'Reporting'],
    ],
  },
  {
    id: 'cat_security',
    name: 'Security',
    description: 'Security engineering and compliance.',
    color: '#b91c1c',
    children: [
      ['cat_security_identity', 'Identity Security'],
      ['cat_security_appsec', 'Application Security'],
      ['cat_security_compliance', 'Compliance'],
    ],
  },
  {
    id: 'cat_operations',
    name: 'Operations',
    description: 'Operational readiness and support.',
    color: '#ea580c',
    children: [
      ['cat_operations_support', 'Support'],
      ['cat_operations_process', 'Process Improvement'],
      ['cat_operations_vendor', 'Vendor Management'],
    ],
  },
  {
    id: 'cat_revenue',
    name: 'Revenue',
    description: 'Sales, marketing, and customer programs.',
    color: '#0891b2',
    children: [
      ['cat_revenue_sales', 'Sales Enablement'],
      ['cat_revenue_campaigns', 'Campaigns'],
      ['cat_revenue_success', 'Customer Success'],
    ],
  },
  {
    id: 'cat_corporate',
    name: 'Corporate Services',
    description: 'Finance, legal, and people operations.',
    color: '#475569',
    children: [
      ['cat_corporate_finance', 'Finance'],
      ['cat_corporate_legal', 'Legal'],
      ['cat_corporate_people', 'People Operations'],
    ],
  },
]

const DEPARTMENTS: DepartmentBlueprint[] = [
  {
    id: 'dept_executive_office',
    name: 'Executive Office',
    slug: 'executive',
    size: 15,
    location: 'Redmond HQ',
    budget: 180_000_000,
    headTitle: 'Chief Executive Officer',
    executiveTitle: 'Chief Executive Officer',
    directorTitles: ['Vice President, Corporate Strategy'],
    managerTitles: ['Chief of Staff'],
    leadTitles: ['Strategic Program Lead'],
    individualContributorTitles: ['Executive Operations Partner'],
    coreSkills: ['Strategy', 'Program Management', 'Executive Communication'],
    projectThemes: ['Corporate transformation', 'Board reporting', 'Annual planning'],
    clientFacing: false,
  },
  {
    id: 'dept_engineering',
    name: 'Engineering',
    slug: 'engineering',
    size: 3200,
    location: 'Redmond HQ',
    budget: 1_500_000_000,
    headTitle: 'Vice President of Engineering',
    executiveTitle: 'Chief Technology Officer',
    directorTitles: [
      'Director of Platform Engineering',
      'Director of Cloud Engineering',
      'Director of Developer Productivity',
      'Director of Applied Engineering',
    ],
    managerTitles: ['Engineering Manager', 'Software Development Manager', 'SRE Manager'],
    leadTitles: ['Principal Engineer', 'Staff Engineer', 'Technical Lead'],
    individualContributorTitles: [
      'Senior Software Engineer',
      'Software Engineer II',
      'Senior Site Reliability Engineer',
      'Cloud Infrastructure Engineer',
    ],
    coreSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Azure', 'Kubernetes'],
    projectThemes: ['Developer platform', 'Distributed systems', 'Internal tooling', 'Cloud scale'],
    clientFacing: false,
  },
  {
    id: 'dept_product',
    name: 'Product',
    slug: 'product',
    size: 850,
    location: 'Seattle Hub',
    budget: 340_000_000,
    headTitle: 'Vice President of Product',
    executiveTitle: 'Chief Product Officer',
    directorTitles: ['Director of Product Management', 'Director of Product Strategy'],
    managerTitles: ['Group Product Manager', 'Product Manager'],
    leadTitles: ['Principal Product Lead', 'Senior Product Lead'],
    individualContributorTitles: [
      'Senior Product Manager',
      'Product Manager II',
      'Product Operations Manager',
    ],
    coreSkills: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics'],
    projectThemes: ['Roadmap delivery', 'Portfolio planning', 'Customer insights'],
    clientFacing: false,
  },
  {
    id: 'dept_design',
    name: 'Design',
    slug: 'design',
    size: 420,
    location: 'San Francisco Studio',
    budget: 140_000_000,
    headTitle: 'Vice President of Design',
    executiveTitle: 'Chief Design Officer',
    directorTitles: ['Director of Product Design', 'Director of Design Systems'],
    managerTitles: ['Design Manager', 'UX Research Manager'],
    leadTitles: ['Principal Product Designer', 'Design Lead'],
    individualContributorTitles: [
      'Senior Product Designer',
      'Product Designer II',
      'UX Researcher',
      'Content Designer',
    ],
    coreSkills: ['Design Systems', 'User Research', 'Accessibility', 'Figma'],
    projectThemes: ['Experience redesign', 'Accessibility', 'Design system evolution'],
    clientFacing: false,
  },
  {
    id: 'dept_data_ai',
    name: 'Data & AI',
    slug: 'data-ai',
    size: 900,
    location: 'Mountain View',
    budget: 410_000_000,
    headTitle: 'Vice President of Data & AI',
    executiveTitle: 'Chief Data & AI Officer',
    directorTitles: [
      'Director of Data Engineering',
      'Director of Applied AI',
      'Director of ML Ops',
    ],
    managerTitles: ['Data Science Manager', 'Machine Learning Manager', 'Analytics Manager'],
    leadTitles: ['Principal Data Scientist', 'Lead ML Engineer', 'Lead Data Engineer'],
    individualContributorTitles: [
      'Senior Data Scientist',
      'Senior ML Engineer',
      'Data Engineer II',
      'Analytics Engineer',
    ],
    coreSkills: ['Python', 'Machine Learning', 'MLOps', 'Data Engineering', 'Vector Search'],
    projectThemes: ['Recommendation systems', 'Forecasting', 'Copilot experiences'],
    clientFacing: false,
  },
  {
    id: 'dept_security',
    name: 'Security',
    slug: 'security',
    size: 260,
    location: 'Redmond HQ',
    budget: 180_000_000,
    headTitle: 'Vice President of Security',
    executiveTitle: 'Chief Information Security Officer',
    directorTitles: ['Director of Security Engineering', 'Director of Security Operations'],
    managerTitles: ['Security Manager', 'Security Response Manager'],
    leadTitles: ['Security Architect', 'Lead Security Engineer'],
    individualContributorTitles: [
      'Security Engineer',
      'Detection Engineer',
      'Application Security Engineer',
    ],
    coreSkills: ['Zero Trust', 'Identity', 'Threat Detection', 'Compliance'],
    projectThemes: ['Identity hardening', 'Threat response', 'Compliance automation'],
    clientFacing: false,
  },
  {
    id: 'dept_it_infrastructure',
    name: 'IT & Infrastructure',
    slug: 'it-infrastructure',
    size: 340,
    location: 'Austin Operations Center',
    budget: 210_000_000,
    headTitle: 'Vice President of IT & Infrastructure',
    executiveTitle: 'Chief Information Officer',
    directorTitles: ['Director of Enterprise IT', 'Director of Infrastructure Operations'],
    managerTitles: ['IT Operations Manager', 'Infrastructure Manager'],
    leadTitles: ['Lead Systems Engineer', 'Infrastructure Lead'],
    individualContributorTitles: [
      'Systems Engineer',
      'Network Engineer',
      'Endpoint Engineer',
      'IT Support Engineer',
    ],
    coreSkills: ['Windows Platform', 'Networking', 'Endpoint Management', 'Azure'],
    projectThemes: ['Device refresh', 'Network modernization', 'Workplace reliability'],
    clientFacing: false,
  },
  {
    id: 'dept_operations',
    name: 'Operations',
    slug: 'operations',
    size: 780,
    location: 'Dallas Operations Center',
    budget: 280_000_000,
    headTitle: 'Vice President of Operations',
    executiveTitle: 'Chief Operating Officer',
    directorTitles: ['Director of Business Operations', 'Director of Delivery Operations'],
    managerTitles: ['Operations Manager', 'Business Operations Manager'],
    leadTitles: ['Operations Lead', 'Continuous Improvement Lead'],
    individualContributorTitles: [
      'Business Operations Specialist',
      'Program Operations Analyst',
      'Delivery Operations Specialist',
    ],
    coreSkills: ['Program Management', 'Process Improvement', 'Vendor Management', 'Analytics'],
    projectThemes: ['Delivery excellence', 'Operating model design', 'Capacity planning'],
    clientFacing: false,
  },
  {
    id: 'dept_finance',
    name: 'Finance',
    slug: 'finance',
    size: 310,
    location: 'New York Finance Center',
    budget: 160_000_000,
    headTitle: 'Vice President of Finance',
    executiveTitle: 'Chief Financial Officer',
    directorTitles: ['Director of FP&A', 'Director of Revenue Operations'],
    managerTitles: ['Finance Manager', 'Accounting Manager'],
    leadTitles: ['Finance Lead', 'Revenue Lead'],
    individualContributorTitles: [
      'Senior Financial Analyst',
      'Accounting Analyst',
      'Revenue Operations Analyst',
    ],
    coreSkills: ['Financial Planning', 'Accounting', 'Forecasting', 'Risk Management'],
    projectThemes: ['Budget planning', 'Revenue controls', 'Forecast modernization'],
    clientFacing: false,
  },
  {
    id: 'dept_people',
    name: 'People & Culture',
    slug: 'people-culture',
    size: 220,
    location: 'Atlanta People Hub',
    budget: 120_000_000,
    headTitle: 'Vice President of People & Culture',
    executiveTitle: 'Chief People Officer',
    directorTitles: ['Director of Talent', 'Director of HR Operations'],
    managerTitles: ['People Operations Manager', 'Talent Manager'],
    leadTitles: ['HR Lead', 'Talent Programs Lead'],
    individualContributorTitles: [
      'HR Business Partner',
      'Talent Acquisition Partner',
      'People Operations Specialist',
    ],
    coreSkills: ['Talent Acquisition', 'People Analytics', 'Org Design', 'Learning Programs'],
    projectThemes: ['Hiring acceleration', 'Leadership programs', 'Workforce planning'],
    clientFacing: false,
  },
  {
    id: 'dept_legal',
    name: 'Legal & Compliance',
    slug: 'legal-compliance',
    size: 110,
    location: 'Washington DC',
    budget: 95_000_000,
    headTitle: 'Vice President of Legal & Compliance',
    executiveTitle: 'General Counsel',
    directorTitles: ['Director of Compliance', 'Director of Commercial Legal'],
    managerTitles: ['Compliance Manager', 'Legal Operations Manager'],
    leadTitles: ['Lead Counsel', 'Compliance Lead'],
    individualContributorTitles: [
      'Corporate Counsel',
      'Compliance Analyst',
      'Legal Operations Analyst',
    ],
    coreSkills: ['Compliance', 'Contracting', 'Privacy', 'Policy Management'],
    projectThemes: ['Policy modernization', 'Privacy readiness', 'Contract operations'],
    clientFacing: false,
  },
  {
    id: 'dept_sales',
    name: 'Sales',
    slug: 'sales',
    size: 1350,
    location: 'Chicago Revenue Hub',
    budget: 620_000_000,
    headTitle: 'Vice President of Sales',
    executiveTitle: 'Chief Revenue Officer',
    directorTitles: [
      'Director of Enterprise Sales',
      'Director of Solution Sales',
      'Director of Sales Excellence',
    ],
    managerTitles: ['Regional Sales Manager', 'Enterprise Sales Manager'],
    leadTitles: ['Sales Team Lead', 'Strategic Accounts Lead'],
    individualContributorTitles: [
      'Account Executive',
      'Solution Specialist',
      'Customer Engineer',
      'Sales Operations Analyst',
    ],
    coreSkills: ['Enterprise Sales', 'Solution Selling', 'CRM', 'Pipeline Management'],
    projectThemes: ['Pipeline acceleration', 'Regional growth', 'Strategic accounts'],
    clientFacing: true,
  },
  {
    id: 'dept_marketing',
    name: 'Marketing',
    slug: 'marketing',
    size: 620,
    location: 'Los Angeles Creative Hub',
    budget: 260_000_000,
    headTitle: 'Vice President of Marketing',
    executiveTitle: 'Chief Marketing Officer',
    directorTitles: [
      'Director of Demand Generation',
      'Director of Brand',
      'Director of Digital Marketing',
    ],
    managerTitles: ['Marketing Manager', 'Campaign Manager'],
    leadTitles: ['Campaign Lead', 'Growth Marketing Lead'],
    individualContributorTitles: [
      'Growth Marketing Manager',
      'Lifecycle Marketing Manager',
      'Digital Marketing Specialist',
      'Brand Strategist',
    ],
    coreSkills: ['Demand Generation', 'Content Strategy', 'SEO', 'Campaign Operations'],
    projectThemes: ['Global campaigns', 'Brand systems', 'Lifecycle programs'],
    clientFacing: true,
  },
  {
    id: 'dept_customer_success',
    name: 'Customer Success',
    slug: 'customer-success',
    size: 420,
    location: 'Phoenix Success Center',
    budget: 175_000_000,
    headTitle: 'Vice President of Customer Success',
    executiveTitle: 'Chief Customer Officer',
    directorTitles: ['Director of Customer Success', 'Director of Customer Programs'],
    managerTitles: ['Customer Success Manager', 'Renewals Manager'],
    leadTitles: ['Success Lead', 'Strategic Programs Lead'],
    individualContributorTitles: [
      'Customer Success Manager',
      'Renewals Specialist',
      'Technical Account Manager',
    ],
    coreSkills: ['Customer Success', 'Renewals', 'Voice of Customer', 'Escalation Management'],
    projectThemes: ['Renewal programs', 'Adoption acceleration', 'Escalation reduction'],
    clientFacing: true,
  },
  {
    id: 'dept_research',
    name: 'Research & Innovation',
    slug: 'research-innovation',
    size: 205,
    location: 'Cambridge Lab',
    budget: 190_000_000,
    headTitle: 'Vice President of Research & Innovation',
    executiveTitle: 'Chief Research Officer',
    directorTitles: ['Director of Emerging Technology', 'Director of Advanced Research'],
    managerTitles: ['Research Manager', 'Innovation Programs Manager'],
    leadTitles: ['Research Lead', 'Innovation Lead'],
    individualContributorTitles: [
      'Research Scientist',
      'Applied Research Engineer',
      'Innovation Program Specialist',
    ],
    coreSkills: ['Research Methods', 'Prototyping', 'AI Agents', 'Experiment Design'],
    projectThemes: ['Innovation labs', 'Emerging technology pilots', 'Applied research'],
    clientFacing: false,
  },
]

class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0
    return this.state / 4294967296
  }

  int(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  chance(probability: number) {
    return this.next() < probability
  }

  pick<T>(items: T[]) {
    return items[this.int(0, items.length - 1)]
  }

  sample<T>(items: T[], count: number) {
    const copy = [...items]
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = this.int(0, index)
      ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
    }

    return copy.slice(0, Math.max(0, Math.min(count, copy.length)))
  }
}

function iso(value: Date | string) {
  return typeof value === 'string' ? new Date(value).toISOString() : value.toISOString()
}

function id(prefix: string, value: number) {
  return `${prefix}_${String(value).padStart(5, '0')}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildRoleRows() {
  return [
    {
      id: 'role_admin',
      name: 'admin',
      description: 'Administrative access',
      createdAt: CREATED_AT,
    },
    {
      id: 'role_project_manager',
      name: 'project_manager',
      description: 'Project and approval access',
      createdAt: CREATED_AT,
    },
    {
      id: 'role_user',
      name: 'user',
      description: 'Standard employee access',
      createdAt: CREATED_AT,
    },
  ]
}

function buildExperienceRows() {
  return [
    { id: 'exp_executive', name: 'Executive', createdAt: CREATED_AT },
    { id: 'exp_principal', name: 'Principal', createdAt: CREATED_AT },
    { id: 'exp_staff', name: 'Staff', createdAt: CREATED_AT },
    { id: 'exp_senior', name: 'Senior', createdAt: CREATED_AT },
    { id: 'exp_mid', name: 'Mid', createdAt: CREATED_AT },
    { id: 'exp_entry', name: 'Entry', createdAt: CREATED_AT },
  ]
}

function buildSkillRows() {
  const names = [
    'Strategy',
    'Program Management',
    'Executive Communication',
    'TypeScript',
    'React',
    'Node.js',
    'PostgreSQL',
    'Azure',
    'Kubernetes',
    'Product Strategy',
    'Roadmapping',
    'User Research',
    'Analytics',
    'Design Systems',
    'Accessibility',
    'Figma',
    'Python',
    'Machine Learning',
    'MLOps',
    'Data Engineering',
    'Vector Search',
    'Zero Trust',
    'Identity',
    'Threat Detection',
    'Compliance',
    'Windows Platform',
    'Networking',
    'Endpoint Management',
    'Process Improvement',
    'Vendor Management',
    'Financial Planning',
    'Accounting',
    'Forecasting',
    'Talent Acquisition',
    'Org Design',
    'Learning Programs',
    'Contracting',
    'Privacy',
    'Enterprise Sales',
    'CRM',
    'Demand Generation',
    'SEO',
    'Campaign Operations',
    'Customer Success',
    'Renewals',
    'Research Methods',
    'Prototyping',
    'AI Agents',
    'Experiment Design',
  ]

  return names.map((name, index) => ({
    id: `skill_${slugify(name)}_${String(index + 1).padStart(2, '0')}`,
    name,
    createdAt: CREATED_AT,
  }))
}

function buildAiTechnologyRows() {
  const technologies = [
    ['ai_azure_openai', 'Azure OpenAI Service', 'Managed enterprise-grade generative AI platform.'],
    ['ai_azure_ai_search', 'Azure AI Search', 'Search platform for vector and hybrid retrieval.'],
    [
      'ai_copilot_stack',
      'Copilot Stack',
      'Internal copilots for productivity and support scenarios.',
    ],
    [
      'ai_prompt_orchestration',
      'Prompt Orchestration',
      'Governed prompt routing and orchestration layer.',
    ],
    ['ai_llm_observability', 'LLM Observability', 'Tracing, evaluation, and feedback tooling.'],
    ['ai_agent_runtime', 'Agent Runtime', 'Autonomous workflow execution runtime.'],
    ['ai_embeddings', 'Embeddings Platform', 'Embedding generation and storage services.'],
    [
      'ai_rag',
      'Retrieval-Augmented Generation',
      'RAG platform with enterprise knowledge connectors.',
    ],
    ['ai_governance', 'AI Governance', 'Guardrails, content controls, and auditability.'],
    ['ai_model_router', 'Model Router', 'Policy-aware routing across model providers.'],
  ]

  return technologies.map(([idValue, name, description]) => ({
    id: idValue,
    name,
    description,
    createdAt: CREATED_AT,
  }))
}

function buildJobTitleRows() {
  const titles = new Set<string>()

  for (const department of DEPARTMENTS) {
    titles.add(department.headTitle)
    titles.add(department.executiveTitle)
    for (const title of department.directorTitles) titles.add(title)
    for (const title of department.managerTitles) titles.add(title)
    for (const title of department.leadTitles) titles.add(title)
    for (const title of department.individualContributorTitles) titles.add(title)
  }

  return [...titles].sort().map((name) => ({
    id: `job_${slugify(name)}`,
    name,
    description: `${name} within ${COMPANY_NAME}.`,
    createdAt: CREATED_AT,
  }))
}

function buildClientRows(random: SeededRandom) {
  const clientNames = [
    'Northwind Retail Group',
    'Contoso Health Systems',
    'Fabrikam Industrial',
    'Litware Financial',
    'Adventure Works',
    'Tailspin Mobility',
    'Woodgrove Bank',
    'Blue Yonder Energy',
    'Alpine Education Network',
    'Lucerne Media',
    'Apex Telecom',
    'Helios Manufacturing',
    'Crestview Logistics',
    'Nimbus Public Services',
    'Summit Retail Cloud',
    'Oceanic Insurance',
    'Brightline Pharma',
    'Vertex Capital',
    'Pioneer Consumer Goods',
    'Silverline Automotive',
    'Greenfield Utilities',
    'Skybridge Commerce',
    'Ironclad Defense Tech',
    'Meridian Hospitality',
    'Orbit Semiconductor',
    'Beacon Nonprofit Alliance',
    'Redwood Healthcare Network',
    'Cosmos Travel Group',
    'Quantum Data Partners',
    'Harbor Freight Systems',
  ]

  return clientNames.map((name, index) => ({
    id: id('client', index + 1),
    name,
    industry: INDUSTRIES[index % INDUSTRIES.length],
    contactEmail: `contact${index + 1}@${slugify(name)}.example`,
    website: `https://${slugify(name)}.example`,
    createdAt: iso(new Date(2021, random.int(0, 11), random.int(1, 28))),
    updatedAt: CREATED_AT,
  }))
}

function buildCampaignRows(random: SeededRandom, clients: Array<Record<string, unknown>>) {
  const campaigns: Array<Record<string, unknown>> = []
  let campaignIndex = 1
  for (const client of clients) {
    const clientId = String(client.id)
    const clientName = String(client.name)
    const campaignCount = 2 + (campaignIndex % 2)
    for (let index = 0; index < campaignCount; index += 1) {
      const startDate = new Date(2025, random.int(0, 9), random.int(1, 28))
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + random.int(2, 8))
      campaigns.push({
        id: id('campaign', campaignIndex),
        name: `${clientName} ${['Expansion', 'Transformation', 'Acceleration'][index % 3]} Program`,
        description: `Coordinated go-to-market initiative for ${clientName}.`,
        clientId,
        startDate: iso(startDate),
        endDate: iso(endDate),
        budget: random.int(300_000, 8_500_000),
        createdAt: iso(new Date(startDate.getTime() - 1000 * 60 * 60 * 24 * 14)),
        updatedAt: CREATED_AT,
      })
      campaignIndex += 1
    }
  }
  return campaigns
}

function buildCategoryRows() {
  const categories: Array<Record<string, unknown>> = []

  for (const blueprint of CATEGORY_BLUEPRINTS) {
    categories.push({
      id: blueprint.id,
      name: blueprint.name,
      description: blueprint.description,
      parentId: null,
      sla: 72,
      color: blueprint.color,
    })

    for (const [childId, childName] of blueprint.children) {
      categories.push({
        id: childId,
        name: childName,
        description: `${childName} workstream under ${blueprint.name}.`,
        parentId: blueprint.id,
        sla: 48,
        color: blueprint.color,
      })
    }
  }

  return categories
}

function departmentCategoryMap() {
  return new Map<string, string[]>([
    [
      'dept_engineering',
      ['cat_delivery_engineering', 'cat_delivery_release', 'cat_security_appsec'],
    ],
    ['dept_product', ['cat_product_research', 'cat_product_roadmap', 'cat_delivery_program']],
    ['dept_design', ['cat_design_ux', 'cat_design_ui', 'cat_design_content']],
    ['dept_data_ai', ['cat_data_ml', 'cat_data_governance', 'cat_data_reporting']],
    ['dept_security', ['cat_security_identity', 'cat_security_appsec', 'cat_security_compliance']],
    [
      'dept_it_infrastructure',
      ['cat_operations_process', 'cat_operations_support', 'cat_security_identity'],
    ],
    [
      'dept_operations',
      ['cat_operations_support', 'cat_operations_process', 'cat_delivery_program'],
    ],
    ['dept_finance', ['cat_corporate_finance', 'cat_operations_process', 'cat_corporate_legal']],
    ['dept_people', ['cat_corporate_people', 'cat_operations_process', 'cat_product_feedback']],
    ['dept_legal', ['cat_corporate_legal', 'cat_security_compliance', 'cat_corporate_finance']],
    ['dept_sales', ['cat_revenue_sales', 'cat_revenue_campaigns', 'cat_delivery_program']],
    ['dept_marketing', ['cat_revenue_campaigns', 'cat_revenue_sales', 'cat_product_feedback']],
    [
      'dept_customer_success',
      ['cat_revenue_success', 'cat_product_feedback', 'cat_operations_support'],
    ],
    ['dept_research', ['cat_data_ml', 'cat_product_research', 'cat_delivery_engineering']],
    [
      'dept_executive_office',
      ['cat_delivery_program', 'cat_corporate_finance', 'cat_product_roadmap'],
    ],
  ])
}

function skillIdMap(skills: Array<Record<string, unknown>>) {
  return new Map(skills.map((skill) => [String(skill.name), String(skill.id)]))
}

function jobTitleIdMap(jobTitles: Array<Record<string, unknown>>) {
  return new Map(jobTitles.map((jobTitle) => [String(jobTitle.name), String(jobTitle.id)]))
}

function levelIdForLayer(layer: EmployeeLayer) {
  switch (layer) {
    case 'chief':
      return 'exp_executive'
    case 'head':
      return 'exp_principal'
    case 'director':
      return 'exp_principal'
    case 'manager':
      return 'exp_staff'
    case 'lead':
      return 'exp_senior'
    default:
      return 'exp_mid'
  }
}

function roleIdForLayer(layer: EmployeeLayer, random: SeededRandom) {
  if (layer === 'chief') {
    return 'role_admin'
  }

  if (layer === 'head' || layer === 'director' || layer === 'manager') {
    return 'role_project_manager'
  }

  if (layer === 'lead' && random.chance(0.35)) {
    return 'role_project_manager'
  }

  return 'role_user'
}

function salaryForLayer(layer: EmployeeLayer, departmentSlug: string, random: SeededRandom) {
  const baseByDepartment: Record<string, number> = {
    executive: 420_000,
    engineering: 185_000,
    product: 170_000,
    design: 155_000,
    'data-ai': 195_000,
    security: 180_000,
    'it-infrastructure': 150_000,
    operations: 125_000,
    finance: 145_000,
    'people-culture': 130_000,
    'legal-compliance': 165_000,
    sales: 160_000,
    marketing: 135_000,
    'customer-success': 128_000,
    'research-innovation': 200_000,
  }

  const multiplierByLayer: Record<EmployeeLayer, number> = {
    chief: 2.2,
    head: 1.65,
    director: 1.4,
    manager: 1.2,
    lead: 1.05,
    individual_contributor: 0.82,
  }

  const base = baseByDepartment[departmentSlug] ?? 130_000
  const multiplier = multiplierByLayer[layer]
  const jitter = random.int(-15_000, 35_000)
  return Math.max(72_000, Math.round(base * multiplier + jitter))
}

function hireDateForLayer(layer: EmployeeLayer, random: SeededRandom) {
  const ranges: Record<EmployeeLayer, [number, number]> = {
    chief: [2013, 2020],
    head: [2014, 2021],
    director: [2015, 2022],
    manager: [2016, 2024],
    lead: [2017, 2025],
    individual_contributor: [2018, 2026],
  }
  const [startYear, endYear] = ranges[layer]
  return iso(new Date(random.int(startYear, endYear), random.int(0, 11), random.int(1, 28)))
}

function allocateDepartmentLayers(size: number) {
  const headCount = 1
  const directorCount = clamp(Math.round(size * 0.02), 2, 48)
  const managerCount = clamp(Math.round(size * 0.07), 4, 220)
  const leadCount = clamp(Math.round(size * 0.12), 6, 360)
  const individualContributorCount = size - headCount - directorCount - managerCount - leadCount

  if (individualContributorCount <= 0) {
    const correctedLeadCount = Math.max(1, leadCount + individualContributorCount - 1)
    return {
      headCount,
      directorCount,
      managerCount,
      leadCount: correctedLeadCount,
      individualContributorCount: 1,
    }
  }

  return {
    headCount,
    directorCount,
    managerCount,
    leadCount,
    individualContributorCount,
  }
}

function nameFactory(random: SeededRandom) {
  const seen = new Map<string, number>()

  return () => {
    const baseName = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`
    const count = (seen.get(baseName) ?? 0) + 1
    seen.set(baseName, count)
    return count === 1 ? baseName : `${baseName} ${count}`
  }
}

function emailForName(name: string, userNumber: number) {
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, '')
    .split(/\s+/)
    .filter(Boolean)
  const first = tokens[0] ?? 'user'
  const last = tokens[1] ?? 'employee'
  return `${first}.${last}.${String(userNumber).padStart(5, '0')}@microsoft-demo.local`
}

function avatarForName(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`
}

function pickTitle(titles: string[], random: SeededRandom, fallback: string) {
  return titles.length > 0 ? random.pick(titles) : fallback
}

function buildEmployeeHierarchy(random: SeededRandom, jobTitles: Array<Record<string, unknown>>) {
  const nextName = nameFactory(random)
  const titleIds = jobTitleIdMap(jobTitles)
  const employees: EmployeeRecord[] = []
  const employeesByDepartment = new Map<string, EmployeeRecord[]>()
  const employeesById = new Map<string, EmployeeRecord>()
  const departmentManagers = new Map<string, string>()
  let userNumber = 1

  const createEmployee = (
    department: DepartmentBlueprint,
    layer: EmployeeLayer,
    jobTitleName: string,
    reportsTo: string | null,
    overrides?: Partial<EmployeeRecord>,
  ) => {
    const idValue = overrides?.id ?? id('user', userNumber)
    const name = overrides?.name ?? nextName()
    const authUserId = overrides?.authUserId ?? `auth_${idValue}`
    const employee: EmployeeRecord = {
      id: idValue,
      authUserId,
      name,
      email: overrides?.email ?? emailForName(name, userNumber),
      departmentId: department.id,
      layer,
      roleId: overrides?.roleId ?? roleIdForLayer(layer, random),
      reportsTo,
      jobTitleId: titleIds.get(jobTitleName) ?? `job_${slugify(jobTitleName)}`,
      jobTitleName,
      experienceLevelId: overrides?.experienceLevelId ?? levelIdForLayer(layer),
      location: overrides?.location ?? department.location,
      salary: overrides?.salary ?? salaryForLayer(layer, department.slug, random),
      hireDate: overrides?.hireDate ?? hireDateForLayer(layer, random),
      avatar: overrides?.avatar ?? avatarForName(name),
      createdAt: overrides?.createdAt ?? CREATED_AT,
      updatedAt: overrides?.updatedAt ?? CREATED_AT,
    }

    userNumber += 1
    employees.push(employee)
    employeesById.set(employee.id, employee)
    const departmentEntries = employeesByDepartment.get(department.id) ?? []
    departmentEntries.push(employee)
    employeesByDepartment.set(department.id, departmentEntries)
    return employee
  }

  const executiveDepartment = DEPARTMENTS[0]
  const ceo = createEmployee(executiveDepartment, 'chief', executiveDepartment.headTitle, null, {
    id: 'mock_user_id',
    authUserId: 'auth_mock_user_id',
    name: 'Avery Stone',
    email: 'avery.stone@microsoft-demo.local',
    roleId: 'role_admin',
    experienceLevelId: 'exp_executive',
    salary: 1_200_000,
    hireDate: iso('2014-02-01T00:00:00.000Z'),
    location: executiveDepartment.location,
  })
  departmentManagers.set(executiveDepartment.id, ceo.id)

  const executiveTitles = DEPARTMENTS.slice(1).map((department) => department.executiveTitle)
  for (const title of executiveTitles) {
    createEmployee(executiveDepartment, 'chief', title, ceo.id, {
      roleId: 'role_admin',
      experienceLevelId: 'exp_executive',
      salary: random.int(540_000, 880_000),
      hireDate: hireDateForLayer('chief', random),
    })
  }

  for (const department of DEPARTMENTS.slice(1)) {
    const executive = employees.find(
      (employee) =>
        employee.departmentId === executiveDepartment.id &&
        employee.jobTitleName === department.executiveTitle,
    )

    const allocation = allocateDepartmentLayers(department.size)
    const head = createEmployee(department, 'head', department.headTitle, executive?.id ?? ceo.id, {
      roleId: 'role_project_manager',
      experienceLevelId: 'exp_principal',
      salary: random.int(260_000, 420_000),
    })
    departmentManagers.set(department.id, head.id)

    const directors = Array.from({ length: allocation.directorCount }, () =>
      createEmployee(
        department,
        'director',
        pickTitle(department.directorTitles, random, 'Director'),
        head.id,
      ),
    )

    const managers = Array.from({ length: allocation.managerCount }, (_, index) =>
      createEmployee(
        department,
        'manager',
        pickTitle(department.managerTitles, random, 'Manager'),
        directors[index % directors.length]?.id ?? head.id,
      ),
    )

    const leads = Array.from({ length: allocation.leadCount }, (_, index) =>
      createEmployee(
        department,
        'lead',
        pickTitle(department.leadTitles, random, 'Lead'),
        managers[index % managers.length]?.id ?? head.id,
      ),
    )

    for (let index = 0; index < allocation.individualContributorCount; index += 1) {
      const manager = leads[index % leads.length] ?? managers[index % managers.length] ?? head
      createEmployee(
        department,
        'individual_contributor',
        pickTitle(department.individualContributorTitles, random, 'Specialist'),
        manager.id,
      )
    }
  }

  return {
    ceo,
    employees,
    employeesById,
    employeesByDepartment,
    departmentManagers,
  }
}

function buildAuthUsers(employees: EmployeeRecord[]) {
  return employees.map((employee) => ({
    id: employee.authUserId,
    name: employee.name,
    email: employee.email,
    emailVerified: true,
    image: employee.avatar,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }))
}

function buildUserRows(employees: EmployeeRecord[]) {
  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    roleId: employee.roleId,
    authUserId: employee.authUserId,
    jobTitleId: employee.jobTitleId,
    experienceLevelId: employee.experienceLevelId,
    departmentId: employee.departmentId,
    hireDate: employee.hireDate,
    reportsTo: employee.reportsTo,
    avatar: employee.avatar,
    salary: employee.salary,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }))
}

function buildExternalIdentities(random: SeededRandom, employees: EmployeeRecord[]) {
  const identities: Array<Record<string, unknown>> = []

  for (const employee of employees) {
    if (employee.id === 'mock_user_id' || random.chance(0.28)) {
      identities.push({
        id: `ext_${employee.id}`,
        userId: employee.id,
        provider: 'clerk',
        externalUserId: `clerk_${employee.id}`,
        email: employee.email,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
        lastLoginAt: iso(new Date(2026, random.int(0, 2), random.int(1, 15))),
      })
    }
  }

  return identities
}

function buildUserSkills(
  random: SeededRandom,
  employeesByDepartment: Map<string, EmployeeRecord[]>,
  skills: Array<Record<string, unknown>>,
) {
  const skillIds = skillIdMap(skills)
  const assignments: Array<Record<string, unknown>> = []
  const commonSkills = ['Program Management', 'Analytics', 'Executive Communication']

  for (const department of DEPARTMENTS) {
    const employees = employeesByDepartment.get(department.id) ?? []
    const departmentSkills = [...department.coreSkills, ...commonSkills]
      .map((name) => skillIds.get(name))
      .filter(Boolean) as string[]

    for (const employee of employees) {
      const assignmentCount =
        employee.layer === 'individual_contributor' ? random.int(3, 6) : random.int(4, 8)
      const selectedSkills = new Set<string>(random.sample(departmentSkills, assignmentCount))
      for (const skillId of selectedSkills) {
        assignments.push({
          userId: employee.id,
          skillId,
          assignedAt: employee.createdAt,
        })
      }
    }
  }

  return assignments
}

function buildDepartmentRows(departmentManagers: Map<string, string>) {
  return DEPARTMENTS.map((department) => ({
    id: department.id,
    name: department.name,
    managerId: departmentManagers.get(department.id) ?? null,
    budget: department.budget,
    location: department.location,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }))
}

function buildTeams(employeesByDepartment: Map<string, EmployeeRecord[]>) {
  const teams: TeamRecord[] = []
  const teamRows: Array<Record<string, unknown>> = []
  const teamMembers: Array<Record<string, unknown>> = []
  let teamIndex = 1

  for (const department of DEPARTMENTS.slice(1)) {
    const employees = employeesByDepartment.get(department.id) ?? []
    const managersAndLeads = employees.filter(
      (employee) => employee.layer === 'manager' || employee.layer === 'lead',
    )
    const memberPool = employees.filter((employee) => employee.layer !== 'head')
    const teamCount = clamp(Math.round(department.size / 65), 3, 32)
    const chunkSize = Math.max(6, Math.ceil(memberPool.length / teamCount))

    for (let index = 0; index < teamCount; index += 1) {
      const lead = managersAndLeads[index % managersAndLeads.length] ?? employees[0]
      const sliceStart = index * chunkSize
      const sliceEnd = sliceStart + chunkSize
      const memberIds = new Set(
        memberPool.slice(sliceStart, sliceEnd).map((employee) => employee.id),
      )
      memberIds.add(lead.id)

      const teamId = id('team', teamIndex)
      const name = `${department.name} ${['North', 'Central', 'Scale', 'Core', 'Velocity', 'Studio'][index % 6]} Team ${Math.floor(index / 6) + 1}`
      teamRows.push({
        id: teamId,
        name,
        description: `${department.name} delivery team focused on ${department.projectThemes[index % department.projectThemes.length].toLowerCase()}.`,
        specialization: department.projectThemes[index % department.projectThemes.length],
        leadId: lead.id,
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      })

      for (const userId of memberIds) {
        teamMembers.push({
          teamId,
          userId,
          joinedAt: CREATED_AT,
        })
      }

      teams.push({
        id: teamId,
        departmentId: department.id,
        leadId: lead.id,
        memberIds: [...memberIds],
      })
      teamIndex += 1
    }
  }

  return { teams, teamRows, teamMembers }
}

function buildProjects(
  random: SeededRandom,
  teams: TeamRecord[],
  employeesByDepartment: Map<string, EmployeeRecord[]>,
  skills: Array<Record<string, unknown>>,
  clients: Array<Record<string, unknown>>,
  campaigns: Array<Record<string, unknown>>,
) {
  const categoriesByDepartment = departmentCategoryMap()
  const skillIds = skillIdMap(skills)
  const teamByDepartment = new Map<string, TeamRecord[]>()
  for (const team of teams) {
    const entries = teamByDepartment.get(team.departmentId) ?? []
    entries.push(team)
    teamByDepartment.set(team.departmentId, entries)
  }

  const projects: ProjectRecord[] = []
  const projectRows: Array<Record<string, unknown>> = []
  const projectSkills: Array<Record<string, unknown>> = []
  const projectMembers: Array<Record<string, unknown>> = []
  let projectIndex = 1
  let projectMemberIndex = 1
  const clientIds = clients.map((client) => String(client.id))
  const campaignIdsByClient = new Map<string, string[]>()
  for (const campaign of campaigns) {
    const clientId = String(campaign.clientId)
    const entries = campaignIdsByClient.get(clientId) ?? []
    entries.push(String(campaign.id))
    campaignIdsByClient.set(clientId, entries)
  }

  for (const department of DEPARTMENTS.slice(1)) {
    const employees = employeesByDepartment.get(department.id) ?? []
    const headsAndManagers = employees.filter(
      (employee) =>
        employee.layer === 'head' || employee.layer === 'director' || employee.layer === 'manager',
    )
    const departmentTeams = teamByDepartment.get(department.id) ?? []
    const projectCount = clamp(Math.round(department.size / 95), 4, 30)

    for (let index = 0; index < projectCount; index += 1) {
      const startDate = new Date(2024, random.int(0, 11), random.int(1, 28))
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + random.int(4, 18))
      const statusOptions = ['planning', 'active', 'active', 'active', 'on_hold', 'completed']
      const typeOptions = department.clientFacing
        ? ['external', 'external', 'internal', 'maintenance']
        : ['internal', 'internal', 'research', 'maintenance']
      const owner = headsAndManagers[index % headsAndManagers.length] ?? employees[0]
      const manager = headsAndManagers[(index + 3) % headsAndManagers.length] ?? owner
      const projectTeamCount = clamp(random.int(1, 3), 1, Math.max(1, departmentTeams.length))
      const selectedTeams = random.sample(departmentTeams, projectTeamCount)
      const memberIds = new Set<string>([owner.id, manager.id])
      for (const team of selectedTeams) {
        for (const userId of random.sample(
          team.memberIds,
          clamp(random.int(5, 14), 3, team.memberIds.length),
        )) {
          memberIds.add(userId)
        }
      }
      if (memberIds.size < 6) {
        for (const extraMember of random.sample(employees, 8)) {
          memberIds.add(extraMember.id)
        }
      }

      const clientId = department.clientFacing
        ? random.pick(clientIds)
        : random.chance(0.18)
          ? random.pick(clientIds)
          : null
      const campaignId = clientId ? random.pick(campaignIdsByClient.get(clientId) ?? []) : null
      const projectId = id('project', projectIndex)
      const projectName = `${department.projectThemes[index % department.projectThemes.length]} ${['Modernization', 'Platform', 'Wave', 'Initiative', 'Program'][index % 5]} ${Math.floor(index / 5) + 1}`
      const categoryIds = categoriesByDepartment.get(department.id) ?? ['cat_delivery_program']
      const resolvedSkillIds = department.coreSkills
        .map((name) => skillIds.get(name))
        .filter(Boolean) as string[]
      const selectedSkillIds = random.sample(
        resolvedSkillIds,
        clamp(random.int(2, 4), 2, resolvedSkillIds.length),
      )

      projectRows.push({
        id: projectId,
        name: projectName,
        description: `${projectName} is a ${department.name.toLowerCase()} initiative aligned to the enterprise operating plan.`,
        startDate: iso(startDate),
        endDate: iso(endDate),
        status: statusOptions[index % statusOptions.length],
        type: typeOptions[index % typeOptions.length],
        priority: ['low', 'medium', 'high'][random.int(0, 2)],
        budget: random.int(350_000, department.clientFacing ? 9_000_000 : 5_500_000),
        departmentId: department.id,
        clientId,
        campaignId,
        createdAt: iso(new Date(startDate.getTime() - 1000 * 60 * 60 * 24 * 21)),
        updatedAt: CREATED_AT,
      })

      for (const skillId of selectedSkillIds) {
        projectSkills.push({ projectId, skillId })
      }

      const memberList = [...memberIds]
      memberList.forEach((userId, memberIndex) => {
        let role = 'contributor'
        if (memberIndex === 0) {
          role = 'owner'
        } else if (memberIndex === 1) {
          role = 'manager'
        } else if (memberIndex > memberList.length - 3) {
          role = 'viewer'
        }

        projectMembers.push({
          id: id('pm', projectMemberIndex),
          projectId,
          userId,
          role,
          joinedAt: iso(new Date(startDate.getTime() - 1000 * 60 * 60 * 24 * random.int(5, 45))),
          updatedAt: CREATED_AT,
        })
        projectMemberIndex += 1
      })

      projects.push({
        id: projectId,
        departmentId: department.id,
        name: projectName,
        startDate: iso(startDate),
        endDate: iso(endDate),
        memberIds: memberList,
        ownerId: owner.id,
        managerId: manager.id,
        skillIds: selectedSkillIds,
        categoryIds,
        clientId,
      })
      projectIndex += 1
    }
  }

  return { projects, projectRows, projectSkills, projectMembers }
}

function buildTodosAndDependencies(random: SeededRandom, projects: ProjectRecord[]) {
  const todos: Array<Record<string, unknown>> = []
  const dependencies: Array<Record<string, unknown>> = []
  const verbs = [
    'Define',
    'Implement',
    'Validate',
    'Roll out',
    'Optimize',
    'Document',
    'Review',
    'Automate',
  ]
  const nouns = [
    'workflow',
    'dashboard',
    'approval path',
    'migration batch',
    'service layer',
    'report',
    'playbook',
    'integration',
  ]
  let todoIndex = 1

  for (const project of projects) {
    const taskCount = clamp(18 + Math.round(project.memberIds.length * 1.9), 18, 92)
    const taskIdsInProject: string[] = []

    for (let index = 0; index < taskCount; index += 1) {
      const idValue = id('todo', todoIndex)
      taskIdsInProject.push(idValue)
      const createdAt = new Date(project.startDate)
      createdAt.setDate(createdAt.getDate() + random.int(0, 210))
      const dueDate = new Date(createdAt)
      dueDate.setDate(dueDate.getDate() + random.int(5, 28))
      const status = random.pick([
        'pending',
        'in_progress',
        'completed',
        'completed',
        'testing',
        'blocked',
      ])
      const assignee = project.memberIds[index % project.memberIds.length]
      const creator = project.memberIds[(index + 3) % project.memberIds.length]

      todos.push({
        id: idValue,
        title: `${random.pick(verbs)} ${random.pick(nouns)} ${Math.floor(index / 6) + 1}`,
        description: `${project.name} execution task ${index + 1} covering planning, delivery, and validation work.`,
        status,
        priority: random.pick(['low', 'medium', 'medium', 'high']),
        complexity: random.int(1, 5),
        estimatedTime: random.int(2, 80),
        actualTime: status === 'completed' || status === 'testing' ? random.int(2, 88) : null,
        dueDate: iso(dueDate),
        completedAt:
          status === 'completed'
            ? iso(new Date(dueDate.getTime() - 1000 * 60 * 60 * 24 * random.int(0, 4)))
            : null,
        acceptanceCriteria:
          'Definition of done documented, reviewed, and accepted by the owning team.',
        createdBy: creator,
        assignedTo: assignee,
        projectId: project.id,
        categoryId: project.categoryIds[index % project.categoryIds.length],
        createdAt: iso(createdAt),
        updatedAt: CREATED_AT,
      })

      if (index > 1 && random.chance(0.24)) {
        dependencies.push({
          todoId: idValue,
          dependsOnId: taskIdsInProject[random.int(Math.max(0, index - 4), index - 1)],
        })
      }

      todoIndex += 1
    }
  }

  return { todos, dependencies }
}

function buildTransactions(
  random: SeededRandom,
  projects: ProjectRecord[],
  clients: Array<Record<string, unknown>>,
  employeesById: Map<string, EmployeeRecord>,
) {
  const clientMap = new Map(clients.map((client) => [String(client.id), client]))
  const transactions: Array<Record<string, unknown>> = []
  let transactionIndex = 1

  for (const project of projects) {
    const transactionCount = clamp(Math.round(project.memberIds.length / 2.5), 4, 14)
    const owner = employeesById.get(project.ownerId)
    const approver = employeesById.get(project.managerId) ?? owner

    for (let index = 0; index < transactionCount; index += 1) {
      const date = new Date(project.startDate)
      date.setDate(date.getDate() + random.int(10, 240))
      const status = random.pick(['Approved', 'Approved', 'Pending', 'Rejected'])
      const client = project.clientId ? clientMap.get(project.clientId) : null
      const customerName = client ? String(client.name) : `${project.name} Cost Center`
      const customerEmail = client
        ? String(client.contactEmail ?? `finance@${slugify(String(client.name))}.example`)
        : `finance+${slugify(project.name)}@microsoft-demo.local`

      transactions.push({
        id: id('txn', transactionIndex),
        customerName,
        customerEmail,
        status,
        date: iso(date),
        amount: random.int(20_000, project.clientId ? 780_000 : 240_000),
        paymentMethod: random.pick([
          'Wire Transfer',
          'ACH',
          'Purchase Order',
          'Internal Allocation',
        ]),
        description: `${project.name} funding event ${index + 1}.`,
        userId: owner?.id ?? project.ownerId,
        projectId: project.id,
        categoryId: project.categoryIds[index % project.categoryIds.length],
        assignedAdminId: approver?.id ?? project.managerId,
        approvedBy: status === 'Approved' ? (approver?.id ?? project.managerId) : null,
        approvedAt:
          status === 'Approved'
            ? iso(new Date(date.getTime() + 1000 * 60 * 60 * 24 * random.int(1, 5)))
            : null,
        rejectionReason:
          status === 'Rejected'
            ? random.pick([
                'Budget threshold exceeded',
                'Missing scope detail',
                'Awaiting revised quote',
              ])
            : null,
      })
      transactionIndex += 1
    }
  }

  return transactions
}

export function generateCorporateSnapshot(): CorporateSnapshot {
  const random = new SeededRandom(SNAPSHOT_SEED)
  const roles = buildRoleRows()
  const experienceLevels = buildExperienceRows()
  const skills = buildSkillRows()
  const jobTitles = buildJobTitleRows()
  const aiTechnologies = buildAiTechnologyRows()
  const clients = buildClientRows(random)
  const campaigns = buildCampaignRows(random, clients)
  const categories = buildCategoryRows()
  const { employees, employeesById, employeesByDepartment, departmentManagers } =
    buildEmployeeHierarchy(random, jobTitles)
  const authUsers = buildAuthUsers(employees)
  const users = buildUserRows(employees)
  const externalIdentities = buildExternalIdentities(random, employees)
  const userSkills = buildUserSkills(random, employeesByDepartment, skills)
  const departments = buildDepartmentRows(departmentManagers)
  const { teams, teamRows, teamMembers } = buildTeams(employeesByDepartment)
  const { projects, projectRows, projectSkills, projectMembers } = buildProjects(
    random,
    teams,
    employeesByDepartment,
    skills,
    clients,
    campaigns,
  )
  const { todos, dependencies } = buildTodosAndDependencies(random, projects)
  const transactions = buildTransactions(random, projects, clients, employeesById)

  return {
    metadata: {
      companyName: COMPANY_NAME,
      generatedAt: NOW.toISOString(),
      seed: SNAPSHOT_SEED,
      employeeCount: users.length,
    },
    roles,
    skills,
    jobTitles,
    experienceLevels,
    aiTechnologies,
    clients,
    campaigns,
    authUsers,
    users,
    externalIdentities,
    userSkills,
    departments,
    projects: projectRows,
    projectSkills,
    projectMembers,
    todos,
    todoDependencies: dependencies,
    transactions,
    categories,
    teams: teamRows,
    teamMembers,
  }
}

export function buildSnapshotSummary(snapshot: CorporateSnapshot) {
  return {
    metadata: snapshot.metadata,
    counts: {
      roles: snapshot.roles.length,
      skills: snapshot.skills.length,
      jobTitles: snapshot.jobTitles.length,
      experienceLevels: snapshot.experienceLevels.length,
      aiTechnologies: snapshot.aiTechnologies.length,
      clients: snapshot.clients.length,
      campaigns: snapshot.campaigns.length,
      authUsers: snapshot.authUsers.length,
      users: snapshot.users.length,
      externalIdentities: snapshot.externalIdentities.length,
      userSkills: snapshot.userSkills.length,
      departments: snapshot.departments.length,
      teams: snapshot.teams.length,
      teamMembers: snapshot.teamMembers.length,
      projects: snapshot.projects.length,
      projectSkills: snapshot.projectSkills.length,
      projectMembers: snapshot.projectMembers.length,
      categories: snapshot.categories.length,
      todos: snapshot.todos.length,
      todoDependencies: snapshot.todoDependencies.length,
      transactions: snapshot.transactions.length,
    },
  }
}

export async function writeCorporateSnapshot() {
  const snapshot = generateCorporateSnapshot()
  const summary = buildSnapshotSummary(snapshot)

  await mkdir(SNAPSHOT_DIRECTORY, { recursive: true })
  await writeFile(CORPORATE_SNAPSHOT_PATH, JSON.stringify(snapshot))
  await writeFile(CORPORATE_SNAPSHOT_SUMMARY_PATH, JSON.stringify(summary, null, 2))

  return summary
}

export async function readCorporateSnapshot() {
  const raw = await readFile(CORPORATE_SNAPSHOT_PATH, 'utf8')
  return JSON.parse(raw) as CorporateSnapshot
}
