'use client';

import { FileText, Shield, AlertCircle, Scale, Lock, Clock } from 'lucide-react';
import { useEffect } from 'react';
import { buttonClassName, Card, Container, PageHeader } from './ui';

interface ContentItem {
  subtitle?: string;
  text?: string;
  points?: string[];
  additional?: string;
}

interface Section {
  icon: typeof FileText;
  title: string;
  content: ContentItem[];
}

const TermsAndConditions = () => {
  useEffect(() => {
    // Check if there's a hash in the URL
    const hash = window.location.hash;
    if (hash) {
      // Wait for the component to render
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          const header = document.querySelector('header');
          const headerHeight = header ? header.offsetHeight : 0;
          const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const sections: Section[] = [
    {
      icon: FileText,
      title: "1. Scope of Services",
      content: [
        {
          subtitle: "1.1 Core Services",
          text: "Reverence Technology (\"we,\" \"our,\" \"us\") provides bespoke software development, digital marketing, website and mobile application development, cloud infrastructure setup, UI/UX design, and other technology services as agreed upon in a signed Project Agreement, Statement of Work (SOW), or other written contract with you (\"Client\")."
        },
        {
          subtitle: "1.2 Related and Ancillary Services",
          text: "From time to time, we may offer consulting, training, or maintenance services as add-ons. Any such services are governed by the terms herein unless explicitly superseded by a separate written agreement."
        }
      ]
    },
    {
      icon: Clock,
      title: "2. Project Lifecycle and Responsibilities",
      content: [
        {
          subtitle: "2.1 Discovery and Requirements",
          points: [
            "Meet or communicate with you (via calls, video conferences, or written forms) to understand your objectives, preferred technologies, and desired outcomes.",
            "Document functional and technical requirements as best we can, and share them for your review and approval."
          ]
        },
        {
          subtitle: "2.2 Planning and Estimation",
          text: "Develop a detailed project plan, including milestones, deliverables, and estimated timelines, shared with you at kick-off or as updated in the Project Agreement."
        },
        {
          subtitle: "2.3 Design Phase",
          points: [
            "Create wireframes, mockups, or prototypes for your review.",
            "Incorporate feedback within a reasonable number of revision rounds (typically up to two rounds unless otherwise agreed).",
            "Finalize designs before proceeding to development to minimize scope creep."
          ]
        },
        {
          subtitle: "2.4 Development and Implementation",
          points: [
            "Write, test, and integrate code in accordance with the agreed specifications and industry best practices.",
            "Provide periodic progress updates (e.g., weekly or bi-weekly reports, demos) as specified in the Project Agreement.",
            "Use version control (e.g., Git) and maintain a staging or development environment accessible to you for review."
          ]
        },
        {
          subtitle: "2.5 Testing and Quality Assurance",
          points: [
            "Conduct unit, integration, and acceptance testing internally before delivering the milestone or final product.",
            "Address critical and high-priority bugs found during testing before requesting your acceptance."
          ]
        },
        {
          subtitle: "2.6 Deployment and Handover",
          points: [
            "Deploy the solution to your production environment or the agreed hosting platform.",
            "Provide necessary documentation, including deployment guides, architecture overviews, and user manuals where applicable.",
            "Transfer ownership of deliverables (source code, design files, etc.) upon receipt of full payment, subject to Section 5 (Intellectual Property)."
          ]
        },
        {
          subtitle: "2.7 Client Responsibilities",
          text: "You agree to:",
          points: [
            "Provide timely feedback, approvals, and any required materials (e.g., branding assets, content, credentials).",
            "Appoint a main point of contact who has the authority to make decisions on project direction and approvals.",
            "Pay invoices on time in accordance with Section 3 (Payment Terms).",
            "Ensure that any third-party services or platforms you provide (e.g., hosting accounts, APIs) remain accessible and configured properly."
          ]
        },
        {
          subtitle: "2.8 Project Delays",
          text: "Timelines in the Project Agreement are estimates based on your timely cooperation. We are not liable for delays caused by:",
          points: [
            "Late or incomplete feedback or approvals from you.",
            "Changes in project scope (see Section 4.2 on Change Requests).",
            "Third-party issues (hosting downtime, API changes, etc.) beyond our reasonable control.",
            "Force majeure events (natural disasters, pandemics, government actions, etc.)."
          ]
        }
      ]
    },
    {
      icon: Scale,
      title: "3. Payment Terms",
      content: [
        {
          subtitle: "3.1 Invoicing Schedule",
          text: "Exact percentages, milestones, and amounts are project-specific and detailed in the Project Agreement. For fixed-price projects, we invoice based on milestones; for time-and-materials or retainer-based work, we invoice monthly or as agreed."
        },
        {
          subtitle: "3.2 Payment Methods",
          text: "We accept bank transfers, mobile money (MTN Mobile Money, Airtel Money), and other methods as mutually agreed. All amounts are in Ugandan Shillings (UGX) or U.S. Dollars (USD) as stated in the invoice."
        },
        {
          subtitle: "3.3 Payment Due Dates",
          text: "Unless otherwise specified, invoices are due within 7 business days of issuance. Failure to pay on time may result in suspension of work."
        },
        {
          subtitle: "3.4 Late Payments",
          text: "Invoices not paid within 14 days of the due date may incur a late fee of 2% per month (or the maximum allowed by law) on the outstanding balance."
        },
        {
          subtitle: "3.5 Taxes and Withholding",
          text: "All fees are exclusive of applicable taxes (VAT, income tax withholding, etc.). You are responsible for any withholding taxes required under Ugandan law. If you withhold taxes from our invoice, you must provide us with a withholding tax certificate or receipt."
        },
        {
          subtitle: "3.6 Refunds and Cancellations",
          text: "For information about refund eligibility, cancellation processes, financial implications, and conditions, please refer to our comprehensive"
        }
      ]
    },
    {
      icon: AlertCircle,
      title: "4. Scope Changes and Additional Work",
      content: [
        {
          subtitle: "4.1 Change Requests",
          text: "Any request that materially alters the scope, features, or timeline is considered a \"Change Request.\" We will provide a written estimate (cost and time impact). Upon your approval, we will issue a revised Project Agreement or addendum."
        },
        {
          subtitle: "4.2 Minor Adjustments",
          text: "Minor clarifications or small tweaks that do not significantly affect the timeline or budget may be accommodated at our discretion."
        },
        {
          subtitle: "4.3 Milestone and Final Payments",
          text: "Payments tied to milestones must be settled before the next milestone commences. The final payment is due before the final handover or deployment to production."
        }
      ]
    },
    {
      icon: Shield,
      title: "5. Intellectual Property and Ownership",
      content: [
        {
          subtitle: "5.1 Deliverables Ownership",
          text: "Upon receipt of full payment, we transfer ownership of the custom-developed code, designs, and other deliverables specifically created for you under the Project Agreement. This transfer is subject to the conditions in Sections 5.2 and 5.3 below."
        },
        {
          subtitle: "5.2 Pre-Existing Materials and Third-Party Components",
          text: "We retain ownership of:",
          points: [
            "Pre-existing code, libraries, frameworks, templates, or design elements we created before or independently of your project.",
            "Third-party open-source or commercial components (e.g., React, Node.js modules, purchased UI kits) that are licensed separately and remain subject to their respective licenses."
          ],
          additional: "You receive a license to use these materials as part of the final deliverable, but you do not own them outright."
        },
        {
          subtitle: "5.3 Client Materials",
          text: "You retain ownership of all materials you provide (logos, trademarks, content, images, etc.). You grant us a non-exclusive, royalty-free license to use these materials solely for the purpose of completing the project."
        },
        {
          subtitle: "5.4 Portfolio and Marketing Rights",
          text: "We reserve the right to display the project (or excerpts thereof) in our portfolio, case studies, and marketing materials unless you request confidentiality in writing. We will not disclose sensitive business information or trade secrets without your consent."
        },
        {
          subtitle: "5.5 Indemnification for Client Materials",
          text: "You indemnify and hold us harmless from any claims, losses, damages, or expenses (including legal fees) arising from infringement or alleged infringement related to Client Materials."
        }
      ]
    },
    {
      icon: FileText,
      title: "6. Warranties and Acceptance",
      content: [
        {
          subtitle: "6.1 Workmanship Warranty",
          text: "We warrant that services will be performed in a professional and workmanlike manner consistent with industry standards."
        },
        {
          subtitle: "6.2 Acceptance Testing",
          text: "Upon delivery of a milestone or the final product, you have 7 business days to test and review. If no critical issues are reported within this period, the deliverable is deemed accepted."
        },
        {
          subtitle: "6.3 Bug Fixes During Acceptance",
          text: "Critical and high-priority bugs identified during the acceptance window will be fixed at no additional cost, provided they fall within the agreed scope and specifications."
        },
        {
          subtitle: "6.4 Post-Acceptance Warranty (Bug Fixing)",
          text: "For 30 days after final acceptance and full payment, we will fix bugs that:",
          points: [
            "Existed at the time of delivery, and",
            "Prevent the software from functioning as documented in the agreed specifications."
          ],
          additional: "This warranty does not cover issues caused by changes you make, third-party integrations, hosting environment changes, or new feature requests. The bug-fix process is the primary remedy for post-delivery issues. For refund information, see our Refund and Cancellation Policy (Refund Section 10)."
        },
        {
          subtitle: "6.5 No Other Warranties",
          text: "Except as expressly stated, we provide deliverables \"as is\" and disclaim all other warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement."
        }
      ]
    },
    {
      icon: AlertCircle,
      title: "7. Limitation of Liability",
      content: [
        {
          subtitle: "7.1 Cap on Liability",
          text: "To the fullest extent permitted by law, our total liability for any claims arising out of or related to this agreement (whether in contract, tort, negligence, or otherwise) shall not exceed the total amount paid by you to us under the specific Project Agreement giving rise to the claim."
        },
        {
          subtitle: "7.2 Exclusion of Consequential Damages",
          text: "We are not liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:",
          points: [
            "Loss of profits, revenue, or business opportunities.",
            "Loss of data (except to the extent caused by our gross negligence or willful misconduct).",
            "Cost of substitute services.",
            "Reputational harm."
          ]
        },
        {
          subtitle: "7.3 Exceptions",
          text: "The limitations in this Section do not apply to:",
          points: [
            "Liabilities that cannot be excluded or limited under applicable law.",
            "Breaches of confidentiality obligations under Section 9.",
            "Indemnification obligations under Section 5.5.",
            "Gross negligence or willful misconduct by us."
          ]
        },
        {
          subtitle: "7.4 Client's Responsibility",
          text: "You acknowledge that:",
          points: [
            "You are responsible for maintaining backups of your data.",
            "You assume all risks related to the use of the deliverables in your business operations.",
            "We are not responsible for third-party services, APIs, or platforms you choose to integrate."
          ]
        },
        {
          subtitle: "7.5 Survival",
          text: "This Section survives termination or expiration of the agreement."
        }
      ]
    },
    {
      icon: FileText,
      title: "8. Termination",
      content: [
        {
          subtitle: "8.1 Termination for Convenience",
          text: "Either party may terminate the Project Agreement upon 14 days' written notice. You remain liable for:",
          points: [
            "All work completed up to the termination date.",
            "Any non-refundable expenses we incurred on your behalf (e.g., third-party licenses, hosting setup fees)."
          ],
          additional: "For detailed information about refund eligibility and the cancellation process, please refer to our Refund and Cancellation Policy (Refund Section 7 and Cancellation Sections 14-22)."
        },
        {
          subtitle: "8.2 Termination for Cause",
          text: "Either party may terminate immediately if the other party:",
          points: [
            "Materially breaches these Terms and fails to cure within 7 days of written notice.",
            "Becomes insolvent, files for bankruptcy, or ceases business operations."
          ]
        },
        {
          subtitle: "8.3 Effect of Termination",
          text: "Upon termination:",
          points: [
            "You must pay all outstanding invoices within 7 days.",
            "We will complete any paid-for milestones in progress (unless termination is for our material breach).",
            "We may withhold delivery of work product and source code until full payment is received.",
            "Sections 5 (Intellectual Property), 7 (Limitation of Liability), 9 (Privacy Policy), 10 (Confidentiality), and 11 (Governing Law) survive termination."
          ]
        }
      ]
    },
    {
      icon: Lock,
      title: "9. Privacy Policy",
      content: [
        {
          subtitle: "9.1 Introduction",
          text: "Reverence Technology (\"we,\" \"us,\" \"our\") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect information when you engage our services, visit our website, or communicate with us.",
          additional: "This policy complies with applicable Ugandan data protection laws, including the Data Protection and Privacy Act, 2019, and international best practices."
        },
        {
          subtitle: "9.2 Information We Collect",
          text: "We may collect the following types of information:",
          points: [
            "Personal Identification Information: Name, email address, phone number, company name, job title, physical address",
            "Business Information: Company details, project requirements, business objectives, technical specifications",
            "Financial Information: Payment details, billing addresses, transaction records, tax information",
            "Technical Information: IP address, browser type, device information, website usage data, cookies",
            "Communications: Email correspondence, phone calls, meeting notes, project feedback, support requests",
            "Project-Related Data: Content you provide (logos, images, text), access credentials, third-party API keys, hosting information"
          ]
        },
        {
          subtitle: "9.3 How We Collect Information",
          text: "We collect information through:",
          points: [
            "Direct interactions: When you contact us, request a quote, sign a contract, or provide project materials",
            "Website interactions: Through forms, cookies, analytics tools, and automated technologies",
            "Third parties: Payment processors, hosting providers, communication platforms, professional advisors",
            "Project collaboration: Via project management tools, file sharing platforms, email, and video conferencing"
          ]
        },
        {
          subtitle: "9.4 How We Use Your Information",
          text: "We use your information for the following purposes:",
          points: [
            "Service Delivery: To perform our contractual obligations, develop your project, communicate progress, and deliver final products",
            "Business Operations: To process payments, maintain records, manage invoices, and handle administrative tasks",
            "Communication: To respond to inquiries, provide support, send project updates, and notify you of important changes",
            "Legal Compliance: To comply with legal obligations, tax requirements, dispute resolution, and regulatory reporting",
            "Marketing (with consent): To send newsletters, promotional materials, case studies, or service updates (you may opt out at any time)",
            "Improvement: To analyze website usage, improve our services, enhance user experience, and develop new offerings",
            "Portfolio and Case Studies: To showcase completed projects in our marketing materials (only with your explicit consent or as agreed in the contract)"
          ]
        },
        {
          subtitle: "9.5 Legal Basis for Processing (Data Protection Act, 2019)",
          text: "We process your personal data based on:",
          points: [
            "Contract Performance: Processing is necessary to fulfill our contractual obligations to you",
            "Consent: You have given explicit consent for specific processing activities (e.g., marketing communications)",
            "Legitimate Interests: Processing is necessary for our legitimate business interests (e.g., improving services, preventing fraud), provided your rights are not overridden",
            "Legal Obligation: Processing is required to comply with Ugandan law or regulatory requirements"
          ]
        },
        {
          subtitle: "9.6 Data Sharing and Disclosure",
          text: "We do not sell, rent, or trade your personal information. We may share your data with:",
          points: [
            "Service Providers: Third-party vendors who assist with hosting, payment processing, email delivery, analytics, or project tools (e.g., Google Workspace, Supabase, Stripe)",
            "Subcontractors: Trusted partners or freelancers working on your project under confidentiality agreements",
            "Legal Authorities: When required by law, court order, or to protect our rights, safety, or property",
            "Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred (we will notify you in advance)",
            "With Your Consent: When you explicitly authorize us to share information with third parties"
          ],
          additional: "All third parties are required to respect the confidentiality and security of your data and process it only for specified purposes."
        },
        {
          subtitle: "9.7 Data Retention",
          text: "We retain your information for as long as necessary to:",
          points: [
            "Fulfill the purposes outlined in this policy",
            "Comply with legal, accounting, or reporting obligations (typically 7 years for financial records under Ugandan tax law)",
            "Resolve disputes, enforce agreements, and protect our legal rights",
            "Provide post-project support during the warranty period"
          ],
          additional: "After the retention period expires, we will securely delete or anonymize your data unless legal obligations require longer retention."
        },
        {
          subtitle: "9.8 Data Security",
          text: "We implement appropriate technical and organizational measures to protect your data, including:",
          points: [
            "Encryption: SSL/TLS encryption for data transmission, encrypted storage for sensitive information",
            "Access Controls: Role-based access, strong passwords, multi-factor authentication where applicable",
            "Secure Infrastructure: Use of reputable hosting providers (e.g., Supabase, Vercel) with robust security practices",
            "Regular Backups: Automated backups to prevent data loss",
            "Employee Training: Staff are trained on data protection and confidentiality obligations",
            "Incident Response: Procedures in place to detect, respond to, and report data breaches"
          ],
          additional: "While we take security seriously, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security but will notify you promptly in the event of a data breach as required by law."
        },
        {
          subtitle: "9.9 Your Rights (Data Protection Act, 2019)",
          text: "Under Ugandan data protection law, you have the right to:",
          points: [
            "Access: Request a copy of the personal data we hold about you",
            "Rectification: Request correction of inaccurate or incomplete data",
            "Erasure: Request deletion of your data (subject to legal retention requirements)",
            "Restriction: Request that we limit processing of your data in certain circumstances",
            "Objection: Object to processing based on legitimate interests or for marketing purposes",
            "Data Portability: Request transfer of your data to another service provider in a structured, machine-readable format",
            "Withdraw Consent: Withdraw consent for processing at any time (does not affect lawfulness of prior processing)",
            "Complaint: Lodge a complaint with the Uganda Personal Data Protection Office (PDPO) if you believe your rights have been violated"
          ],
          additional: "To exercise any of these rights, please contact us at reverencetech1@gmail.com. We will respond within 21 days as required by law."
        },
        {
          subtitle: "9.10 Cookies and Tracking Technologies",
          text: "Our website uses cookies and similar technologies to:",
          points: [
            "Essential Cookies: Enable core website functionality (e.g., session management, security)",
            "Analytics Cookies: Understand how visitors use our site (e.g., Google Analytics) to improve user experience",
            "Preference Cookies: Remember your settings and preferences",
            "Marketing Cookies: Deliver relevant advertisements and track campaign effectiveness (only with your consent)"
          ],
          additional: "You can control cookies through your browser settings. Disabling cookies may affect website functionality. For more information, see our Cookie Policy or contact us."
        },
        {
          subtitle: "9.11 International Data Transfers",
          text: "Your data may be processed or stored outside Uganda (e.g., on cloud servers in the EU or US). When transferring data internationally, we ensure:",
          points: [
            "Adequate protection through standard contractual clauses, Privacy Shield frameworks (where applicable), or other legal mechanisms",
            "Compliance with Ugandan data protection laws and international standards",
            "Third-party processors adhere to equivalent data protection standards"
          ],
          additional: "By engaging our services, you consent to such transfers as necessary for service delivery."
        },
        {
          subtitle: "9.12 Children's Privacy",
          text: "Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without parental consent, we will take steps to delete it promptly."
        },
        {
          subtitle: "9.13 Third-Party Links",
          text: "Our website or communications may contain links to third-party websites, services, or platforms. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information."
        },
        {
          subtitle: "9.14 Changes to This Privacy Policy",
          text: "We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or business operations. We will:",
          points: [
            "Post the updated policy on our website with a \"Last Updated\" date",
            "Notify you by email if changes are material and affect your rights",
            "Obtain your consent if required by law for significant changes"
          ],
          additional: "Your continued use of our services after updates constitutes acceptance of the revised policy."
        },
        {
          subtitle: "9.15 Contact Information for Privacy Matters",
          text: "For questions, concerns, or requests related to this Privacy Policy or your personal data, please contact:",
          points: [
            "Email: reverencetech1@gmail.com (mark your email \"Privacy Request\" for priority handling)",
            "Phone: +256 783 676 313",
            "Address: Reverence Technology, Mutungo Zone 1, Kampala, Central Region, Uganda"
          ],
          additional: "We aim to respond to all privacy-related inquiries within 21 days. If you are not satisfied with our response, you may lodge a complaint with the Uganda Personal Data Protection Office (PDPO)."
        }
      ]
    },
    {
      icon: Lock,
      title: "10. Confidentiality",
      content: [
        {
          subtitle: "10.1 Definition",
          text: "\"Confidential Information\" means non-public information disclosed by one party to the other, including business plans, technical data, customer lists, financial information, and any information marked or identified as confidential."
        },
        {
          subtitle: "10.2 Obligations",
          text: "Each party agrees to:",
          points: [
            "Keep Confidential Information strictly confidential.",
            "Use it only for the purpose of performing under the Project Agreement.",
            "Not disclose it to third parties without prior written consent, except to employees, contractors, or advisors who need to know and are bound by similar confidentiality obligations."
          ]
        },
        {
          subtitle: "10.3 Exceptions",
          text: "Confidential Information does not include information that:",
          points: [
            "Is or becomes publicly available through no breach by the receiving party.",
            "Was rightfully known to the receiving party before disclosure.",
            "Is independently developed by the receiving party without use of the disclosing party's Confidential Information.",
            "Is required to be disclosed by law or court order (provided the receiving party gives prompt notice to allow the disclosing party to seek protective measures)."
          ]
        },
        {
          subtitle: "10.4 Duration of Obligations",
          text: "Confidentiality obligations survive for 3 years after termination of the Project Agreement, or indefinitely for trade secrets."
        }
      ]
    },
    {
      icon: Scale,
      title: "11. Governing Law and Dispute Resolution",
      content: [
        {
          subtitle: "11.1 Governing Law",
          text: "These Terms and any Project Agreement are governed by and construed in accordance with the laws of Uganda, without regard to its conflict of laws principles."
        },
        {
          subtitle: "11.2 Dispute Resolution",
          text: "In the event of a dispute:",
          points: [
            "Negotiation: The parties will first attempt to resolve the matter through good-faith negotiation.",
            "Mediation: If negotiation fails within 30 days, the parties agree to mediate the dispute with a mutually acceptable mediator in Kampala, Uganda.",
            "Arbitration or Litigation: If mediation fails, disputes may be resolved through arbitration under the rules of the Kampala Centre for Arbitration and Dispute Resolution (KCADR), or by litigation in the courts of Kampala, Uganda, at the election of the party initiating the proceeding."
          ]
        },
        {
          subtitle: "11.3 Injunctive Relief",
          text: "Nothing in this Section prevents either party from seeking injunctive or equitable relief in court to protect intellectual property rights or Confidential Information."
        }
      ]
    },
    {
      icon: FileText,
      title: "12. Changes to Terms",
      content: [
        {
          text: "We reserve the right to update these Terms at any time. We will notify you of material changes by:",
          points: [
            "Posting the updated Terms on our website (www.reverencetechnology.com) with a \"Last Updated\" date at the top.",
            "Sending an email to the address on file for active projects."
          ],
          additional: "Your continued engagement with us after notice constitutes acceptance of the revised Terms. If you do not agree, you may terminate the Project Agreement as per Section 8.1."
        }
      ]
    },
    {
      icon: FileText,
      title: "13. General Provisions",
      content: [
        {
          subtitle: "13.1 Entire Agreement",
          text: "These Terms, together with any Project Agreement or SOW, constitute the entire agreement between you and us regarding the services, superseding all prior or contemporaneous communications (oral or written)."
        },
        {
          subtitle: "13.2 Amendments",
          text: "Any amendment to a specific Project Agreement must be in writing and signed by both parties."
        },
        {
          subtitle: "13.3 Severability",
          text: "If any provision of these Terms is found invalid or unenforceable, the remaining provisions continue in full force and effect."
        },
        {
          subtitle: "13.4 Waiver",
          text: "Failure to enforce any right or provision does not constitute a waiver of that right or provision."
        },
        {
          subtitle: "13.5 Assignment",
          text: "You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations to an affiliate or in connection with a merger, acquisition, or sale of assets, provided we give you reasonable notice."
        },
        {
          subtitle: "13.6 Independent Contractors",
          text: "The parties are independent contractors. Nothing in these Terms creates a partnership, joint venture, agency, or employment relationship."
        },
        {
          subtitle: "13.7 Notices",
          text: "All notices must be in writing and sent to the contact information in the Project Agreement. Email is acceptable for routine communications; formal notices (e.g., termination) should be sent via registered mail or email with confirmation of receipt."
        }
      ]
    },
    {
      icon: FileText,
      title: "14. Contact Us",
      content: [
        {
          text: "If you have questions about these Terms and Conditions, our Privacy Policy, or any other matters, please contact us:",
          points: [
            "Company: Reverence Technology",
            "Email: reverencetech1@gmail.com",
            "Phone: +256 783 676 313",
            "Address: Mutungo, Zone 1, Kampala, Uganda"
          ]
        }
      ]
    }
  ];

  return (
    <div className="bg-paper pb-16">
      <PageHeader
        eyebrow="Legal"
        title="Terms and Conditions"
        description="Reverence Technology software development services. Last updated January 2024."
      />

      <Container className="py-12">
        <div className="mx-auto max-w-4xl">
        <Card className="mb-8 p-5 sm:p-8">
          <div className="prose prose-editorial">
            <p>
              Welcome to <strong>Reverence Technology</strong>. These Terms and Conditions (&quot;Terms&quot;)
              govern your engagement with us for software development, digital marketing, website and
              mobile application development, cloud infrastructure, UI/UX design, and related technology
              services.
            </p>
            <p>
              By signing a Project Agreement, Statement of Work (SOW), or otherwise engaging our services,
              you agree to be bound by these Terms. Please read them carefully. If you do not agree with
              any part of these Terms, please do not proceed with our services.
            </p>
          </div>
        </Card>

        {sections.map((section, idx) => {
          const IconComponent = section.icon;
          return (
            <div
              key={idx}
              id={section.title === "9. Privacy Policy" ? "privacy-policy" : section.title === "10. Confidentiality" ? "confidentiality" : undefined}
            >
            <Card className="mb-8 p-5 sm:p-8">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-rule bg-paper">
                  <IconComponent className="h-6 w-6 text-gold" />
                </div>
                <h2 className="mt-2 font-serif text-lg font-medium leading-snug text-ink-deep sm:text-2xl">
                  {section.title}
                </h2>
              </div>

              <div className="prose prose-editorial space-y-6 sm:ml-16">
                {section.content.map((item, itemIdx) => (
                  <div key={itemIdx}>
                    {item.subtitle && (
                      <h3>{item.subtitle}</h3>
                    )}
                    {item.text && (
                      <p>
                        {item.text.includes('comprehensive') && item.subtitle === '3.6 Refunds and Cancellations' ? (
                          <>
                            {item.text}{' '}
                            <a href="/refund-policy">
                              Refund and Cancellation Policy
                            </a>
                            .
                          </>
                        ) : (
                          item.text
                        )}
                      </p>
                    )}
                    {item.points && (
                      <ul>
                        {item.points.map((point, pointIdx) => (
                          <li key={pointIdx}>{point}</li>
                        ))}
                      </ul>
                    )}
                    {item.additional && (
                      <p>
                        {item.additional.includes('Refund and Cancellation Policy') ? (
                          <>
                            {item.additional.split('Refund and Cancellation Policy').map((part, i, arr) => (
                              i < arr.length - 1 ? (
                                <span key={i}>
                                  {part}
                                  <a href="/refund-policy">
                                    Refund and Cancellation Policy
                                  </a>
                                </span>
                              ) : part
                            ))}
                          </>
                        ) : (
                          item.additional
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            </div>
          );
        })}

        <div className="border border-rule bg-ink-deep p-5 text-paper sm:p-8">
          <h2 className="mb-4 font-serif text-2xl font-medium">Questions or Concerns?</h2>
          <p className="mb-6 text-paper/70">
            If you have any questions about these Terms and Conditions, please don&apos;t hesitate
            to reach out to our team.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="mailto:reverencetech1@gmail.com"
              className={buttonClassName()}
            >
              Email Us
            </a>
            <a
              href="tel:+256783676313"
              className={buttonClassName('secondary', 'md', 'border-paper/30 text-paper hover:bg-paper hover:text-ink-deep')}
            >
              Call Us
            </a>
            <a
              href="/refund-policy"
              className={buttonClassName('secondary', 'md', 'border-paper/30 text-paper hover:bg-paper hover:text-ink-deep')}
            >
              View Refund &amp; Cancellation Policy
            </a>
          </div>
        </div>
        </div>
      </Container>
    </div>
  );
};

export default TermsAndConditions;
