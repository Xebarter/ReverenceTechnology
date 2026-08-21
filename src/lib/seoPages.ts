export type ServiceFaq = { question: string; answer: string };
export type ServiceCapability = { title: string; body: string };

export type ServicePage = {
  slug: string;
  eyebrow: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  capabilities: ServiceCapability[];
  faqs: ServiceFaq[];
  related: string[];
  serviceType: string;
  keywords: string[];
};

export const SERVICE_HUB = {
  title: 'Software Development Services in Uganda',
  description:
    'Custom software, web development, mobile apps, ecommerce, and business systems from Reverence Technology in Kampala — built for Ugandan and East African organisations.',
  h1: 'Software, web, and app development in Uganda',
  intro:
    'Reverence Technology designs and builds digital systems for businesses across Kampala and East Africa. Choose a service to see how we work — then brief a project when you are ready.',
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: 'software-development-uganda',
    eyebrow: 'Custom software',
    title: 'Custom Software Development in Uganda',
    h1: 'Custom software development for Ugandan businesses',
    description:
      'A software development company in Kampala building bespoke business systems, web apps, and integrations for organisations across Uganda and East Africa.',
    intro:
      'Off-the-shelf tools often stop short of how Ugandan organisations actually operate. We design and engineer custom software — from internal operations platforms to customer-facing products — so your processes, payments, and reporting live in one considered system.',
    serviceType: 'Custom software development',
    keywords: [
      'custom software development Uganda',
      'software development company Uganda',
      'software developers Kampala',
      'bespoke software development Uganda',
    ],
    capabilities: [
      {
        title: 'Business systems from the ground up',
        body: 'We map how your teams work today, then build software that replaces spreadsheets, fragmented tools, and manual hand-offs.',
      },
      {
        title: 'Engineering you can own',
        body: 'Clean architecture, documented APIs, and a handover that leaves you with the source code — not a black box.',
      },
      {
        title: 'Built for East African context',
        body: 'Mobile-first usage, unreliable connectivity, and local payment rails are treated as constraints from day one, not afterthoughts.',
      },
      {
        title: 'Partnership after launch',
        body: 'Hosting, monitoring, and iterative improvements so the product keeps pace with the business.',
      },
    ],
    faqs: [
      {
        question: 'What does a custom software project in Uganda typically include?',
        answer:
          'Discovery, UX and architecture, iterative development, testing, deployment, and knowledge transfer. Most engagements also include integrations such as payments, SMS, or an existing accounting system.',
      },
      {
        question: 'Do you work with startups as well as established companies?',
        answer:
          'Yes. We build for startups that need a first product, and for established organisations replacing legacy processes. Scope and commercial structure follow the problem, not a one-size package.',
      },
      {
        question: 'Where is Reverence Technology based?',
        answer:
          'We are based in Mutungo, Kampala, and deliver for clients across Uganda and the wider East African region.',
      },
      {
        question: 'How do we start?',
        answer:
          'Brief a project from this site with your goals and constraints. We respond with a proposed approach, timeline, and a quoted total you can pay in installments as work is delivered.',
      },
    ],
    related: ['web-development-uganda', 'business-automation-uganda', 'system-integration-uganda'],
  },
  {
    slug: 'web-development-uganda',
    eyebrow: 'Web development',
    title: 'Web Development Company in Kampala',
    h1: 'Web development and custom websites in Uganda',
    description:
      'Professional web development in Kampala: business websites, web applications, and corporate sites designed and engineered by Reverence Technology.',
    intro:
      'A website should represent the organisation with the same care you bring to the work itself. We design and develop fast, responsive sites and web applications for companies that need more than a template — from a considered corporate presence to a full product on the web.',
    serviceType: 'Web development',
    keywords: [
      'web development Uganda',
      'website development Kampala',
      'web development company Uganda',
      'custom website development Uganda',
    ],
    capabilities: [
      {
        title: 'Business and corporate websites',
        body: 'Clear information architecture, refined typography, and pages that load quickly on Ugandan networks.',
      },
      {
        title: 'Web applications',
        body: 'Authenticated portals, dashboards, and operational tools — not just a brochure site.',
      },
      {
        title: 'Responsive by default',
        body: 'Layouts that hold up on phones first, then tablets and desktops, without sacrificing craft.',
      },
      {
        title: 'Maintainable code',
        body: 'Modern stacks your team can extend, with analytics, SEO foundations, and a CMS where it helps.',
      },
    ],
    faqs: [
      {
        question: 'Do you design and develop, or only code an existing design?',
        answer:
          'Both. Most clients ask us to handle design and engineering together so the site feels of a piece. We can also implement a design you already have.',
      },
      {
        question: 'Can you rebuild an existing website?',
        answer:
          'Yes. We migrate content, improve structure and performance, and keep the URLs you want to protect for search.',
      },
      {
        question: 'Do you build ecommerce websites?',
        answer:
          'Yes — catalogues, checkout, and payment integration. See our ecommerce development service for marketplace and multi-vendor work.',
      },
      {
        question: 'How long does a typical business website take?',
        answer:
          'A focused marketing site is often measured in weeks, not months. Web applications depend on scope; we share a timeline after discovery.',
      },
    ],
    related: ['ecommerce-development-uganda', 'software-development-uganda', 'mobile-app-development-uganda'],
  },
  {
    slug: 'mobile-app-development-uganda',
    eyebrow: 'Mobile apps',
    title: 'Mobile App Development in Uganda',
    h1: 'Android, iOS, and cross-platform app development',
    description:
      'Mobile app developers in Kampala building Android, iOS, Flutter, and React Native applications for businesses and startups in Uganda.',
    intro:
      'Most of your customers will meet you on a phone. We design and ship mobile applications — native where it matters, cross-platform where it is wiser — with the payments, notifications, and offline behaviour East African products actually need.',
    serviceType: 'Mobile application development',
    keywords: [
      'mobile app development Uganda',
      'mobile app developers Kampala',
      'Flutter developers Uganda',
      'Android app development Uganda',
    ],
    capabilities: [
      {
        title: 'Android and iOS',
        body: 'Store-ready applications with the performance and platform conventions users expect.',
      },
      {
        title: 'Flutter and React Native',
        body: 'One codebase when speed and budget favour it, without treating either platform as an afterthought.',
      },
      {
        title: 'Product design',
        body: 'Flows, visual language, and UI that feel considered — not a desktop site squeezed onto a screen.',
      },
      {
        title: 'Launch and beyond',
        body: 'Store listings, push notifications, analytics, and a plan for updates after the first release.',
      },
    ],
    faqs: [
      {
        question: 'Should we build native or cross-platform?',
        answer:
          'It depends on device features, team skills, and timeline. We recommend a path in discovery rather than defaulting to one framework.',
      },
      {
        question: 'Can you build for both Android and iPhone?',
        answer:
          'Yes. Most commercial apps we ship target both, either natively or with Flutter / React Native.',
      },
      {
        question: 'Do you integrate mobile money and cards?',
        answer:
          'Yes. Payment gateway and mobile-money integration is a regular part of app work in Uganda.',
      },
      {
        question: 'Will we own the app?',
        answer:
          'Yes. You own the source code, store listings, and accounts we set up for you, with a full handover on completion.',
      },
    ],
    related: ['software-development-uganda', 'ecommerce-development-uganda', 'web-development-uganda'],
  },
  {
    slug: 'business-automation-uganda',
    eyebrow: 'Automation',
    title: 'Business Automation Software in Uganda',
    h1: 'Automate operations — without another spreadsheet',
    description:
      'Business process automation and workflow software in Uganda. Replace manual work with systems designed around how your teams actually operate.',
    intro:
      'If growth still depends on WhatsApp threads and Excel, the constraint is the process, not the people. We build workflow and operations software that captures work once, routes it correctly, and gives leadership a live view of what is happening.',
    serviceType: 'Business process automation',
    keywords: [
      'business automation Uganda',
      'workflow automation Uganda',
      'business management software Kampala',
      'replace spreadsheets with software Uganda',
    ],
    capabilities: [
      {
        title: 'Process first, software second',
        body: 'We document the real workflow — exceptions included — then automate the path that staff already understand.',
      },
      {
        title: 'Approvals, alerts, and audit trails',
        body: 'The right person sees the right task, with a record of who did what and when.',
      },
      {
        title: 'Connect the tools you already use',
        body: 'Accounting, payments, SMS, and email can sit behind one operational layer instead of five logins.',
      },
      {
        title: 'Visible operations',
        body: 'Dashboards for volume, bottlenecks, and exceptions — so you manage the work, not the files.',
      },
    ],
    faqs: [
      {
        question: 'Is this an off-the-shelf automation tool?',
        answer:
          'No. We build around your process. Where a proven platform is enough, we say so. Where it is not, we engineer a system that fits.',
      },
      {
        question: 'Can you start with one department?',
        answer:
          'Yes — and we usually recommend it. Automate a painful workflow well, then extend, rather than boiling the ocean.',
      },
      {
        question: 'Will staff need weeks of training?',
        answer:
          'We design for the people who will use it daily. Training is part of handover, but the interface should feel familiar quickly.',
      },
      {
        question: 'How is this different from an ERP?',
        answer:
          'ERP covers a broad enterprise footprint. Automation work is often a focused system — or a stepping stone to a larger ERP later.',
      },
    ],
    related: ['erp-development-uganda', 'software-development-uganda', 'system-integration-uganda'],
  },
  {
    slug: 'erp-development-uganda',
    eyebrow: 'ERP',
    title: 'ERP Software Development in Uganda',
    h1: 'Custom ERP and business management systems',
    description:
      'ERP development in Uganda: custom and tailored business management systems for finance, inventory, HR, and operations — including cloud and web-based ERP.',
    intro:
      'Enterprise resource planning should reflect how the organisation buys, sells, stocks, and reports — not the other way around. We develop and customise ERP-class systems for Ugandan companies that have outgrown disconnected tools.',
    serviceType: 'ERP software development',
    keywords: [
      'ERP software Uganda',
      'custom ERP development Uganda',
      'business ERP Kampala',
      'web based ERP Uganda',
    ],
    capabilities: [
      {
        title: 'Core operational modules',
        body: 'Inventory, sales, purchasing, finance, and HR — scoped to what you will actually use in the first year.',
      },
      {
        title: 'Industry-shaped ERP',
        body: 'Schools, hospitals, retail, construction, and professional services each need different defaults. We start from yours.',
      },
      {
        title: 'Cloud and web-based delivery',
        body: 'Access from the office and the field, with roles and permissions that match how authority works in the company.',
      },
      {
        title: 'Implementation, not just code',
        body: 'Data migration, training, and a cutover plan so go-live is a date, not a hope.',
      },
    ],
    faqs: [
      {
        question: 'Do you implement existing ERP products or build custom?',
        answer:
          'Both paths are possible. We advise based on complexity, budget, and how unusual your processes are. Many Ugandan SMEs are better served by a tailored system than a heavyweight global suite.',
      },
      {
        question: 'Can you integrate an ERP with our current accounting software?',
        answer:
          'Yes. Integration with accounting, payments, and existing databases is a standard part of this work.',
      },
      {
        question: 'Is a custom ERP affordable for a mid-sized company?',
        answer:
          'We phase modules so you are not buying a cathedral on day one. You pay against a quoted total, in installments as we deliver.',
      },
      {
        question: 'How long does ERP work take?',
        answer:
          'A focused first module can land in months. A full operational footprint is a programme. We are explicit about phases before you commit.',
      },
    ],
    related: ['business-automation-uganda', 'pos-inventory-uganda', 'school-management-software-uganda'],
  },
  {
    slug: 'ecommerce-development-uganda',
    eyebrow: 'Ecommerce',
    title: 'Ecommerce Website Development in Uganda',
    h1: 'Online stores, marketplaces, and payment integration',
    description:
      'Ecommerce developers in Kampala building online shops, multi-vendor marketplaces, and apps with mobile money and card payment integration in Uganda.',
    intro:
      'Selling online in Uganda means catalogues that load on modest connections, checkout that includes mobile money, and operations that warehouse, dispatch, and reconcile without drama. That is the work we take on — stores, marketplaces, and the systems behind them.',
    serviceType: 'Ecommerce development',
    keywords: [
      'ecommerce development Uganda',
      'ecommerce website developers Kampala',
      'online marketplace development Uganda',
      'payment gateway integration Uganda',
    ],
    capabilities: [
      {
        title: 'Online stores',
        body: 'Product catalogues, carts, promotions, and a checkout path your customers will finish.',
      },
      {
        title: 'Marketplaces',
        body: 'Multi-vendor onboarding, commissions, and seller tools when you are the platform, not only the merchant.',
      },
      {
        title: 'Payments that belong here',
        body: 'Mobile money and card gateways wired into order state — not a generic plugin hoped to work.',
      },
      {
        title: 'Ecommerce apps',
        body: 'A companion or primary mobile app when the audience lives on Android and iOS.',
      },
    ],
    faqs: [
      {
        question: 'Can you add ecommerce to an existing website?',
        answer:
          'Often yes. We assess the current stack and either extend it or rebuild the commerce layer so catalogue and checkout are reliable.',
      },
      {
        question: 'Do you support multi-vendor marketplaces?',
        answer:
          'Yes. Vendor onboarding, product approval, and settlement logic are part of marketplace engagements.',
      },
      {
        question: 'Which payment methods can you integrate?',
        answer:
          'Mobile money and major card/hosted checkout providers used in Uganda. We confirm the rails during discovery.',
      },
      {
        question: 'Will the store work well on phones?',
        answer:
          'That is the default. Most Ugandan shoppers are on mobile; the store is designed accordingly.',
      },
    ],
    related: ['web-development-uganda', 'mobile-app-development-uganda', 'pos-inventory-uganda'],
  },
  {
    slug: 'school-management-software-uganda',
    eyebrow: 'Education',
    title: 'School Management Software in Uganda',
    h1: 'School ERP, fees, and parent portals',
    description:
      'School management systems in Uganda: fees, attendance, exams, student records, and parent or student portals — built for Ugandan schools.',
    intro:
      'A school runs on people, records, and trust. We build school management software that gathers enrolment, fees, attendance, and results in one place — with portals that parents and staff will actually use.',
    serviceType: 'School management software',
    keywords: [
      'school management system Uganda',
      'school ERP Uganda',
      'school fees management system Uganda',
      'student information system Uganda',
    ],
    capabilities: [
      {
        title: 'Student and academic records',
        body: 'Enrolment, classes, attendance, examinations, and results without parallel paper registers.',
      },
      {
        title: 'Fees and finance',
        body: 'Invoicing, receipts, balances, and reporting that bursars and auditors can follow.',
      },
      {
        title: 'Portals',
        body: 'Parent, student, and teacher access with the right information for each role.',
      },
      {
        title: 'School websites and apps',
        body: 'A public site and, where useful, a mobile app for notices and fee reminders.',
      },
    ],
    faqs: [
      {
        question: 'Is this only for large schools?',
        answer:
          'No. We scope modules to the school’s size. A smaller institution can start with fees and records; a campus can add academics, HR, and reporting.',
      },
      {
        question: 'Can parents pay fees through the system?',
        answer:
          'Where your payment partners allow it, we integrate collections and reconcile against student accounts.',
      },
      {
        question: 'Do you migrate data from Excel or an old system?',
        answer:
          'Yes. Data migration is planned as part of implementation, not left as a surprise at go-live.',
      },
      {
        question: 'Can one system serve several campuses?',
        answer:
          'Yes, with the right permissions so each campus sees its own records while the centre sees the whole.',
      },
    ],
    related: ['erp-development-uganda', 'web-development-uganda', 'mobile-app-development-uganda'],
  },
  {
    slug: 'restaurant-pos-uganda',
    eyebrow: 'Hospitality',
    title: 'Restaurant POS Systems in Uganda',
    h1: 'Restaurant POS, ordering, and kitchen systems',
    description:
      'Restaurant management software in Uganda: POS, billing, inventory, online ordering, and food-service apps for restaurants and hotels.',
    intro:
      'Service is only as smooth as the system behind the pass. We build restaurant POS and ordering software — from the floor to the kitchen to stock — so tickets, bills, and inventory stay in step during a busy service.',
    serviceType: 'Restaurant POS software',
    keywords: [
      'restaurant POS Uganda',
      'restaurant management system Uganda',
      'restaurant ordering system Uganda',
      'food ordering app development Uganda',
    ],
    capabilities: [
      {
        title: 'Point of sale',
        body: 'Fast billing, tables, modifiers, and the receipts your accounts team expects.',
      },
      {
        title: 'Kitchen and floor',
        body: 'Orders routed where they need to go, with status that waiters and chefs can trust.',
      },
      {
        title: 'Stock and recipes',
        body: 'Inventory that moves when a dish is sold, not when someone remembers to update a sheet.',
      },
      {
        title: 'Ordering beyond the dining room',
        body: 'Online ordering or a simple app when you are ready to take demand off WhatsApp.',
      },
    ],
    faqs: [
      {
        question: 'Will this work with our existing printers and cash drawers?',
        answer:
          'We specify hardware during discovery. Most standard thermal printers and drawers can be supported; we confirm before you buy.',
      },
      {
        question: 'Can we run more than one outlet?',
        answer:
          'Yes. Multi-location reporting is a common requirement and is designed in rather than bolted on.',
      },
      {
        question: 'Do you build food delivery apps as well?',
        answer:
          'We can, as a related engagement. Many restaurants start with POS and add ordering once the floor is stable.',
      },
      {
        question: 'How disruptive is go-live during service hours?',
        answer:
          'We train on a quiet shift, run parallel where needed, and cut over with a plan — not in the Friday rush.',
      },
    ],
    related: ['pos-inventory-uganda', 'mobile-app-development-uganda', 'ecommerce-development-uganda'],
  },
  {
    slug: 'pos-inventory-uganda',
    eyebrow: 'Retail',
    title: 'POS and Inventory Software in Uganda',
    h1: 'Point of sale, stock, and shop management',
    description:
      'POS and inventory systems in Uganda for retail, wholesale, pharmacies, and supermarkets — sales, stock, and reporting in one place.',
    intro:
      'A shop should know what it sold, what remains, and what to reorder — without closing the till to count. We build POS and inventory software for retailers and wholesalers who need that picture every day.',
    serviceType: 'Point of sale and inventory software',
    keywords: [
      'POS system Uganda',
      'inventory management software Uganda',
      'retail management software Uganda',
      'pharmacy POS Uganda',
    ],
    capabilities: [
      {
        title: 'Counter and checkout',
        body: 'Barcode-friendly selling, receipts, and cashier roles that keep the line moving.',
      },
      {
        title: 'Stock you can trust',
        body: 'Purchases, transfers, adjustments, and low-stock alerts instead of a heroic end-of-month count.',
      },
      {
        title: 'Retail verticals',
        body: 'Shops, wholesale, pharmacies, and supermarkets each have rules; we encode yours rather than forcing a generic till.',
      },
      {
        title: 'Owners’ reporting',
        body: 'Sales, margin, and stock value without exporting half a dozen spreadsheets.',
      },
    ],
    faqs: [
      {
        question: 'Can this run if the internet drops?',
        answer:
          'We design for local resilience where the counter cannot stop. Exact offline behaviour is agreed in discovery.',
      },
      {
        question: 'Do you support multiple branches?',
        answer:
          'Yes. Central stock and per-branch sales are a typical requirement for growing retailers.',
      },
      {
        question: 'Will it work with our supplier or accounting software?',
        answer:
          'Integrations are scoped per client. Many retailers start with POS and inventory, then connect finance.',
      },
      {
        question: 'Is this only for large supermarkets?',
        answer:
          'No. A single shop with serious stock discipline is a good first system; larger footprints add branches and purchasing.',
      },
    ],
    related: ['restaurant-pos-uganda', 'erp-development-uganda', 'ecommerce-development-uganda'],
  },
  {
    slug: 'system-integration-uganda',
    eyebrow: 'Integration',
    title: 'API and System Integration in Uganda',
    h1: 'APIs, payments, and digital transformation',
    description:
      'System integration in Uganda: APIs, payment gateways, and connections between the software you already run — with a path to broader digital transformation.',
    intro:
      'Most organisations do not need another island of software. They need the systems they already paid for to speak to each other. We design APIs, payment integrations, and staged digital transformation so data moves once and stays true.',
    serviceType: 'System integration',
    keywords: [
      'API integration Uganda',
      'payment gateway integration Uganda',
      'system integration Uganda',
      'digital transformation Uganda',
    ],
    capabilities: [
      {
        title: 'APIs and middleware',
        body: 'Stable contracts between CRMs, ERPs, websites, and internal tools — documented and versioned.',
      },
      {
        title: 'Payments and notifications',
        body: 'Checkout, mobile money, SMS, and email wired into the business event — paid, failed, fulfilled.',
      },
      {
        title: 'Legacy without a big-bang rewrite',
        body: 'Bridge layers around systems that still earn their keep, while newer products take the customer-facing load.',
      },
      {
        title: 'A transformation sequence',
        body: 'We help you choose the next system worth changing, so digital transformation is a programme with dates, not a slogan.',
      },
    ],
    faqs: [
      {
        question: 'Can you integrate with SAP, Oracle, or our in-house database?',
        answer:
          'Often yes, via APIs or a secure bridge. We assess access, data quality, and risk before promising a pattern.',
      },
      {
        question: 'Is this only for large enterprises?',
        answer:
          'No. A growing company with three tools that do not share customers is a classic integration brief.',
      },
      {
        question: 'Do you provide IT consulting without building software?',
        answer:
          'We can advise on architecture and vendor choices. Most clients then ask us to implement the first integration.',
      },
      {
        question: 'How do you keep integrations from becoming fragile?',
        answer:
          'Explicit contracts, logging, and ownership. We treat integration as a product with tests, not a one-off script.',
      },
    ],
    related: ['software-development-uganda', 'business-automation-uganda', 'ecommerce-development-uganda'],
  },
];

export function getServicePage(slug: string): ServicePage | undefined {
  return SERVICE_PAGES.find((page) => page.slug === slug);
}

export function getServiceSlugs(): string[] {
  return SERVICE_PAGES.map((page) => page.slug);
}

export function relatedServicePages(page: ServicePage): ServicePage[] {
  return page.related
    .map((slug) => getServicePage(slug))
    .filter((item): item is ServicePage => Boolean(item));
}
