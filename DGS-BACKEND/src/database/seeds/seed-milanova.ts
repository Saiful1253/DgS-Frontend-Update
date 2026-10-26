import { DataSource, DeepPartial } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { CompanySetting } from '../../settings/entities/company-setting.entity';
import { Service } from '../../services/entities/service.entity';
import { ServiceGroup } from '../../services/entities/service-group.entity';
import { ServicePillar } from '../../services/entities/service-pillar.entity';
import { Blog } from '../../blogs/entities/blog.entity';
import { BlogCategory } from '../../blogs/entities/blog-category.entity';
import { HeroSection } from '../../hero/entities/hero-section.entity';
import { HeroMedia } from '../../hero/entities/hero-media.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { PortfolioChallenge } from '../../portfolio/entities/portfolio-challenge.entity';
import { PortfolioPricingTier } from '../../portfolio/entities/portfolio-pricing-tier.entity';
import { Job } from '../../careers/entities/job.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { seedAdminData } from './admin-seed.helper';

const AppDataSource = new DataSource({ ...dataSourceOptions, synchronize: false });

async function seedMilanoVAData() {
  console.log('--- Initializing MilanoVA Database Seeder ---');
  await AppDataSource.initialize();

  const companyRepo = AppDataSource.getRepository(CompanySetting);
  const serviceRepo = AppDataSource.getRepository(Service);
  const serviceGroupRepo = AppDataSource.getRepository(ServiceGroup);
  const servicePillarRepo = AppDataSource.getRepository(ServicePillar);
  const blogRepo = AppDataSource.getRepository(Blog);
  const blogCategoryRepo = AppDataSource.getRepository(BlogCategory);
  const portfolioRepo = AppDataSource.getRepository(Portfolio);
  const jobRepo = AppDataSource.getRepository(Job);
  const leadRepo = AppDataSource.getRepository(Lead);

  // 1. Company Settings
  const existingSetting = await companyRepo.findOne({ where: { id: 1 } });
  if (!existingSetting) {
    await companyRepo.save({
      id: 1,
      legal_company_name: 'Milanova Technologies S.R.L.',
      brand_name: 'Milanova Technologies',
      mission_purpose: 'To build simple, scalable, and secure digital products that empower businesses to operate efficiently and grow without technical friction.',
      incorporation_details: 'Italy Registered, REA MI-2049182',
      eu_standards_badge_info: 'GDPR Compliant · ISO 27001 Certified Architecture',
      primary_headquarters_address: 'Via Montenapoleone 8, 20121 Milan, Italy',
      branch_addresses: [
        { city: 'Milan', country: 'Italy', address: 'Via Montenapoleone 8, 20121 Milan', phone: '+39 02 1234 5678' },
        { city: 'Dhaka', country: 'Bangladesh', address: 'Gulshan 2, Dhaka 1212', phone: '+880 1700 000000' },
      ],
      official_emails: {
        general: 'info@milanovatech.com',
        support: 'support@milanovatech.com',
        sales: 'sales@milanovatech.com',
        careers: 'careers@milanovatech.com',
      },
      official_phones: { phone: '+39 02 1234 5678', whatsapp: '+39 340 000 0000', country_code: '+39' },
      social_links: {
        linkedin: 'https://linkedin.com/company/milanova-technologies',
        facebook: 'https://facebook.com/milanovatech',
        twitter: 'https://x.com/milanovatech',
        github: 'https://github.com/milanovatech',
        youtube: 'https://youtube.com/@milanovatech',
      },
      calendly_url: 'https://calendly.com/milanova-tech/30min',
    });
    console.log(' ✓ Company settings seeded');
  }

  // 3. Pillars, Groups & 30 SRS Services (Idempotent by slug)
  const rawPillars = [
    { name: 'Software Development', slug: 'software-development', display_label: 'Software & Cloud', blurb: 'Engineering, AI, and cloud infrastructure for scalable operations.', display_order: 1 },
    { name: 'Creative Services', slug: 'creative-services', display_label: 'Creative & Post-Production', blurb: 'Retouching, motion, 3D, and brand systems for commercial output.', display_order: 2 },
    { name: 'Digital Marketing', slug: 'digital-marketing', display_label: 'Marketing & Growth', blurb: 'Paid acquisition, search positioning, and content architecture.', display_order: 3 },
    { name: 'Managed Services & Support', slug: 'managed-services-support', display_label: 'Managed Services & Support', blurb: 'SLA-backed maintenance, monitoring, and dedicated delivery teams that keep systems healthy.', display_order: 4 },
    { name: 'Data & Analytics', slug: 'data-analytics', display_label: 'Data & Analytics', blurb: 'Measurement, attribution, and dashboards that turn raw events into confident decisions.', display_order: 5 },
    { name: 'Growth & Conversion', slug: 'growth-conversion', display_label: 'Growth & Conversion', blurb: 'Landing pages, experimentation, and lifecycle automation that turn traffic into revenue.', display_order: 6 },
    { name: 'Strategy & Consulting', slug: 'strategy-consulting', display_label: 'Strategy & Advisory', blurb: 'Discovery, audits, and roadmaps that de-risk investment before a line of code is written.', display_order: 7 },
  ];

  const pillarMap = new Map<string, ServicePillar>();
  for (const p of rawPillars) {
    let pillar = await servicePillarRepo.findOne({ where: { slug: p.slug } });
    if (!pillar) {
      pillar = await servicePillarRepo.save(servicePillarRepo.create(p));
    }
    pillarMap.set(p.name, pillar);
  }
  console.log(` ✓ Service pillars seeded (${pillarMap.size})`);

  const rawGroups = [
    // Pillar: Software Development
    { pillar: 'Software Development', name: 'Custom Software & Web Platforms', slug: 'custom-software-web-platforms', display_order: 1 },
    { pillar: 'Software Development', name: 'AI Code & Low-Code Rescue', slug: 'ai-code-low-code-rescue', display_order: 2 },
    { pillar: 'Software Development', name: 'Enterprise & System Modernization', slug: 'enterprise-system-modernization', display_order: 3 },
    { pillar: 'Software Development', name: 'Product & Cloud Infrastructure Maintenance', slug: 'product-cloud-infrastructure-maintenance', display_order: 4 },
    { pillar: 'Software Development', name: 'AI Architecture & Automation', slug: 'ai-architecture-automation', display_order: 5 },
    // Pillar: Creative Services
    { pillar: 'Creative Services', name: 'High-End Commercial Image Retouching', slug: 'high-end-commercial-image-retouching', display_order: 1 },
    { pillar: 'Creative Services', name: 'Commercial Video & Motion Production', slug: 'commercial-video-motion-production', display_order: 2 },
    { pillar: 'Creative Services', name: '3D & Spatial Visualization', slug: '3d-spatial-visualization', display_order: 3 },
    { pillar: 'Creative Services', name: 'Brand & UI/UX Experience', slug: 'brand-ui-ux-experience', display_order: 4 },
    // Pillar: Digital Marketing
    { pillar: 'Digital Marketing', name: 'Paid Ads & Performance Marketing', slug: 'paid-ads-performance-marketing', display_order: 1 },
    { pillar: 'Digital Marketing', name: 'Search Positioning & Ranking (SEO)', slug: 'search-positioning-ranking-seo', display_order: 2 },
    { pillar: 'Digital Marketing', name: 'Brand Strategy & Content Architecture', slug: 'brand-strategy-content-architecture', display_order: 3 },
    // Pillar: Managed Services & Support
    { pillar: 'Managed Services & Support', name: 'Managed Support & SLAs', slug: 'managed-support-slas', display_order: 1 },
    { pillar: 'Managed Services & Support', name: 'Dedicated Delivery Teams', slug: 'dedicated-delivery-teams', display_order: 2 },
    // Pillar: Data & Analytics
    { pillar: 'Data & Analytics', name: 'Business Intelligence & Dashboards', slug: 'business-intelligence-dashboards', display_order: 1 },
    { pillar: 'Data & Analytics', name: 'Tracking, Attribution & Data Pipelines', slug: 'tracking-attribution-data-pipelines', display_order: 2 },
    // Pillar: Growth & Conversion
    { pillar: 'Growth & Conversion', name: 'Landing Pages & Conversion', slug: 'landing-pages-conversion', display_order: 1 },
    { pillar: 'Growth & Conversion', name: 'Lifecycle, CRM & Retention', slug: 'lifecycle-crm-retention', display_order: 2 },
    // Pillar: Strategy & Consulting
    { pillar: 'Strategy & Consulting', name: 'Discovery & Solution Workshops', slug: 'discovery-solution-workshops', display_order: 1 },
    { pillar: 'Strategy & Consulting', name: 'Audits & Architecture Advisory', slug: 'audits-architecture-advisory', display_order: 2 },
  ];

  const groupMap = new Map<string, ServiceGroup>();
  for (const g of rawGroups) {
    const pEntity = pillarMap.get(g.pillar);
    let group = await serviceGroupRepo.findOne({ where: { slug: g.slug } });
    if (!group) {
      group = await serviceGroupRepo.save(
        serviceGroupRepo.create({
          ...g,
          pillar_id: pEntity ? pEntity.id : null,
        }),
      );
    } else if (!group.pillar_id && pEntity) {
      group.pillar_id = pEntity.id;
      await serviceGroupRepo.save(group);
    }
    groupMap.set(g.slug, group);
  }
  console.log(` ✓ Service groups seeded (${groupMap.size})`);

  const rawServices = [
    // Software & Cloud (15)
    { groupSlug: 'custom-software-web-platforms', name: 'Custom Software Development', slug: 'custom-software-development', pillar: 'Software Development', description: 'End-to-end web and software applications built from scalable architecture to secure deployment using Next.js and NestJS.', icon_url: '/images/services/web-dev.svg', display_order: 1 },
    { groupSlug: 'custom-software-web-platforms', name: 'SaaS & MVP Engineering', slug: 'saas-mvp-engineering', pillar: 'Software Development', description: 'Full-cycle SaaS builds featuring multi-tenant databases, billing engines, admin controls, and rapid MVP release cycles.', icon_url: '/images/services/saas.svg', display_order: 2 },
    { groupSlug: 'custom-software-web-platforms', name: 'Mobile App Development', slug: 'mobile-app-development', pillar: 'Software Development', description: 'Cross-platform React Native and Flutter mobile applications with native device capabilities and seamless offline sync.', icon_url: '/images/services/mobile.svg', display_order: 3 },

    { groupSlug: 'ai-code-low-code-rescue', name: 'AI Code Debugging & Refactoring', slug: 'ai-code-debugging-refactoring', pillar: 'Software Development', description: 'Deep code audits and refactoring to eliminate technical debt, memory leaks, and unmaintainable legacy abstractions.', icon_url: '/images/services/ai-debug.svg', display_order: 1 },
    { groupSlug: 'ai-code-low-code-rescue', name: 'Low-Code / No-Code Audits', slug: 'low-code-no-code-audits', pillar: 'Software Development', description: 'Architectural review and migration strategies for scaling beyond visual drag-and-drop tool limitations.', icon_url: '/images/services/low-code.svg', display_order: 2 },
    { groupSlug: 'ai-code-low-code-rescue', name: 'Performance & Security Patching', slug: 'performance-security-patching', pillar: 'Software Development', description: 'Hardening existing codebases against OWASP top 10 vulnerabilities, slow SQL queries, and API latency bottlenecks.', icon_url: '/images/services/security.svg', display_order: 3 },

    { groupSlug: 'enterprise-system-modernization', name: 'Enterprise Solutions', slug: 'enterprise-solutions', pillar: 'Software Development', description: 'High-availability microservice backends, ERP/CRM customizations, and enterprise workflow engines.', icon_url: '/images/services/enterprise.svg', display_order: 1 },
    { groupSlug: 'enterprise-system-modernization', name: 'Legacy System Modernization', slug: 'legacy-system-modernization', pillar: 'Software Development', description: 'Incremental strangler-fig migration of monolithic legacys to cloud-native microservices with zero downtime.', icon_url: '/images/services/legacy.svg', display_order: 2 },
    { groupSlug: 'enterprise-system-modernization', name: 'System Integration & QA', slug: 'system-integration-qa', pillar: 'Software Development', description: 'Third-party API integration, webhook orchestrations, and automated end-to-end integration test suites.', icon_url: '/images/services/qa.svg', display_order: 3 },

    { groupSlug: 'product-cloud-infrastructure-maintenance', name: 'Software Product Maintenance', slug: 'software-product-maintenance', pillar: 'Software Development', description: 'Continuous SLAs, bug fixes, dependency updates, and feature upgrades to keep software healthy over time.', icon_url: '/images/services/maintenance.svg', display_order: 1 },
    { groupSlug: 'product-cloud-infrastructure-maintenance', name: 'Cloud Infrastructure Maintenance', slug: 'cloud-infrastructure-maintenance', pillar: 'Software Development', description: 'Proactive monitoring, autoscaling policies, cost optimization, and infrastructure as code management.', icon_url: '/images/services/cloud-maint.svg', display_order: 2 },
    { groupSlug: 'product-cloud-infrastructure-maintenance', name: 'Cloud Migration & DevOps', slug: 'cloud-migration-devops', pillar: 'Software Development', description: 'AWS, GCP, and Azure Kubernetes migrations with automated CI/CD deployment pipelines.', icon_url: '/images/services/devops.svg', display_order: 3 },

    { groupSlug: 'ai-architecture-automation', name: 'AI Integration & Agents', slug: 'ai-integration-agents', pillar: 'Software Development', description: 'Custom AI agent pipelines, LLM fine-tuning, and RAG document search engines powered by Claude & OpenAI.', icon_url: '/images/services/ai-automation.svg', display_order: 1 },
    { groupSlug: 'ai-architecture-automation', name: 'AI Chatbots & Search', slug: 'ai-chatbots-search', pillar: 'Software Development', description: 'Context-aware conversational assistants and vector database semantic search integrated into consumer products.', icon_url: '/images/services/chatbots.svg', display_order: 2 },
    { groupSlug: 'ai-architecture-automation', name: 'AI Analytics & Data', slug: 'ai-analytics-data', pillar: 'Software Development', description: 'Predictive analytics pipelines, automated ETL data processing, and intelligence dashboards.', icon_url: '/images/services/analytics.svg', display_order: 3 },

    // Creative & Post-Production (9)
    { groupSlug: 'high-end-commercial-image-retouching', name: 'E-Commerce & Product Retouching', slug: 'ecommerce-product-retouching', pillar: 'Creative Services', description: 'Pixel-perfect high-volume catalog retouching, color matching, and ghost mannequin processing.', icon_url: '/images/services/photography.svg', display_order: 1 },
    { groupSlug: 'high-end-commercial-image-retouching', name: 'Specialized Retouching', slug: 'specialized-retouching', pillar: 'Creative Services', description: 'Commercial beauty, jewelry, luxury editorial, and composite image retouching for advertising.', icon_url: '/images/services/specialized-retouching.svg', display_order: 2 },

    { groupSlug: 'commercial-video-motion-production', name: 'Commercial Video Editing', slug: 'commercial-video-editing', pillar: 'Creative Services', description: 'Professional color grading, audio master mix, and commercial story cuts for product launches.', icon_url: '/images/services/video-editing.svg', display_order: 1 },
    { groupSlug: 'commercial-video-motion-production', name: 'Social & Short-Form Video', slug: 'social-short-form-video', pillar: 'Creative Services', description: 'High-engagement Reels, Shorts, and TikTok video edits tailored for immediate audience retention.', icon_url: '/images/services/short-video.svg', display_order: 2 },
    { groupSlug: 'commercial-video-motion-production', name: 'Motion Graphics & Animation', slug: 'motion-graphics-animation', pillar: 'Creative Services', description: '2D & 3D explainer animations, logo stings, kinetic typography, and broadcast motion assets.', icon_url: '/images/services/brand.svg', display_order: 3 },

    { groupSlug: '3d-spatial-visualization', name: '3D Modeling & Product Render', slug: '3d-spatial-visualization', pillar: 'Creative Services', description: 'Photorealistic 3D product renders, CAD conversion, and interactive webGL 3D configurators.', icon_url: '/images/services/3d-render.svg', display_order: 1 },
    { groupSlug: '3d-spatial-visualization', name: 'Architectural Visualization', slug: 'architectural-visualization', pillar: 'Creative Services', description: 'Spatial walkthroughs, exterior lighting renders, and interior architectural CGI visual concepts.', icon_url: '/images/services/arch-viz.svg', display_order: 2 },

    { groupSlug: 'brand-ui-ux-experience', name: 'UI/UX Product Design', slug: 'ui-ux-product-design', pillar: 'Creative Services', description: 'User-centric wireframing, high-fidelity Figma design systems, and conversion-optimized UX flows.', icon_url: '/images/services/ui-ux.svg', display_order: 1 },
    { groupSlug: 'brand-ui-ux-experience', name: 'Brand Identity & Systems', slug: 'brand-identity-systems', pillar: 'Creative Services', description: 'Comprehensive brand identity design including logo suites, typography, visual tokens, and brand guidelines.', icon_url: '/images/services/brand-systems.svg', display_order: 2 },

    // Marketing & Growth (6)
    { groupSlug: 'paid-ads-performance-marketing', name: 'Targeted Ad Campaigns', slug: 'targeted-ad-campaigns', pillar: 'Digital Marketing', description: 'Google Ads, Meta Ads, and LinkedIn campaign management with continuous ROAS optimization.', icon_url: '/images/services/growth.svg', display_order: 1 },
    { groupSlug: 'paid-ads-performance-marketing', name: 'Funnel & Conversion Optimization', slug: 'funnel-conversion-optimization', pillar: 'Digital Marketing', description: 'A/B testing landing page conversion optimization, heatmaps, and checkout friction reduction.', icon_url: '/images/services/funnel.svg', display_order: 2 },

    { groupSlug: 'search-positioning-ranking-seo', name: 'Search Engine Positioning & Ranking', slug: 'search-engine-positioning-ranking', pillar: 'Digital Marketing', description: 'Technical SEO audits, Schema markup, core web vitals speed tuning, and keyword positioning.', icon_url: '/images/services/seo.svg', display_order: 1 },
    { groupSlug: 'search-positioning-ranking-seo', name: 'Global & Regional Search Reach', slug: 'global-regional-search-reach', pillar: 'Digital Marketing', description: 'Multi-lingual international SEO, hreflang optimization, and regional market search visibility.', icon_url: '/images/services/global-seo.svg', display_order: 2 },

    { groupSlug: 'brand-strategy-content-architecture', name: 'Social Media & Brand Presence', slug: 'social-media-brand-presence', pillar: 'Digital Marketing', description: 'Strategic social content calendars, executive branding, and community growth engagement.', icon_url: '/images/services/social-presence.svg', display_order: 1 },
    { groupSlug: 'brand-strategy-content-architecture', name: 'Performance Copywriting', slug: 'performance-copywriting', pillar: 'Digital Marketing', description: 'High-converting website copy, technical blog posts, product messaging, and email nurture campaigns.', icon_url: '/images/services/copywriting.svg', display_order: 2 },
    { groupSlug: 'managed-support-slas', name: '24/7 Application Support', slug: '24-7-application-support', pillar: 'Managed Services & Support', description: 'SLA-backed incident response with defined response times, on-call rotations, and post-incident reporting.', icon_url: '/images/services/support-24-7.svg', display_order: 1 },
    { groupSlug: 'managed-support-slas', name: 'Application Maintenance Retainers', slug: 'application-maintenance-retainers', pillar: 'Managed Services & Support', description: 'Fixed-scope monthly retainers covering dependency upgrades, security patches, and iterative improvements.', icon_url: '/images/services/maintenance.svg', display_order: 2 },
    { groupSlug: 'managed-support-slas', name: 'Root Cause Analysis & Incident Reviews', slug: 'root-cause-analysis-incident-reviews', pillar: 'Managed Services & Support', description: 'Production incident triage that ends in a permanent fix rather than a temporary workaround.', icon_url: '/images/services/incident.svg', display_order: 3 },
    { groupSlug: 'dedicated-delivery-teams', name: 'Dedicated Offshore Delivery Pods', slug: 'dedicated-offshore-delivery-pods', pillar: 'Managed Services & Support', description: 'A cross-functional squad working inside your overlap hours, using your own tooling and ceremonies.', icon_url: '/images/services/dedicated-team.svg', display_order: 1 },
    { groupSlug: 'business-intelligence-dashboards', name: 'KPI Dashboards & Executive Reporting', slug: 'kpi-dashboards-executive-reporting', pillar: 'Data & Analytics', description: 'Operational and executive dashboards built on real data, refreshed automatically and scoped to decisions.', icon_url: '/images/services/dashboard.svg', display_order: 1 },
    { groupSlug: 'business-intelligence-dashboards', name: 'Data Engineering & ETL Pipelines', slug: 'data-engineering-etl-pipelines', pillar: 'Data & Analytics', description: 'Reliable ingestion, modelling, and warehouse pipelines with observability and schema contracts.', icon_url: '/images/services/data-pipeline.svg', display_order: 2 },
    { groupSlug: 'tracking-attribution-data-pipelines', name: 'Marketing Attribution & Mix Modelling', slug: 'marketing-attribution-mix-modelling', pillar: 'Data & Analytics', description: 'Multi-touch attribution and media mix modelling to reallocate budget toward what actually converts.', icon_url: '/images/services/attribution.svg', display_order: 1 },
    { groupSlug: 'tracking-attribution-data-pipelines', name: 'Consent & Tracking Compliance', slug: 'consent-tracking-compliance', pillar: 'Data & Analytics', description: 'GA4, server-side tagging, and consent tooling that keeps measurement working while respecting privacy law.', icon_url: '/images/services/tracking.svg', display_order: 2 },
    { groupSlug: 'landing-pages-conversion', name: 'Landing Page & Funnel Builds', slug: 'landing-page-funnel-builds', pillar: 'Growth & Conversion', description: 'Fast, accessible landing pages and funnels designed around measurable conversion hypotheses.', icon_url: '/images/services/landing.svg', display_order: 1 },
    { groupSlug: 'landing-pages-conversion', name: 'A/B Testing & Experimentation', slug: 'ab-testing-experimentation', pillar: 'Growth & Conversion', description: 'Structured experiment programmes with statistical rigour, so roadmap decisions rest on evidence.', icon_url: '/images/services/experiment.svg', display_order: 2 },
    { groupSlug: 'lifecycle-crm-retention', name: 'Marketing Automation & Nurture', slug: 'marketing-automation-nurture', pillar: 'Growth & Conversion', description: 'Lifecycle email and CRM journeys that turn one-time buyers into repeat revenue.', icon_url: '/images/services/automation.svg', display_order: 1 },
    { groupSlug: 'lifecycle-crm-retention', name: 'Conversion Rate Optimisation', slug: 'conversion-rate-optimisation', pillar: 'Growth & Conversion', description: 'Heatmaps, session analysis, and friction removal across checkout and signup flows.', icon_url: '/images/services/cro.svg', display_order: 2 },
    { groupSlug: 'discovery-solution-workshops', name: 'Discovery & Solution Workshops', slug: 'discovery-solution-workshops-consulting', pillar: 'Strategy & Consulting', description: 'Structured stakeholder workshops that turn ambiguous requirements into an agreed, scoped direction.', icon_url: '/images/services/workshop.svg', display_order: 1 },
    { groupSlug: 'audits-architecture-advisory', name: 'Technical & Security Audits', slug: 'technical-security-audits', pillar: 'Strategy & Consulting', description: 'Independent review of code, infrastructure, and security posture with prioritised, actionable findings.', icon_url: '/images/services/audit.svg', display_order: 1 },
    { groupSlug: 'audits-architecture-advisory', name: 'Cloud & Architecture Advisory', slug: 'cloud-architecture-advisory', pillar: 'Strategy & Consulting', description: 'Independent guidance on platform choice, build-versus-buy, and pragmatic delivery sequencing.', icon_url: '/images/services/architecture.svg', display_order: 2 },
    { groupSlug: 'audits-architecture-advisory', name: 'Digital Roadmap & Vendor Selection', slug: 'digital-roadmap-vendor-selection', pillar: 'Strategy & Consulting', description: 'A realistic, costed roadmap plus an honest assessment of which work to keep in-house.', icon_url: '/images/services/roadmap.svg', display_order: 3 },
  ];

  for (const s of rawServices) {
    const group = groupMap.get(s.groupSlug);
    const pEntity = pillarMap.get(s.pillar);
    let existing = await serviceRepo.findOne({ where: { slug: s.slug } });
    if (!existing) {
      existing = await serviceRepo.findOne({ where: { name: s.name } });
    }

    if (!existing) {
      await serviceRepo.save(
        serviceRepo.create({
          group_id: group ? group.id : null,
          pillar_id: pEntity ? pEntity.id : null,
          name: s.name,
          slug: s.slug,
          pillar: s.pillar,
          description: s.description,
          icon_url: s.icon_url,
          is_active: true,
          is_deleted: false,
        }),
      );
    } else {
      existing.group_id = group ? group.id : existing.group_id;
      existing.pillar_id = pEntity ? pEntity.id : existing.pillar_id;
      existing.slug = s.slug;
      existing.pillar = s.pillar;
      await serviceRepo.save(existing);
    }
  }
  console.log(` ✓ ${rawServices.length} SRS Services seeded successfully`);

  // 3b. Sample Blog Categories
  const countBlogCategories = await blogCategoryRepo.count();
  if (countBlogCategories === 0) {
    await blogCategoryRepo.save([
      { name: 'Engineering', slug: 'engineering', description: 'Architecture, backend, DevOps, and cloud engineering insights.' },
      { name: 'Product & SaaS', slug: 'product-saas', description: 'Product-led growth, SaaS metrics, and build/scale playbooks.' },
      { name: 'Design & Creative', slug: 'design-creative', description: 'UX research, branding, and commercial photography.' },
      { name: 'Marketing', slug: 'marketing', description: 'SEO, growth, attribution, and content marketing.' },
    ]);
    console.log(' ✓ Sample blog categories seeded');
  }

  // 3c. Sample Blog Articles (idempotent by slug)
  const blogSeeds = [
    {
      title: 'Choosing Between Monolith and Microservices in 2026',
        slug: 'monolith-vs-microservices-2026',
        excerpt: 'A pragmatic decision framework for early-stage products: when to start modular, when to split, and what the trade-offs really cost.',
        content: '<h2>The real question is speed of change</h2><p>Every architecture decision trades coupling for coordination cost. If your roadmap is still uncertain, a well-modularized monolith beats premature microservices every time.</p>',
        category: 'Engineering',
        tags: ['architecture', 'microservices', 'nestjs', 'startups'],
        reading_time: '8 min read',
        primary_author_name: 'Milena Ivanova',
        meta_title: 'Monolith vs Microservices in 2026 | Milanova Technologies',
        meta_description: 'A practical framework for choosing between a modular monolith and microservices based on coordination cost, not hype.',
        keywords: ['microservices', 'monolith', 'architecture', 'startups'],
        featured_status: true,
        status: 'published',
        published_at: new Date('2026-01-12T09:00:00Z'),
        featured_image_url: 'https://placehold.co/1600x900/1e3a8a/ffffff.png?text=Monolith+vs+Microservices',
      },
      {
        title: 'How We Cut API Latency from 12s to 300ms',
        slug: 'how-we-cut-api-latency',
        excerpt: 'The GasPay refactor: event-driven microservices, Redis buffers, and read replicas that took a billing engine from synchronous chaos to sub-second.',
        content: '<h2>Instrument first, optimize second</h2><p>Before touching any code we mapped every slow path. The bottleneck was synchronous DB locking during meter ingestion — a queue solved it without rewriting the domain.</p>',
        category: 'Engineering',
        tags: ['performance', 'redis', 'nestjs', 'case-study'],
        reading_time: '6 min read',
        primary_author_name: 'Milena Ivanova',
        meta_title: 'Cutting API Latency From 12s to 300ms | Milanova Technologies',
        meta_description: 'How we re-architected a utility billing engine with Redis queues and read replicas to bring API latency from 12 seconds down to 300 milliseconds.',
        keywords: ['latency', 'performance', 'redis', 'billing'],
        featured_status: true,
        status: 'published',
        published_at: new Date('2026-02-18T10:30:00Z'),
        featured_image_url: 'https://placehold.co/1600x900/0f766e/ffffff.png?text=API+Latency',
      },
      {
        title: 'Pricing a SaaS Product for EU + Emerging Markets',
        slug: 'saas-pricing-eu-emerging-markets',
        excerpt: 'Regional pricing done right: USD, EUR, and BDT tiers, arrears-billing pitfalls, and why transparent packages win enterprise deals.',
        content: '<h2>Regional pricing is segmentation, not a discount</h2><p>Your EU margin structure is not your Bangladesh margin structure. Publish clear regional prices and back them with local payment rails.</p>',
        category: 'Product & SaaS',
        tags: ['saas', 'pricing', 'europe', 'growth'],
        reading_time: '7 min read',
        primary_author_name: 'Luca Moretti',
        meta_title: 'SaaS Regional Pricing for EU & Emerging Markets | Milanova Technologies',
        meta_description: 'A practical playbook for multi-currency SaaS pricing across EU and emerging markets, with real package examples.',
        keywords: ['saas pricing', 'regional pricing', 'multi-currency'],
        featured_status: false,
        status: 'published',
        published_at: new Date('2026-03-02T08:15:00Z'),
        featured_image_url: 'https://placehold.co/1600x900/4338ca/ffffff.png?text=SaaS+Pricing',
      },
      {
        title: 'Accessibility Is a Design Requirement, Not a Feature',
        slug: 'accessibility-design-requirement',
        excerpt: 'Why WCAG 2.2 AA is the baseline for every interface we ship, and how to audit it without a dedicated team.',
        content: '<h2>Start with the keyboard</h2><p>If your app cannot be driven entirely by keyboard, closing the largest accessibility gaps costs far more later. Run that check on every sprint review.</p>',
        category: 'Design & Creative',
        tags: ['a11y', 'ui-ux', 'wcag', 'design'],
        reading_time: '5 min read',
        primary_author_name: 'Giulia Romano',
        meta_title: 'Accessibility As a Core Design Requirement | Milanova Technologies',
        meta_description: 'How to make WCAG 2.2 AA the baseline for UI work without a dedicated accessibility team.',
        keywords: ['accessibility', 'wcag', 'ux design'],
        featured_status: false,
        status: 'published',
        published_at: new Date('2026-03-20T14:00:00Z'),
        featured_image_url: 'https://placehold.co/1600x900/7c3aed/ffffff.png?text=Accessibility',
      },
      {
        title: 'Technical SEO Migration: Preserving Organic Traffic',
        slug: 'technical-seo-migration',
        excerpt: 'Redirects, structured data, and canonical hygiene before you touch a single route — how to migrate a site without losing rankings.',
        content: '<h2>Your redirect map is the contract</h2><p>Every old URL is an asset. Build a one-to-one 301 map, mirror your sitemap priorities, and validate with crawl logs before and after the cutover.</p>',
        category: 'Marketing',
        tags: ['seo', 'migration', 'redirects', 'structured-data'],
        reading_time: '6 min read',
        primary_author_name: 'Luca Moretti',
        meta_title: 'Technical SEO Migration Without Traffic Loss | Milanova Technologies',
        meta_description: 'Redirect hygiene, structured data, and canonical management strategies to preserve organic rankings during a site migration.',
        keywords: ['seo', 'site migration', '301 redirects'],
        featured_status: false,
        status: 'draft',
        scheduled_at: new Date('2026-05-01T09:00:00Z'),
        featured_image_url: 'https://placehold.co/1600x900/64748b/ffffff.png?text=Technical+SEO',
      },
      {
        title: 'Draft: AI Agents for Document-Heavy Workflows',
        slug: 'ai-agents-document-workflows',
        excerpt: 'Draft only — internal notes on automating invoice, contract, and KYC processing with Claude API agents.',
        content: '<p>Internal draft. Placeholder body for the Q2 automation series.</p>',
        category: 'Engineering',
        tags: ['ai', 'automation', 'claude', 'workflows'],
        reading_time: '4 min read',
        primary_author_name: 'Milena Ivanova',
        meta_title: 'AI Agents for Document Workflows',
        meta_description: 'Draft article on automating document-heavy workflows with AI agents.',
        keywords: ['ai agents', 'automation'],
        featured_status: false,
        status: 'draft',
        featured_image_url: 'https://placehold.co/1600x900/1e293b/ffffff.png?text=AI+Agents',
      },
    ];
  const existingBlogs = await blogRepo.find({ select: { slug: true } });
  const existingSlugs = new Set(existingBlogs.map((b) => b.slug));
  const missing = blogSeeds.filter((b) => !existingSlugs.has(b.slug));
  if (missing.length > 0) {
    await blogRepo.save(missing);
    console.log(` ✓ Sample blog articles seeded (${missing.length} new)`);
  } else {
    console.log('   Blog articles already present — skipping');
  }

  // 3. Sample Case Studies / Portfolio (top-up to 30, idempotent by slug)
  const portfolioSeeds: DeepPartial<Portfolio>[] = [
    {
      project_name: 'GasPay Centralized Utility Platform',
      slug: 'gaspay-centralized-utility',
      client_name: 'Enel Gas & Utility EU',
      category: 'Software Engineering',
      tags: ['.NET Core', 'AWS', 'Next.js', 'PostgreSQL'],
      live_url: 'https://gaspay.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/gaspay-cover.png',
      primary_challenge: 'Legacy monolithic utility billing engine was causing 12+ second latency during end-of-month meter reading submissions for over 500,000 customers.',
      primary_solution: 'Re-architected legacy core into an event-driven microservices architecture using NestJS, PostgreSQL read-replicas, and a modern Next.js dashboard.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Monolithic architecture, 12s latency, high operational bottlenecks, manual error handling.',
      our_approach_text: 'Event-driven microservices, sub-second response, automated CI/CD pipelines, 99.9% uptime SLA.',
      pricing_enabled: true,
      pricing_title: 'Transparent Engagement Models',
      challenges: [
        {
          title: 'Challenge: High Latency in Meter Ingestion',
          challenge_description: 'Synchronous DB locks during peak hours caused connection pool exhaustion.',
          solution_provided: 'Implemented Redis message queue buffer with async batch ingestion workers.',
          sort_order: 1,
        },
      ],
      pricing_tiers: [
        {
          title: 'Starter Package',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$5,000',
          regional_prices: { BDT: '৳500,000', EUR: '€4,500' },
          price_subtitle: 'One-time MVP delivery',
          deliverables: ['Core API setup', 'Next.js dashboard', 'Database schema', 'Documentation'],
          is_most_popular: false,
          sort_order: 1,
        },
        {
          title: 'Enterprise Growth',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$15,000',
          regional_prices: { BDT: '৳1,500,000', EUR: '€13,500' },
          price_subtitle: 'Full product lifecycle',
          deliverables: ['Microservices architecture', 'AWS multi-region K8s', '24/7 SLA Support', 'Security Audits'],
          is_most_popular: true,
          sort_order: 2,
        },
      ],
    },
    {
      project_name: 'Luxora Real Estate Marketplace',
      slug: 'luxora-real-estate-marketplace',
      client_name: 'Luxora Estates',
      category: 'Software Engineering',
      tags: ['Next.js', 'NestJS', 'PostgreSQL', 'Mapbox'],
      live_url: 'https://luxora.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/luxora-cover.png',
      primary_challenge: 'Property listings scattered across PDFs, spreadsheets, and agent portals with no unified search for 40+ agencies.',
      primary_solution: 'Built a single marketplace with map-based search, live MLS sync, and instant virtual-tour scheduling.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Static PDF catalogs, duplicate listings, no real-time availability.',
      our_approach_text: 'Live MLS feed, map-first discovery, unified listing ownership, sub-second filters.',
      pricing_enabled: true,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [
        {
          title: 'Challenge: Duplicate & Stale Listings',
          challenge_description: 'Agencies published the same property on multiple channels with conflicting availability.',
          solution_provided: 'Single source of truth with soft-delete re-sync and conflict detection per source agency.',
          sort_order: 1,
        },
      ],
      pricing_tiers: [
        {
          title: 'Agency Starter',
          currencies: ['USD', 'EUR'],
          primary_price: '$3,200',
          regional_prices: { EUR: '€2,900' },
          price_subtitle: 'Per agency onboarding',
          deliverables: ['Listing sync', 'Map search', 'Virtual tour embed'],
          is_most_popular: false,
          sort_order: 1,
        },
        {
          title: 'Marketplace Pro',
          currencies: ['USD', 'EUR'],
          primary_price: '$9,800',
          regional_prices: { EUR: '€8,900' },
          price_subtitle: 'Full marketplace suite',
          deliverables: ['Unified database', 'MLS integrations', 'Analytics suite', 'Priority support'],
          is_most_popular: true,
          sort_order: 2,
        },
      ],
    },
    {
      project_name: 'MediTrack Clinic Operations Suite',
      slug: 'meditrack-clinic-operations',
      client_name: 'MediDaLi Clinics',
      category: 'Software Engineering',
      tags: ['.NET Core', 'PostgreSQL', 'React', 'Microservices'],
      live_url: 'https://meditrack.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/meditrack-cover.png',
      primary_challenge: '3 clinics ran patient records, billing, and lab results on disconnected legacy systems with manual overnight reconciliation.',
      primary_solution: 'Delivered a unified clinic operations suite with role-based portals for doctors, reception, lab, and finance.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Disconnected silos, overnight batch reconciliation, high manual error rate.',
      our_approach_text: 'Live event-sourced records, real-time billing, unified patient timeline.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [
        {
          title: 'Challenge: Disconnected Patient Records',
          challenge_description: 'Doctor and lab records were stored in separate systems causing duplicate records.',
          solution_provided: 'Unified patient timeline with event sourcing and idempotent sync layers.',
          sort_order: 1,
        },
      ],
    },
    {
      project_name: 'TradeFlow Supply Chain Portal',
      slug: 'tradeflow-supply-chain-portal',
      client_name: 'TradeFlow Global BV',
      category: 'Software Engineering',
      tags: ['NestJS', 'AWS', 'Kafka', 'Vue.js'],
      live_url: 'https://tradeflow.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/tradeflow-cover.png',
      primary_challenge: 'Cross-border shipping visibility was limited to weekly email digests for 120 logistics partners.',
      primary_solution: 'Implemented a real-time supply chain portal streaming shipment telemetry and automated exception alerts.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Weekly digests, reactive status, manual exception handling.',
      our_approach_text: 'Real-time telemetry, proactive SLA alerts, partner self-service portal.',
      pricing_enabled: true,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [
        {
          title: 'Challenge: No Live Visibility',
          challenge_description: 'Partners could not see in-transit status until the weekly digest arrived.',
          solution_provided: 'Kafka event pipeline streaming GPS & customs events to a live dashboard.',
          sort_order: 1,
        },
      ],
    },
    {
      project_name: 'Bantonite Fashion eCommerce',
      slug: 'bantonite-fashion-ecommerce',
      client_name: 'Bantonite Srl',
      category: 'Software Engineering',
      tags: ['Next.js', 'Stripe', 'PostgreSQL', 'Commerce'],
      live_url: 'https://bantonite.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/bantonite-cover.png',
      primary_challenge: 'Seasonal traffic spikes up to 40x crashed the legacy single-server storefront during limited drops.',
      primary_solution: 'Recomputed the storefront using edge-rendered Next.js with Stripe payments and scalable inventory locking.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Single server, crash during drops, cart loss on checkout.',
      our_approach_text: 'Edge-rendered pages, reservation-based cart, 99.99% drop uptime.',
      pricing_enabled: true,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Streamline CRM for Small Teams',
      slug: 'streamline-crm-small-teams',
      client_name: 'Streamline Works',
      category: 'Software Engineering',
      tags: ['React', 'NestJS', 'PostgreSQL', 'Pipes Drive'],
      live_url: 'https://streamline.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/streamline-cover.png',
      primary_challenge: 'Growing agencies juggled contacts, proposals, and invoices across five different tools.',
      primary_solution: 'Shipped an all-in-one lightweight CRM with pipeline tracking, proposal builder, and automated invoicing.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Five tools, fragmented data, manual invoice chasing.',
      our_approach_text: 'One workspace, automated reminders, built-in analytics.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [
        {
          title: 'Challenge: Fragmented Daily Tools',
          challenge_description: 'Data lived in email, sheets, and a separate invoicing app.',
          solution_provided: 'Consolidated data model with importers and workflow triggers.',
          sort_order: 1,
        },
      ],
    },
    {
      project_name: 'Orbit HR Payroll Platform',
      slug: 'orbit-hr-payroll-platform',
      client_name: 'Orbit People BV',
      category: 'Software Engineering',
      tags: ['.NET Core', 'Azure', 'PostgreSQL', 'Compliance'],
      live_url: 'https://orbit.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/orbit-cover.png',
      primary_challenge: 'Multi-country payroll (IT, FR, NL, DE) ran on Excel-based workflows with constant tax-law drift.',
      primary_solution: 'Codified country-specific payroll rules into a rules engine with automated compliance validation.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Excel workflows, manual tax recalc, auditor rework.',
      our_approach_text: 'Rules engine, automated tax validation, audit-ready trails.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Nuovo Food Delivery SuperApp',
      slug: 'nuovo-food-delivery-superapp',
      client_name: 'Nuovo Foods',
      category: 'Software Engineering',
      tags: ['Flutter', 'NestJS', 'Redis', 'Google Maps'],
      live_url: 'https://nuovo.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/nuovo-cover.png',
      primary_challenge: 'Couriers used three apps, and dispatchers lacked live rider tracking during rush windows.',
      primary_solution: 'Built a rider + dispatch superapp with live geofencing, dynamic pricing, and chat-based support.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Multiple apps, no live tracking, static delivery fees.',
      our_approach_text: 'Single superapp, live geofencing, dynamic surge pricing.',
      pricing_enabled: true,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'InsurHub Policy Aggregator',
      slug: 'insurhub-policy-aggregator',
      client_name: 'InsurHub Italia',
      category: 'Software Engineering',
      tags: ['Next.js', 'NestJS', 'PostgreSQL', 'Gov API'],
      live_url: 'https://insurhub.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/insurhub-cover.png',
      primary_challenge: 'Insurance brokers compared quotes via four separate partner portals with inconsistent data.',
      primary_solution: 'Created a policy aggregator normalizing quotes from multiple carriers into one comparison engine.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Four portals, manual comparison, inconsistent terms.',
      our_approach_text: 'One comparison engine, normalized terms, automated acceptance.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Sentio Fintech Dashboard',
      slug: 'sentio-fintech-dashboard',
      client_name: 'Sentio Capital',
      category: 'Software Engineering',
      tags: ['React', 'Node.js', 'TimescaleDB', 'AWS'],
      live_url: 'https://sentio.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/sentio-cover.png',
      primary_challenge: 'Investment analysts waited hours for overnight batch reports on market positions.',
      primary_solution: 'Deployed a real-time portfolio dashboard with streaming positions and decision-ready metrics.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Overnight batch reports, stale data, analyst rework.',
      our_approach_text: 'Streaming metrics, live drill-down, decision-ready summaries.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'EduLive Online Academy',
      slug: 'edulive-online-academy',
      client_name: 'EduLive Technologies',
      category: 'Software Engineering',
      tags: ['Next.js', 'NestJS', 'FFmpeg', 'PostgreSQL'],
      live_url: 'https://edulive.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/edulive-cover.png',
      primary_challenge: 'An upskilling academy streamed classes on YouTube with no quizzes, certificates, or progress tracking.',
      primary_solution: 'Delivered a full LMS with video hosting, adaptive quizzes, and auto-generated certificates.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Public streams, no assessments, no certification.',
      our_approach_text: 'Private LMS, adaptive assessments, verifiable certificates.',
      pricing_enabled: true,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'SustainLog Carbon Tracking',
      slug: 'sustainlog-carbon-tracking',
      client_name: 'GreenWave EU',
      category: 'Software Engineering',
      tags: ['NestJS', 'PostgreSQL', 'IoT', 'Dashboards'],
      live_url: 'https://sustainlog.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/sustainlog-cover.png',
      primary_challenge: 'Manufacturers could not prove carbon savings credits to regulators in a recognizable format.',
      primary_solution: 'Built an IoT-linked carbon ledger with automated emissions reports in EU-compliant formats.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Manual audits, spreadsheet ledgers, disputed credits.',
      our_approach_text: 'IoT-verified ledger, automated EU-reports, tamper-evident trail.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'AutoVault Fleet Management',
      slug: 'autovault-fleet-management',
      client_name: 'AutoVault Logistics',
      category: 'Software Engineering',
      tags: ['Flutter', '.NET Core', 'Azure IoT', 'PostgreSQL'],
      live_url: 'https://autovault.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/autovault-cover.png',
      primary_challenge: 'A 900-truck fleet had no single view of maintenance, fuel, and driver performance.',
      primary_solution: 'Consolidated telematics into a fleet command center with predictive maintenance alerts.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Paper logs, reactive maintenance, fuel theft blind spots.',
      our_approach_text: 'Telematics command center, predictive alerts, verified fuel telemetry.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Safeguard UX Penetration Assessment',
      slug: 'safeguard-ux-pentest',
      client_name: 'Safeguard Cyber',
      category: 'Software Engineering',
      tags: ['Security', 'OWASP', 'Penetration Testing'],
      live_url: 'https://safeguard.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/safeguard-cover.png',
      primary_challenge: 'A fintech client needed a third-party security verdict before launching a lite banking app.',
      primary_solution: 'Executed a full OWASP-aligned penetration test with exploit demos and remediation roadmap.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Checklist audits, generic reports, no exploit proof.',
      our_approach_text: 'Live exploit demos, prioritized roadmap, retest verification.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Beacon Local SEO Campaign',
      slug: 'beacon-local-seo-campaign',
      client_name: 'Beacon Dental Studio',
      category: 'Digital Marketing',
      tags: ['SEO', 'Content', 'Reputation'],
      live_url: 'https://beacon.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/beacon-cover.png',
      primary_challenge: 'A boutique dental studio was invisible in local map results despite high customer ratings.',
      primary_solution: 'Rebuilt local SEO foundations: listings, review flows, service pages, and map-optimized content.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Generic directory listings, no review engineering.',
      our_approach_text: 'Map-audit + review engine + hyper-local content clusters.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Vermonte Luxury Vineyard Brand',
      slug: 'vermonte-luxury-vineyard',
      client_name: 'Vermonte Wines',
      category: 'Creative & Post Production',
      tags: ['Branding', 'Photography', 'Web Design'],
      live_url: 'https://vermonte.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/vermonte-cover.png',
      primary_challenge: 'A heritage vineyard needed visual storytelling that matched its premium export pricing.',
      primary_solution: 'Produced a complete brand system: photography, label redesign, and cinematic product lifestyle shoots.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Generic stock imagery, dated label design.',
      our_approach_text: 'Bespoke art direction, single-pass retouching, story-led brand book.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Fortel Bros Sustainable Living Film',
      slug: 'fortelbros-sustainable-living-film',
      client_name: 'Fortel Brothers Group',
      category: 'Creative & Post Production',
      tags: ['Video', 'Documentary', 'Post Production'],
      live_url: 'https://fortelbros.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/fortelbros-cover.png',
      primary_challenge: 'A developer wanted a human-centered film about its eco-buildings to win municipal approvals.',
      primary_solution: 'Directed and post-produced a documentary mini-film capturing resident stories and green-tech details.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Tour-style drone videos, no narrative depth.',
      our_approach_text: 'Story-first editing, verified green-tech breakdowns, stakeholder cut variants.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Presto Rewards Program Launch',
      slug: 'presto-rewards-program',
      client_name: 'Presto Coffee Roasters',
      category: 'Digital Marketing',
      tags: ['Loyalty', 'Email', 'Web'],
      live_url: 'https://presto.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/presto-cover.png',
      primary_challenge: 'Repeat-purchase rate was 18% and the brand had no formal loyalty structure.',
      primary_solution: 'Launched a point-based loyalty program with automated email journeys and member microsite.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Punch cards, generic campaigns, no member data.',
      our_approach_text: 'Data-led loyalty loops, lifecycle automations, member analytics.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Cerulean Logistik App Campaign',
      slug: 'cerulean-logistik-campaign',
      client_name: 'Cerulean Logistik',
      category: 'Digital Marketing',
      tags: ['Paid Media', 'Social', 'Conversion'],
      live_url: 'https://cerulean.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/cerulean-cover.png',
      primary_challenge: 'A freight-booking app acquired signups but abysmal booking completion in the funnel.',
      primary_solution: 'Ran conversion-focused paid campaigns with landing experimentation and full-funnel retargeting.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Broad targeting, vanity metrics, no funnel action.',
      our_approach_text: 'Funnel-journey targeting, experiment-driven landing pages, booking-attribution.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Noir Estates Rebrand Film',
      slug: 'noir-estates-rebrand-film',
      client_name: 'Noir Estates',
      category: 'Creative & Post Production',
      tags: ['Brand Film', 'Motion', 'Post'],
      live_url: 'https://noir.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/noir-cover.png',
      primary_challenge: 'A luxury realtor brand felt ambiguous and dated on reopening after service expansion.',
      primary_solution: 'Rebrand + cinematic launch film designed for the high-net-worth syndicated market.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Generic templates, mismatched tone among channels.',
      our_approach_text: 'Unified cinematic system, tone-matched assets across all channels.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'PeakCycle Training App',
      slug: 'peakcycle-training-app',
      client_name: 'PeakCycle Fitness',
      category: 'Software Engineering',
      tags: ['Flutter', 'NestJS', 'HealthKit', 'Google Fit'],
      live_url: 'https://peakcycle.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/peakcycle-cover.png',
      primary_challenge: 'A fitness studio wanted an app but feared building costly native apps for both platforms.',
      primary_solution: 'Shipped a cross-platform Flutter app with class booking, wearables sync, and progress coaching.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Two native codebases, doubled cost & time.',
      our_approach_text: 'Single Flutter codebase, native-feel UX, wearables integration.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Atlas Warehouse Analytics',
      slug: 'atlas-warehouse-analytics',
      client_name: 'Atlas Distribution',
      category: 'Software Engineering',
      tags: ['React', 'NestJS', 'PostgreSQL', 'BI'],
      live_url: 'https://atlas.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/atlas-cover.png',
      primary_challenge: 'Warehouse managers relied on weekly Excel exports to discover inventory aging and picking delays.',
      primary_solution: 'Built live warehouse analytics with aging heatmaps, picking queues, and replenishment forecasts.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Weekly exports, static dashboards, reactive decisions.',
      our_approach_text: 'Live analytics, forecast alerts, proactive operations.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Melo Studios Pet Film Series',
      slug: 'melo-studios-pet-film',
      client_name: 'Melo Studios',
      category: 'Creative & Post Production',
      tags: ['Video', 'Social Content', 'Editing'],
      live_url: 'https://melo.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/melo-cover.png',
      primary_challenge: 'A pet-products studio wanted binge-worthy short-form video that could win algorithm distribution.',
      primary_solution: 'Produced a 12-episode pet lifestyle series with consistent hooks, motion captions, and platform cuts.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Random clips, unmixed audio, no hook strategy.',
      our_approach_text: 'Hooks-first editing, platform-native cuts, drop-in series consistency.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'BoltRemit Cross-Border Payments',
      slug: 'boltremit-cross-border-payments',
      client_name: 'BoltRemit Fintech',
      category: 'Software Engineering',
      tags: ['NestJS', 'PostgreSQL', 'Currencies', 'Compliance'],
      live_url: 'https://boltremit.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/boltremit-cover.png',
      primary_challenge: 'Cross-border remittance took 24 hours per transfer with manual AML review on flagged wires.',
      primary_solution: 'Automated KYC scoring and cleared 93% of transfers instantly, cutting review time by 11x.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: '24h clearing, manual AML review, high drop-off.',
      our_approach_text: 'Instant clearing, automated KYC scoring, exception-flagged queue.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Glaive Logistics App Suite',
      slug: 'glaive-logistics-app-suite',
      client_name: 'Glaive Freight',
      category: 'Software Engineering',
      tags: ['React Native', 'Node.js', 'MongoDB', 'Twilio'],
      live_url: 'https://glaive.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/glaive-cover.png',
      primary_challenge: 'Drivers, dispatchers and shippers each used different tools leaving delivery proof ambiguous.',
      primary_solution: 'Delivered one logistics app suite with photo proof-of-delivery, geofenced check-ins, and SMS notify.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Fragmented tools, disputed delivery proof.',
      our_approach_text: 'Unified suite, photo POD, geofenced events.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Zephyr Travel Booking Engine',
      slug: 'zephyr-travel-booking-engine',
      client_name: 'Zephyr Travels',
      category: 'Software Engineering',
      tags: ['Next.js', 'NestJS', 'Amadeus', 'PostgreSQL'],
      live_url: 'https://zephyr.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/zephyr-cover.png',
      primary_challenge: 'A boutique travel agency’s site showed stale fares and forced call-based booking.',
      primary_solution: 'Integrated live flight/rail inventory with in-site search, fare lock, and instant e-ticket issuance.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Stale fares, call-based bookings, no fare lock.',
      our_approach_text: 'Live inventory, self-service booking, fare-lock guarantees.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Koi Learning Science Platform',
      slug: 'koi-learning-science-platform',
      client_name: 'Koi STEM',
      category: 'Software Engineering',
      tags: ['React', 'NestJS', 'GraphQL', 'LMS'],
      live_url: 'https://koi.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/koi-cover.png',
      primary_challenge: 'Science teachers needed lab simulations students could run safely from home.',
      primary_solution: 'Built an interactive experiment sandbox with step verification and auto-graded lab reports.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Static PDF labs, no verification, group-think answers.',
      our_approach_text: 'Interactive sandbox, step verification, auto-graded reports.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Museo Cartel Print Campaign',
      slug: 'museo-cartel-print-campaign',
      client_name: 'Museo Cartel',
      category: 'Creative & Post Production',
      tags: ['Print', 'Art Direction', 'Post Production'],
      live_url: 'https://museo.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/museo-cover.png',
      primary_challenge: 'A film festival needed 40+ visually distinct poster variants from one master design on one budget.',
      primary_solution: 'Built a parametric poster system in Capture One/Photoshop with color-grade templates across variants.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: '40 separate bespoke designs, long timeline.',
      our_approach_text: 'Parametric variants, consistent grade, one master system.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Pelago Resort Booking Revamp',
      slug: 'pelago-resort-booking-revamp',
      client_name: 'Pelago Resorts',
      category: 'Digital Marketing',
      tags: ['Web CRO', 'Paid Search', 'Booking'],
      live_url: 'https://pelago.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/pelago-cover.png',
      primary_challenge: 'Direct bookings flatlined at 9% conversion while OTA commissions ate 28% of revenue.',
      primary_solution: 'Re-built the booking page with trust signals, live availability, and price-match offers.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Static pages, OTA-heavy leakage, low direct conversion.',
      our_approach_text: 'CRO-led booking flow, live inventory, price-match framing.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Carriva Fleet Telematics Suite',
      slug: 'carriva-fleet-telematics-suite',
      client_name: 'Carriva Logistics UK',
      category: 'Mobile Apps & Platforms',
      tags: ['React Native', 'GPS Tracking', 'NestJS', 'Live Alerts'],
      live_url: 'https://carriva.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/carriva-cover.png',
      primary_challenge: 'Dispatch teams lost an average of 40 minutes per day on manual check-calls to 900+ active trucks.',
      primary_solution: 'Delivered a telematics super-app with live GPS tracking, geofenced alerts, and one-tap POD capture.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Manual radio check-ins, spreadsheets, reactive routing.',
      our_approach_text: 'Live GPS telematics, proactive geofence alerts, automated ETA feeds.',
      pricing_enabled: true,
      pricing_title: 'Transparent Engagement Models',
      challenges: [
        {
          title: 'Challenge: Driver Adoption of Tracking Apps',
          challenge_description: 'Drivers ignored tracking because the old app drained battery and had a slow UI.',
          solution_provided: 'Rebuilt the app with background GPS offload and a 3-step onboarding that cut battery use by 60%.',
          sort_order: 1,
        },
        {
          title: 'Challenge: Noisy Position Data',
          challenge_description: 'Raw GPS pings produced zig-zag routes that skewed mileage reports.',
          solution_provided: 'Applied map-matching with Kalman smoothing so billed mileage matched real road distance.',
          sort_order: 2,
        },
      ],
      pricing_tiers: [
        {
          title: 'Fleet Starter',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$2,400',
          regional_prices: { BDT: '৳250,000', EUR: '€2,100' },
          price_subtitle: 'Up to 50 vehicles',
          deliverables: ['Telematics dashboard', 'GPS tracking app', 'Geofence alerts', 'Monthly report'],
          is_most_popular: false,
          sort_order: 1,
        },
        {
          title: 'Fleet Enterprise',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$9,800',
          regional_prices: { BDT: '৳980,000', EUR: '€8,500' },
          price_subtitle: 'Unlimited vehicles',
          deliverables: ['Custom integrations', 'Dedicated support', 'Compliance reports', 'SLA 99.9%'],
          is_most_popular: true,
          sort_order: 2,
        },
      ],
    },
    {
      project_name: 'InsightPulse SaaS Analytics',
      slug: 'insightpulse-saas-analytics',
      client_name: 'InsightPulse Labs',
      category: 'AI & Automation',
      tags: ['AI Dashboards', 'LLM', 'Next.js', 'BigQuery'],
      live_url: 'https://insightpulse.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/insightpulse-cover.png',
      primary_challenge: 'Product teams could query churn questions but each report required a data engineer to write SQL.',
      primary_solution: 'Built an AI analytics copilot: plain-English questions translated into SQL, charted in the browser.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'SQL tickets, 3-day turnaround, one-off dashboards.',
      our_approach_text: 'Natural-language SQL engine, instant charts, shareable answer packs.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'VaultAlpha Digital Asset Custody',
      slug: 'vaultalpha-custody-app',
      client_name: 'VaultAlpha SA',
      category: 'FinTech & Web3',
      tags: ['Flutter', 'Crypto', 'Cold Storage', 'KYC'],
      app_store_url: 'https://apps.apple.com/app/vaultalpha-custody-app',
      is_featured: false,
      cover_image: '/images/portfolio/vaultalpha-cover.png',
      primary_challenge: 'Investors distrusted web-only wallets; 60% of signups bailed at the recovery-phrase step.',
      primary_solution: 'Shipped a custodial mobile app with biometric vault, MPC key sharding, and a guided recovery flow.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Browser-only custody, steep recovery UX, weak KYC onboarding.',
      our_approach_text: 'Biometric vault on iOS/Android, MPC sharding, 10-minute KYC onboarding.',
      pricing_enabled: true,
      pricing_title: 'Transparent Engagement Models',
      challenges: [],
      pricing_tiers: [
        {
          title: 'MVP Launch',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$6,500',
          regional_prices: { BDT: '৳650,000', EUR: '€5,700' },
          price_subtitle: 'Single platform',
          deliverables: ['Mobile app (iOS/Android)', 'Biometric vault', 'KYC integration', 'Store listing'],
          is_most_popular: false,
          sort_order: 1,
        },
        {
          title: 'Full Custody Suite',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$22,000',
          regional_prices: { BDT: '৳2,200,000', EUR: '€19,500' },
          price_subtitle: 'Multi-currency custody',
          deliverables: ['MPC infrastructure', 'Regulatory compliance pack', 'White-labeling', '24/7 uptime'],
          is_most_popular: true,
          sort_order: 2,
        },
      ],
    },
    {
      project_name: 'Nordia Card Issuer Portal',
      slug: 'nordia-card-issuer-portal',
      client_name: 'Nordia Bank',
      category: 'FinTech & Web3',
      tags: ['Open Banking', 'Card Issuing', 'Compliance', 'Dashboarding'],
      live_url: 'https://nordia.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/nordia-cover.png',
      primary_challenge: 'Issuing operations tracked card lifecycle in five disconnected systems with frequent audit findings.',
      primary_solution: 'Unified issuing and fraud-hold portal with single lifecycle view, approval chains, and audit export.',
      comparison_enabled: false,
      comparison_title: 'Transparent Pricing & Engagement Models',
      industry_standard_text: 'Multi-system card ops, manual approvals, slow audit exports.',
      our_approach_text: 'Single lifecycle view, automated approval chains, one-click audit packs.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Brewline Café Loyalty App',
      slug: 'brewline-cafe-loyalty-app',
      client_name: 'Brewline Coffee Roasters',
      category: 'Mobile Apps & Platforms',
      tags: ['Flutter', 'Loyalty', 'Push', 'POS Rest API'],
      live_url: 'https://brewline.demo.milanovatech.com',
      app_store_url: 'https://apps.apple.com/app/brewline-cafe-loyalty-app',
      is_featured: false,
      cover_image: '/images/portfolio/brewline-cover.png',
      primary_challenge: 'Repeat visits were flat and paper punch cards were contractually impossible across franchise stores.',
      primary_solution: 'Built a franchise-wide digital loyalty app with a shared points ledger across every store POS.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Paper punch cards, no data, franchise-isolated.',
      our_approach_text: 'Cross-store digital ledger, spends analytics, targeted push offers.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Kinetiq Warehouse Robotics Control',
      slug: 'kinetiq-warehouse-robotics',
      client_name: 'Kinetiq Warehouse Systems',
      category: 'Software & Cloud',
      tags: ['IoT', 'Docker', 'Realtime', 'Next.js'],
      live_url: 'https://kinetiq.demo.milanovatech.com',
      is_featured: true,
      cover_image: '/images/portfolio/kinetiq-cover.png',
      primary_challenge: 'AGV robots stopped up to 14 times a shift because the control plane could not stream telemetry fast enough.',
      primary_solution: 'Implemented a WebSocket realtime control plane with lane negotiation and fleet failover.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: '2s telemetry polling, hard-coded lanes, single point of failure.',
      our_approach_text: 'Sub-50ms WebSocket streams, dynamic lane negotiation, fleet failover.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Northern Threads D2C Campaign',
      slug: 'northern-threads-d2c-campaign',
      client_name: 'Northern Threads',
      category: 'Marketing & Growth',
      tags: ['Shopify', 'Paid Social', 'Landing Pages', 'UGC'],
      live_url: 'https://northern.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/northern-cover.png',
      primary_challenge: 'A new outdoor brand spent €4,000 on ads but the product pages converted at only 0.7%.',
      primary_solution: 'Rebuilt the D2C funnel with UGC-first product pages, bundle offers, and geo-targeted campaigns.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Generic templates, no bundling, 0.7% conversion.',
      our_approach_text: 'UGC-first pages, smart bundles, geo-targeted spend, 2.9% conversion.',
      pricing_enabled: true,
      pricing_title: 'Transparent Engagement Models',
      challenges: [
        {
          title: 'Challenge: Zero Brand Trust at First Visit',
          challenge_description: 'New label, no reviews, cold audiences bounced before reading copy.',
          solution_provided: 'Launched with founder stories, real UGC loops, and 30-day guarantee framing.',
          sort_order: 1,
        },
      ],
      pricing_tiers: [
        {
          title: 'Growth Sprint',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$3,200',
          regional_prices: { BDT: '৳330,000', EUR: '€2,800' },
          price_subtitle: '90-day campaign',
          deliverables: ['Landing page build', 'Paid social setup', 'Creative variants', 'Weekly reports'],
          is_most_popular: false,
          sort_order: 1,
        },
        {
          title: 'Scale Retainer',
          currencies: ['USD', 'BDT', 'EUR'],
          primary_price: '$7,500',
          regional_prices: { BDT: '৳760,000', EUR: '€6,600' },
          price_subtitle: 'Monthly D2C management',
          deliverables: ['Full funnel CRO', 'Creative production', 'Compliance & reviews', 'Retention flows'],
          is_most_popular: true,
          sort_order: 2,
        },
      ],
    },
    {
      project_name: 'Pulse Fitness Membership Engine',
      slug: 'pulse-fitness-membership-engine',
      client_name: '',
      category: 'Marketing & Growth',
      tags: ['Subscriptions', 'Member Portal', 'Email Lifecycle'],
      is_featured: false,
      cover_image: '/images/portfolio/pulse-cover.png',
      primary_challenge: 'Gym chains lost members silently each month with no win-back triggers and no visibility into churn risk.',
      primary_solution: 'Engineered a membership lifecycle platform: churn-risk scoring, automated win-back, and member portal.',
      comparison_enabled: false,
      comparison_title: 'Transparent Pricing & Engagement Models',
      industry_standard_text: 'Silent churn, no risk scoring, generic marketing.',
      our_approach_text: 'Churn-risk scoring, automated win-back, member portal.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'Alpine Studios Brand Film Package',
      slug: 'alpine-studios-brand-film',
      client_name: 'Alpine Outdoors',
      category: 'Creative & Post Production',
      tags: ['Brand Film', 'Color Grade', 'Motion Graphics'],
      live_url: 'https://vimeo.com/alpine-brand-film',
      is_featured: false,
      cover_image: '/images/portfolio/alpine-cover.png',
      primary_challenge: 'A product film shot across 6 locations had inconsistent color and no usable social cutdowns.',
      primary_solution: 'Graded the full film in a single pipeline and delivered 12 platform-native cutdowns in 5 days.',
      comparison_enabled: false,
      comparison_title: 'Transparent Pricing & Engagement Models',
      industry_standard_text: 'Per-cut re-grades, inconsistent color, slow delivery.',
      our_approach_text: 'Single grading pipeline, 12 cutdowns, 5-day delivery.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
    {
      project_name: 'AeroTaxi Flight Booking Automation',
      slug: 'aerotaxi-booking-automation',
      client_name: 'AeroTaxi Private Charter',
      category: 'AI & Automation',
      tags: ['NLP', 'RAG', 'Flight APIs', 'Automation'],
      live_url: 'https://aerotaxi.demo.milanovatech.com',
      is_featured: false,
      cover_image: '/images/portfolio/aerotaxi-cover.png',
      primary_challenge: 'Charter crew spent 3+ hours daily stitching bookings, weather checks, and permit emails by hand.',
      primary_solution: 'AI booking assistant with RAG over flight rules auto-schedules trips and drafts permit paperwork.',
      comparison_enabled: true,
      comparison_title: 'Industry Standard vs. Our Approach',
      industry_standard_text: 'Manual booking chain, email chaos, 3h/day overhead.',
      our_approach_text: 'RAG flight assistant, auto permits, 80% faster scheduling.',
      pricing_enabled: false,
      pricing_title: 'Transparent Pricing & Engagement Models',
      challenges: [],
      pricing_tiers: [],
    },
  ];

  const NO_CLIENT_SLUGS = new Set([
    'streamline-crm-small-teams',
    'koi-learning-science-platform',
    'museo-cartel-print-campaign',
    'atlas-warehouse-analytics',
    'melo-studios-pet-film',
  ]);
  const NO_LINKS_SLUGS = new Set([
    'streamline-crm-small-teams',
    'koi-learning-science-platform',
    'museo-cartel-print-campaign',
    'melo-studios-pet-film',
  ]);
  const DUAL_LINKS_SLUGS = new Set([
    'peakcycle-training-app',
    'zephyr-travel-booking-engine',
    'nuovo-food-delivery-superapp',
    'glaive-logistics-app-suite',
  ]);

  const portfolioVariants: DeepPartial<Portfolio>[] = portfolioSeeds.map((seed) => {
    const base: DeepPartial<Portfolio> = { ...seed };
    base.cover_image = `/images/portfolio/${seed.slug}.svg`;
    if (NO_CLIENT_SLUGS.has(seed.slug)) delete base.client_name;
    if (NO_LINKS_SLUGS.has(seed.slug)) {
      delete base.live_url;
      delete base.app_store_url;
      delete base.play_store_url;
    }
    if (DUAL_LINKS_SLUGS.has(seed.slug)) {
      base.live_url = seed.live_url ?? `https://${seed.slug}.demo.milanovatech.com`;
      base.app_store_url = `https://apps.apple.com/app/${seed.slug}`;
      base.play_store_url = `https://play.google.com/store/apps/details?id=com.milanova.${seed.slug}`;
    }
    if (Array.isArray(base.challenges)) {
      base.challenges = base.challenges.map((c, i) => ({
        ...c,
        supporting_image: `/images/portfolio/challenges/${seed.slug}-c${i + 1}.svg`,
      }));
    }
    return base;
  });

  const existingPortfolioSlugs = new Set(
    (await portfolioRepo.find({ select: ['slug'] })).map((p) => p.slug),
  );
  const missingPortfolioSeeds = portfolioVariants.filter(
    (seed) => !existingPortfolioSlugs.has(seed.slug),
  );
  if (missingPortfolioSeeds.length > 0) {
    await portfolioRepo.save(missingPortfolioSeeds);
    const portfolioCount = await portfolioRepo.count();
    console.log(` ✓ Portfolio case studies seeded (+${missingPortfolioSeeds.length}) — total ${portfolioCount}`);
  } else {
    console.log(' ✓ Portfolio case studies already up to date');
  }

  const existingChallenges = await portfolioRepo.find({ relations: ['challenges'] });
  let challengeImageFixes = 0;
  for (const p of existingChallenges) {
    for (let i = 0; i < (p.challenges?.length ?? 0); i++) {
      const c = p.challenges[i];
      const path = `/images/portfolio/challenges/${p.slug}-c${i + 1}.svg`;
      if ((c.supporting_image || '') !== path) {
        c.supporting_image = path;
        challengeImageFixes++;
      }
    }
    if (p.challenges?.length) {
      await portfolioRepo.save(p);
    }
  }
  if (challengeImageFixes > 0) {
    console.log(` ✓ Portfolio challenge images backfilled (${challengeImageFixes})`);
  }

  // 5. Sample Job Circular
  const countJobs = await jobRepo.count();
  if (countJobs === 0) {
    await jobRepo.save({
      title: 'Senior .NET & Cloud Architect',
      employment_type: 'Full-Time',
      department: 'Engineering',
      location: 'Remote / Italy / Dhaka Hub',
      description_requirements: '<p>We are seeking a Senior .NET Architect with expertise in NestJS, TypeORM, PostgreSQL, and AWS K8s.</p>',
      status: 'Open',
    });
    console.log(' ✓ Sample job circular seeded');
  }

  // 6. Sample Hero Sections (4 variants, idempotent by headline)
  const heroRepo = AppDataSource.getRepository(HeroSection);
  const heroMediaRepo = AppDataSource.getRepository(HeroMedia);

  const heroCount = await heroRepo.count();
  if (heroCount === 0) {
    const heroSeeds: Omit<HeroSection, 'id' | 'created_at' | 'updated_at' | 'media' | 'is_deleted'>[] = [
      {
        headline: 'We Build Software That Moves Businesses Forward',
        sub_headline:
          'Milanova Technologies is a Milan-based engineering studio crafting secure, scalable cloud platforms, SaaS products, and enterprise systems for ambitious companies across Europe.',
        primary_cta_label: 'Book a Consultation',
        primary_cta_link: 'https://calendly.com/milanova-tech/30min',
        secondary_cta_label: 'Explore Our Work',
        secondary_cta_link: '/portfolio',
        status: 'active',
      },
      {
        headline: 'From Idea to Production-Ready SaaS',
        sub_headline:
          'Full-cycle product engineering: architecture, DevOps, cloud migration, and AI-powered automation delivered by senior engineers.',
        primary_cta_label: 'Talk to Sales',
        primary_cta_link: 'https://calendly.com/milanova-tech/30min',
        secondary_cta_label: 'View Our Services',
        secondary_cta_link: '/services',
        status: 'inactive',
      },
      {
        headline: 'Cloud-Native .NET & AI Automation',
        sub_headline:
          'Enterprise-grade .NET Core backends, AWS Kubernetes deployments, and intelligent AI agents for document-heavy workflows.',
        primary_cta_label: 'Request Live Demo',
        primary_cta_link: '/contact',
        secondary_cta_label: null,
        secondary_cta_link: null,
        status: 'inactive',
      },
      {
        headline: 'Q3 Campaign: EU Expansion Partners',
        sub_headline:
          'Seasonal campaign variant — pending review before publication.',
        primary_cta_label: 'Join the Waitlist',
        primary_cta_link: '/contact',
        secondary_cta_label: null,
        secondary_cta_link: null,
        status: 'draft',
      },
    ];

    const heroMediaSeeds = [
      {
        heroIndex: 0,
        media: [
          { media_type: 'image', media_url: 'https://placehold.co/1600x900/1e3a8a/ffffff.png?text=Milanova+Homepage+Hero', sort_order: 1, is_active: true },
          { media_type: 'image', media_url: 'https://placehold.co/1600x900/0f766e/ffffff.png?text=Cloud+Native+Solutions', sort_order: 2, is_active: true },
        ],
      },
      {
        heroIndex: 1,
        media: [
          { media_type: 'image', media_url: 'https://placehold.co/1600x900/4338ca/ffffff.png?text=SaaS+Product+Engineering', sort_order: 1, is_active: true },
        ],
      },
      {
        heroIndex: 2,
        media: [
          { media_type: 'image', media_url: 'https://placehold.co/1600x900/7c3aed/ffffff.png?text=%2ENET+Cloud+Backends', sort_order: 1, is_active: true },
        ],
      },
      {
        heroIndex: 3,
        media: [
          { media_type: 'image', media_url: 'https://placehold.co/1600x900/64748b/ffffff.png?text=Draft+Campaign+Visual', sort_order: 1, is_active: true },
        ],
      },
    ];

    const savedHeroes = await heroRepo.save(heroSeeds);

    const mediaRows: Pick<HeroMedia, 'hero_section_id' | 'media_type' | 'media_url' | 'sort_order' | 'is_active'>[] = [];
    for (const seed of heroMediaSeeds) {
      const hero = savedHeroes[seed.heroIndex];
      if (!hero) continue;
      for (const m of seed.media) {
        mediaRows.push({ hero_section_id: hero.id, ...m });
      }
    }
    await heroMediaRepo.save(mediaRows);
    console.log(` ✓ Hero sections seeded (${savedHeroes.length}; 1 active, 2 inactive, 1 draft)`);
  }

  // 7. Admin user + RBAC (idempotent)
  await seedAdminData(AppDataSource);
  console.log(' ✓ Admin & RBAC seeded');

  await AppDataSource.destroy();
  console.log('--- MilanoVA Database Seeder Completed Successfully ---');
}

seedMilanoVAData().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
