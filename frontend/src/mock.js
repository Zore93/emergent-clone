// Mock data for Emergent clone

export const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQs', href: '#faqs' },
  { label: 'Enterprise', href: '#enterprise' },
];

export const agentSlides = [
  [
    { name: 'Research Agent', desc: 'Scans the web, compiles insights, and generates professional reports.', icon: 'Bot' },
    { name: 'Data Analyst Agent', desc: 'Analyzes trends, models data, and visualizes it with clear dashboards.', icon: 'BarChart3' },
    { name: 'Automation Engineer', desc: 'Connects APIs, automates workflows, and handles scheduled tasks.', icon: 'Workflow' },
    { name: 'And many more', desc: 'From SaaS builders to legacy upgraders - your agent team does it all.', icon: 'Plus' },
  ],
  [
    { name: 'Content Writer', desc: 'Drafts blogs, social posts, and marketing copy that converts.', icon: 'PenLine' },
    { name: 'Customer Support', desc: 'Answers tickets 24/7 with brand-aligned tone and context.', icon: 'Headphones' },
    { name: 'SEO Specialist', desc: 'Audits pages, finds keywords, and tracks ranking changes.', icon: 'Search' },
    { name: 'Sales Assistant', desc: 'Qualifies leads, books meetings, and follows up on time.', icon: 'TrendingUp' },
  ],
  [
    { name: 'Code Reviewer', desc: 'Spots bugs, security issues, and style improvements in PRs.', icon: 'Code2' },
    { name: 'QA Engineer', desc: 'Writes tests, runs them on every commit, and reports failures.', icon: 'CheckCircle2' },
    { name: 'Database Architect', desc: 'Designs schemas, optimizes queries, and migrates safely.', icon: 'Database' },
    { name: 'DevOps Pilot', desc: 'Provisions cloud, monitors uptime, and rolls back on errors.', icon: 'Server' },
  ],
  [
    { name: 'Finance Analyst', desc: 'Forecasts revenue, tracks burn, and flags unusual spending.', icon: 'DollarSign' },
    { name: 'HR Recruiter', desc: 'Screens resumes, schedules interviews, and drafts offers.', icon: 'Users' },
    { name: 'Legal Reviewer', desc: 'Reads contracts, highlights risks, and suggests redlines.', icon: 'Scale' },
    { name: 'Marketing Strategist', desc: 'Plans campaigns, designs funnels, and measures ROI.', icon: 'Megaphone' },
  ],
];

export const showcase = [
  { mob: 'https://assets.emergent.sh/assets/showcase/Mob1.webp', lap: 'https://assets.emergent.sh/assets/showcase/Laptop1.webp' },
  { mob: 'https://assets.emergent.sh/assets/showcase/Mob2.webp', lap: 'https://assets.emergent.sh/assets/showcase/Laptop2.webp' },
  { mob: 'https://assets.emergent.sh/assets/showcase/Mob3.webp', lap: 'https://assets.emergent.sh/assets/showcase/Laptop3.webp' },
  { mob: 'https://assets.emergent.sh/assets/showcase/Mob4.webp', lap: 'https://assets.emergent.sh/assets/showcase/Laptop4.webp' },
];

export const featureTabs = [
  {
    id: 'apps',
    title: 'Build websites and mobile apps',
    desc: 'Transform your ideas into fully functional websites and mobile apps with instant deployment, seamless data connections, and powerful scalability.',
    icon: 'LayoutGrid',
  },
  {
    id: 'agents',
    title: 'Build custom agents',
    desc: 'Design specialised AI agents that automate research, analysis, and operations across your stack — without writing glue code.',
    icon: 'Bot',
  },
  {
    id: 'integrations',
    title: 'Build powerful integrations',
    desc: 'Plug into 200+ services like Stripe, Slack, Notion and your own internal APIs. One‑click LLM and OAuth ready.',
    icon: 'Plug',
  },
];

export const individualPlans = [
  {
    name: 'Free',
    tag: 'Get started with essential features at no cost',
    price: 0,
    icon: 'Gift',
    features: [
      '10 free monthly credits',
      'Unlock all core platform features',
      'Build elegant Web and Mobile experiences',
      'Instant access to the most advanced models',
      'One-click LLM integration',
    ],
    cta: 'Start for free',
    highlighted: false,
  },
  {
    name: 'Standard',
    tag: 'Perfect for first-time builders',
    priceMonthly: 20,
    priceAnnual: 17,
    saveAnnual: 36,
    icon: 'Compass',
    features: [
      'Build web & mobile apps',
      'Private project hosting',
      '100 credits per month',
      'Purchase extra credits as needed',
      'GitHub integration',
      'Community support',
    ],
    cta: 'Go Standard',
    highlighted: true,
  },
  {
    name: 'Pro',
    tag: 'Built for serious creators and brands',
    priceMonthly: 200,
    priceAnnual: 167,
    saveAnnual: 396,
    icon: 'Sparkles',
    features: [
      '1M context window',
      'Ultra thinking',
      'System Prompt Edit',
      'Create custom AI agents',
      'High-performance computing',
      'Priority email support',
    ],
    cta: 'Go Pro',
    highlighted: false,
  },
];

export const enterprisePlans = [
  {
    name: 'Team',
    tag: 'Collaboration for growing companies',
    priceMonthly: 99,
    priceAnnual: 79,
    saveAnnual: 240,
    icon: 'Users',
    features: [
      'Up to 10 seats included',
      'Shared workspaces & projects',
      'Role-based access controls',
      'Audit logs',
      'SSO with Google & Microsoft',
      'Email & chat support',
    ],
    cta: 'Start Team plan',
    highlighted: true,
  },
  {
    name: 'Business',
    tag: 'Scale across departments with confidence',
    priceMonthly: 299,
    priceAnnual: 249,
    saveAnnual: 600,
    icon: 'Building2',
    features: [
      'Up to 50 seats included',
      'Advanced security & compliance',
      'Custom integrations',
      'Dedicated success manager',
      'SLA-backed uptime',
      'Priority support',
    ],
    cta: 'Choose Business',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    tag: 'For organisations with bespoke needs',
    price: 'Custom',
    icon: 'ShieldCheck',
    features: [
      'Unlimited seats',
      'On-prem or VPC deployment',
      'Custom data residency',
      'White-glove onboarding',
      'Custom LLM bring-your-own-key',
      '24/7 dedicated support',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
];

export const faqs = [
  {
    q: 'What can I build with Emergent?',
    a: 'Anything from a quick prototype to a production-ready web or mobile app. Dashboards, marketplaces, internal tools, AI agents, and full SaaS products — all generated and deployed in minutes.',
  },
  {
    q: "How does Emergent's pricing work?",
    a: 'You start free with 10 monthly credits. Paid plans unlock more credits, private hosting, advanced models, and extra collaboration features. You can switch or cancel any time.',
  },
  {
    q: 'Do I need coding experience to use Emergent?',
    a: "No. Emergent is designed for everyone — describe what you want in plain English and Emergent will build it. If you do know how to code, you can edit and extend the generated code freely.",
  },
  {
    q: 'How is Emergent different from other no-code platforms?',
    a: 'Emergent generates real, production-grade code (React, FastAPI, MongoDB) that you fully own. You are never locked into a proprietary runtime — you can export, self-host, or fork at any moment.',
  },
  {
    q: 'What happens to the code Emergent creates?',
    a: 'It is yours. Connect your GitHub and we will push directly to your repository. You can download, deploy or modify it without restrictions.',
  },
];
