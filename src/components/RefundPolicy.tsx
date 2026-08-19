'use client';

import { DollarSign, Shield, AlertTriangle, Clock, FileCheck, XCircle, CheckCircle, Mail, Ban, FileX, AlertCircle as AlertCircleIcon, PhoneOff } from 'lucide-react';
import { useEffect } from 'react';
import { buttonClassName, Card, Container, PageHeader } from './ui';

interface ContentItem {
  subtitle?: string;
  text?: string;
  points?: string[];
  additional?: string;
  note?: string;
}

interface Section {
  icon: typeof DollarSign;
  title: string;
  content: ContentItem[];
}

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections: Section[] = [
    {
      icon: FileCheck,
      title: "1. Document Title & Introduction",
      content: [
        {
          text: "This is the official Refund Policy of Reverence Technology.",
          additional: "We specialize in custom website design and development, mobile application development (iOS, Android, cross-platform), custom software solutions, UI/UX design, consulting, and related digital services. All our work is bespoke, tailored to each client's specific requirements, and involves significant time, expertise, planning, design, coding, testing, and resource commitment from the outset.",
          note: "Because of the highly customized and non-reusable nature of our Services, refunds are limited and issued only in exceptional circumstances as described below."
        }
      ]
    },
    {
      icon: FileCheck,
      title: "2. Scope – What This Policy Covers",
      content: [
        {
          text: "This Refund Policy applies to all paid services provided by Reverence Technology under a Project Agreement, proposal, quote, statement of work, invoice, or any other form of engagement.",
          subtitle: "It covers:",
          points: [
            "Custom website development",
            "Mobile app development and deployment",
            "Custom software development",
            "UI/UX design, prototyping, and wireframing",
            "Related consulting, training, or maintenance packages (where explicitly included in the Project Agreement)"
          ]
        },
        {
          subtitle: "This policy does not apply to:",
          points: [
            "Third-party costs (hosting, domains, premium plugins, stock assets, API subscriptions, app store fees)",
            "Ongoing recurring services (unless separately agreed)",
            "Free consultations, estimates, or preliminary advice"
          ]
        }
      ]
    },
    {
      icon: AlertTriangle,
      title: "3. General Principle: Custom Work is Generally Non-Refundable",
      content: [
        {
          text: "Due to the custom, project-based, and labor-intensive nature of our Services:",
          points: [
            "Deposits and payments for completed or approved milestones are non-refundable.",
            "Once work begins, we allocate developer time, conduct research, create designs, write code, perform testing, and commit resources that cannot be repurposed for other clients.",
            "Refunds are rare and only considered in cases of our material non-performance or fundamental breach after reasonable opportunity to remedy."
          ],
          note: "We strongly encourage clients to review proposals, ask questions, and provide clear requirements before signing or paying any deposit to ensure alignment and avoid dissatisfaction."
        }
      ]
    },
    {
      icon: DollarSign,
      title: "4. Deposits",
      content: [
        {
          text: "The initial deposit (typically 30–50% of the total project fee, as specified in your Project Agreement, quote, or invoice) is non-refundable in almost all circumstances.",
          subtitle: "Reasons deposits are non-refundable:",
          points: [
            "They secure your project slot in our development schedule",
            "They cover initial project setup, scoping meetings, requirements analysis, research, wireframing preparation, environment setup, and early creative/technical work",
            "They compensate for opportunity cost (time reserved that could have been allocated to other paying projects)"
          ]
        },
        {
          subtitle: "Very limited exceptions where a deposit may be refunded (in full or in part):",
          points: [
            "We are unable or unwilling to commence work due to our own fault (e.g., we cancel the project without valid cause shortly after receiving the deposit)",
            "Material misrepresentation or fraud on our part that prevents us from delivering the Services as agreed",
            "Situations where refund is required by Ugandan law or a competent court"
          ],
          additional: "In all other cases — including change of mind, revised business priorities, inability to provide timely feedback/content, or project delays caused by the client — the deposit remains non-refundable."
        }
      ]
    },
    {
      icon: CheckCircle,
      title: "5. Milestone & Progress Payments",
      content: [
        {
          text: "Payments tied to project milestones (as defined in your Project Agreement, quote, or invoice) are non-refundable once the milestone is completed and approved (or deemed accepted per our Terms and Conditions).",
          subtitle: "What this means in practice:",
          points: [
            "Milestone examples include: approval of wireframes/UI designs, completion and approval of beta version or functional prototype, successful integration of key features, completion of User Acceptance Testing (UAT), or delivery of staging environment.",
            "When you provide written approval (or fail to provide written rejection with specific defects within the agreed Review Period — typically 5–7 business days), the milestone is considered accepted.",
            "The associated milestone payment then becomes final and non-refundable, as it reflects delivered and accepted value: completed design work, coded functionality, testing, revisions incorporated, etc."
          ]
        },
        {
          subtitle: "No refunds will be issued for:",
          points: [
            "Approved milestones where the client later changes their mind, revises requirements, or decides the work no longer aligns with evolving needs.",
            "Subjective dissatisfaction (e.g., \"I don't like the design style anymore\") after approval — approval is final.",
            "Work that meets the agreed specifications but is affected by external factors (e.g., market changes, business pivots)."
          ],
          additional: "If verifiable defects are reported during the Review Period or the post-acceptance warranty phase (typically 30 days), we will correct them at no extra cost as the primary remedy — not through refund."
        }
      ]
    },
    {
      icon: FileCheck,
      title: "6. Final Payment & Handover",
      content: [
        {
          text: "The final payment (typically the remaining 10–20% balance) is due before we complete project handover. This includes:",
          points: [
            "Delivery of final source code/files",
            "Transfer of admin credentials, hosting access, domain control (if managed by us)",
            "Deployment to live/production environment",
            "Final training/documentation/handover session (if included)",
            "Closure of the project"
          ]
        },
        {
          subtitle: "Key rules:",
          points: [
            "Final payment is non-refundable once paid and the project is handed over/accepted.",
            "We will not release full deliverables or access until the final invoice is settled in full.",
            "After handover and acceptance, no refunds are available for the final payment or any prior payments — the project is considered complete.",
            "If final payment is delayed, we may suspend access or withhold deliverables until cleared (with reasonable notice)."
          ],
          additional: "This ensures mutual commitment at the close of the project."
        }
      ]
    },
    {
      icon: XCircle,
      title: "7. Cancellation by Client Before Completion",
      content: [
        {
          text: "You may cancel the project at any time before final handover by providing written notice (email to reverencetech1@gmail.com is acceptable).",
          subtitle: "Upon cancellation, the following applies:",
          points: [
            "You remain fully liable for: All completed and approved milestones (non-refundable)",
            "All work in progress up to the date we receive your cancellation notice (billed pro-rata based on percentage complete or at our standard hourly rate if not milestone-based)",
            "Reasonable termination costs, including: Committed third-party expenses (e.g., premium tools/licenses procured for your project), Cancellation fees from subcontractors (if any), Administrative and demobilization time"
          ]
        },
        {
          text: "Any prepaid amounts (beyond the above liabilities) may be refunded at our discretion, after deducting all due amounts. In most cases involving significant progress, little or no refund will be available.",
          additional: "If cancellation occurs very early (before any milestones are approved and minimal work has started), we may refund a portion of payments beyond the deposit — but the deposit remains non-refundable.",
          note: "Cancellation does not relieve you of obligations for work already performed or committed resources."
        }
      ]
    },
    {
      icon: CheckCircle,
      title: "8. Refund Triggers (When a Refund Might Be Issued)",
      content: [
        {
          text: "Refunds are exceptional and only considered in very limited situations where Reverence Technology has materially failed to perform its obligations. Possible refund triggers include:",
          points: [
            "Material breach by Reverence Technology: We fail to deliver the core Services as materially agreed in the Project Agreement (after you have given reasonable written notice and an opportunity to remedy the issue, typically 14 business days).",
            "Fundamental non-performance: We are unable to complete the project due to our own fault (e.g., prolonged unavailability of key team members without valid reason, or persistent failure to meet agreed specifications).",
            "Company-initiated cancellation without cause: If we terminate the project for convenience or without your material breach (rare), we will refund any prepaid amounts attributable to undelivered work.",
            "Court or statutory order: A competent Ugandan court or regulatory authority requires a refund under applicable consumer protection or contract law."
          ],
          note: "Even in these cases, refunds are discretionary unless legally mandated. We will first attempt to remedy the issue through corrections, additional work, credits for future services, or other fair solutions before considering a monetary refund."
        }
      ]
    },
    {
      icon: XCircle,
      title: "9. No Refunds For",
      content: [
        {
          text: "To set clear expectations, the following situations do not qualify for a refund:",
          points: [
            "Change of mind, revised business priorities, or new strategic direction after any milestone has been approved",
            "Subjective dissatisfaction with aesthetics, design choices, functionality, or user experience once a deliverable has been reviewed and accepted",
            "Delays or issues caused by your late or incomplete provision of content, feedback, approvals, access credentials, third-party APIs, or other required inputs",
            "Introduction of new requirements, features, or scope changes mid-project that were not part of the original Project Agreement",
            "Third-party factors outside our control (e.g., hosting provider downtime, domain registration issues, payment gateway failures, app store rejections)",
            "Completed and approved work that no longer suits your needs due to market changes, internal reorganization, or other client-side developments",
            "Minor bugs, cosmetic issues, or performance optimizations that can be addressed during the warranty period",
            "Normal project iterations or reasonable revisions already provided within the agreed scope",
            "Any portion of the project where payment has been made for delivered and accepted value"
          ],
          additional: "In these situations, our primary remedy remains fixing verifiable defects during the warranty phase or discussing scope adjustments via a Change Order — not refunds."
        }
      ]
    },
    {
      icon: Shield,
      title: "10. Warranty / Bug-Fix Period",
      content: [
        {
          text: "As detailed in our Terms and Conditions (Section 6 – Warranties and Acceptance):",
          points: [
            "We provide a limited post-acceptance warranty period (typically 30 days from final project acceptance, or longer if specified in your Project Agreement).",
            "During this period, we will investigate and correct — at no additional charge — any verifiable bugs or defects that cause the Deliverables to materially deviate from the agreed specifications.",
            "This warranty covers only pre-existing defects, not: New features or enhancements, Client-requested changes, Issues arising from unauthorized modifications, or Normal maintenance post-handover."
          ],
          note: "The bug-fix process is the primary and exclusive remedy for issues discovered during the warranty period. Refunds are not available for problems that can be resolved through corrections under this warranty."
        }
      ]
    },
    {
      icon: Clock,
      title: "11. Refund Process (How to Request & Timeline)",
      content: [
        {
          text: "If you believe a situation qualifies for a refund under this policy (e.g., material non-performance on our part), follow this process:",
          subtitle: "1. Submit a written request",
          points: [
            "Send an email to reverencetech1@gmail.com with the subject line: \"Refund Request – [Project Name/Reference Number]\"",
            "Include: Your full name and company/organization, Project name/invoice number, Detailed explanation of the reason, Relevant evidence, The specific amount requested"
          ]
        },
        {
          subtitle: "2. Our review",
          text: "We will acknowledge receipt within 2–3 business days and conduct a full review (typically completed within 7–14 business days). This may include reviewing project files, communications, approvals, and milestones."
        },
        {
          subtitle: "3. Decision and communication",
          text: "We will notify you in writing (email) of the outcome, including whether a refund is approved (in full, partial, or denied) and the reasoning."
        },
        {
          subtitle: "4. Refund issuance",
          text: "Approved refunds will be processed within 10–30 business days after final agreement to the original payment method where possible. Any transaction fees, taxes, or third-party charges are not refunded.",
          note: "Refunds are processed manually and may take longer during peak periods or public holidays. We do not offer instant refunds."
        }
      ]
    },
    {
      icon: Shield,
      title: "12. Statutory Rights Disclaimer",
      content: [
        {
          text: "Nothing in this Refund Policy limits or excludes any rights you may have under Ugandan law that cannot be lawfully excluded or restricted. This includes (but is not limited to):",
          points: [
            "Rights under the Sale of Goods and Supply of Services Act, 2018 (reasonable care and skill in service provision)",
            "Rights under the Electronic Transactions Act, 2011 (for electronic contracts and remedies in distance/digital services)",
            "Any applicable consumer protection provisions that deem certain terms unfair or unenforceable"
          ],
          additional: "If any provision of this policy is found to be unenforceable under Ugandan law, the remaining provisions remain in full effect, and we will apply the most client-favorable interpretation permitted by law."
        }
      ]
    },
    {
      icon: FileCheck,
      title: "13. Relationship to Terms & Conditions",
      content: [
        {
          text: "This Refund Policy is an integral part of our Terms and Conditions and is incorporated by reference into every Project Agreement, quote, or engagement with Reverence Technology.",
          additional: "In the event of any inconsistency between this Refund Policy and the Terms and Conditions, the provisions of the Terms and Conditions shall prevail unless this policy explicitly states otherwise.",
          note: "By engaging our services, making any payment, or accepting a deliverable, you acknowledge that you have read, understood, and agree to this Refund Policy."
        }
      ]
    },
    {
      icon: Ban,
      title: "CANCELLATION POLICY",
      content: [
        {
          text: "The following sections explain how clients may cancel ongoing projects or services, the required notice, financial consequences, and our rights to cancel or suspend work.",
          note: "This Cancellation Policy forms part of and is subject to our full Terms and Conditions and Refund Policy (above). In case of any conflict, the Terms and Conditions prevail unless explicitly stated otherwise."
        }
      ]
    },
    {
      icon: FileX,
      title: "14. Scope – What Cancellation Policy Covers",
      content: [
        {
          subtitle: "This Cancellation Policy applies to:",
          points: [
            "All active, ongoing projects under a Project Agreement, signed proposal, quote, statement of work, or invoice",
            "Custom website development projects",
            "Mobile app development and deployment projects",
            "Custom software development projects",
            "UI/UX design, prototyping, or wireframing phases",
            "Any related consulting, training, or maintenance/retainer services explicitly included in the Project Agreement"
          ]
        },
        {
          subtitle: "This policy does not apply to:",
          points: [
            "Projects that have been fully completed, handed over, and accepted (final payment made)",
            "One-off consultations, estimates, or free preliminary advice",
            "Third-party services (hosting, domains, premium plugins, stock assets, app store fees, etc.)",
            "Situations where work has not yet started (pre-deposit) — in such cases, no cancellation is needed as no commitment exists"
          ]
        }
      ]
    },
    {
      icon: FileX,
      title: "15. Client-Initiated Cancellation – General Right",
      content: [
        {
          text: "You (the Client) have the right to cancel an ongoing project or engagement at any time before final handover and acceptance, subject to the financial and other consequences outlined in this policy and the Terms and Conditions.",
          subtitle: "How to cancel:",
          points: [
            "Cancellation must be communicated in writing (email to reverencetech1@gmail.com is the preferred and recommended method).",
            "Include in your notice: Your full name and company/organization (if applicable), Project name, quote number, invoice number, or other clear reference, The intended effective date of cancellation (if not immediate, it takes effect upon our receipt of notice), Optional: a brief reason for cancellation (helps us improve, but is not required)"
          ],
          note: "Verbal cancellations (phone, WhatsApp voice note, in-person) are not valid — written confirmation is required for clarity and record-keeping. Cancellation takes effect on the date we receive your valid written notice, unless a later date is specified."
        }
      ]
    },
    {
      icon: Clock,
      title: "16. Notice Period & Timing Rules",
      content: [
        {
          text: "Cancellation takes effect on the date we receive your valid written notice (via email to reverencetech1@gmail.com), unless you specify a later effective date in the notice.",
          subtitle: "Key timing rules:",
          points: [
            "There is no mandatory 'cooling-off' or fixed notice period required for most custom development projects, as these are bespoke, non-standard services.",
            "Cancellation is effective immediately upon receipt of notice, unless you request a delayed date (e.g., to allow completion of a current milestone).",
            "For any ongoing retainer, maintenance, or subscription-based services: Standard notice period is 30 calendar days before the next billing cycle or renewal date. Shorter notice may be accepted at our discretion, but you remain liable for the full notice period fees.",
            "The earlier you cancel in the project lifecycle (e.g., after deposit but before major milestones), the lower your financial obligation typically is.",
            "The later you cancel (e.g., after multiple milestones approved), the greater the amount due for work already performed and committed resources."
          ],
          additional: "We will confirm receipt of your cancellation notice within 2–3 business days and provide a summary of the financial implications based on project status at the time of notice."
        }
      ]
    },
    {
      icon: DollarSign,
      title: "17. Financial Consequences of Cancellation",
      content: [
        {
          text: "Upon client-initiated cancellation, you remain financially responsible for all value delivered and commitments made up to the effective date of cancellation. Specifically:",
          subtitle: "Full payment for:",
          points: [
            "All completed and approved milestones (non-refundable, as per our Refund Policy)",
            "Any work in progress at the date of cancellation (calculated pro-rata based on percentage complete, or at our standard hourly rate if milestone-based billing does not apply)"
          ]
        },
        {
          subtitle: "Reasonable termination costs, including but not limited to:",
          points: [
            "Third-party expenses already incurred or committed on your behalf (e.g., premium plugins, stock assets, API keys, subcontractor fees)",
            "Administrative, planning, and demobilization time",
            "Any cancellation penalties from external providers engaged for your project"
          ]
        },
        {
          text: "The initial deposit remains non-refundable in all cases (except where we materially fail to perform, as per the Refund Policy).",
          additional: "Prepaid amounts beyond the above liabilities may be refunded at our sole discretion after final accounting (typically only if very little work has started beyond the deposit). In most cases involving meaningful progress, no refund or only a partial refund will be issued.",
          note: "Outstanding invoices must be settled in full before any partial refund (if applicable) is processed or before we release any remaining deliverables. We will issue a final statement/invoice within 7–10 business days after cancellation, detailing all amounts due or any potential credit."
        }
      ]
    },
    {
      icon: FileCheck,
      title: "18. Deliverables Upon Cancellation",
      content: [
        {
          text: "If you cancel before final handover and full acceptance:",
          points: [
            "You will receive partially completed Deliverables in their current state (e.g., wireframes, designs, source code snapshots, documentation drafts, prototypes, or staging builds).",
            "Delivery is conditional on full payment of all outstanding amounts (completed milestones, work in progress, termination costs).",
            "We will provide files via secure transfer (e.g., Google Drive, Git repository access, email zip) once payment clears.",
            "Any intellectual property rights, licenses, or assignments (as outlined in Section 5 of the Terms and Conditions) remain conditional on full settlement of amounts due. Until paid, we retain rights to withhold access, source code, or admin credentials.",
            "You may use the received partial work for your own purposes, but we make no warranties about its completeness, functionality, or fitness beyond what was approved up to cancellation.",
            "We are not obligated to complete unfinished portions, provide further revisions, or support integration unless a new agreement is signed."
          ],
          note: "This ensures fairness: you get what has been paid for, while we are compensated for work performed and commitments made."
        }
      ]
    },
    {
      icon: XCircle,
      title: "19. Cancellation by Reverence Technology",
      content: [
        {
          text: "While we are committed to completing every project we accept, Reverence Technology reserves the right to cancel or suspend an engagement in the following circumstances:",
          subtitle: "Material breach by the Client - Examples include:",
          points: [
            "Failure to make payments when due (after reminder and a reasonable grace period)",
            "Prolonged failure to provide required materials, feedback, approvals, or access (e.g., more than 30 calendar days despite repeated requests)",
            "Breach of confidentiality, intellectual property obligations, or other material terms in the Terms and Conditions"
          ]
        },
        {
          subtitle: "Other cancellation grounds:",
          points: [
            "Force majeure or impossibility: Events beyond our reasonable control (e.g., prolonged power/internet outages, government restrictions, natural disasters, or key team member unavailability due to serious illness) that make continued performance impossible or unreasonably burdensome",
            "Mutual agreement: Both parties agree in writing to end the project early",
            "Other valid business reasons (rare): For example, discovery of irreconcilable conflicts of interest or ethical/legal issues that prevent continuation"
          ]
        },
        {
          subtitle: "Consequences when we cancel or suspend:",
          points: [
            "You remain liable for all work completed and approved up to the date of cancellation/suspension",
            "We will issue a final invoice for outstanding amounts (including work in progress and termination costs)",
            "Deliverables will be provided in their current state only after full payment of all due amounts",
            "We may retain possession of source code, admin credentials, or other project assets until full settlement",
            "If cancellation is due to your material breach, no refund of prepaid amounts will be issued beyond what is required by law",
            "If we cancel without your material breach (extremely rare, e.g., force majeure), we will refund any prepaid amounts attributable to undelivered work, after deducting costs incurred"
          ],
          note: "Suspension (e.g., for non-payment) does not count as cancellation — work may resume once the issue is resolved, with timelines extended accordingly."
        }
      ]
    },
    {
      icon: PhoneOff,
      title: "20. Project Dormancy / Inactivity Clause",
      content: [
        {
          text: "If a project becomes inactive due to lack of meaningful communication, feedback, content provision, approvals, or payments from the Client:",
          points: [
            "After 60 consecutive calendar days of no substantive progress or response despite our reasonable attempts to contact you (via email, phone/WhatsApp, or project tools),",
            "We may treat the project as client-initiated cancellation for convenience."
          ]
        },
        {
          subtitle: "Before applying this clause, we will:",
          points: [
            "Send at least two written reminders (email) with a 14-day response window each",
            "Clearly warn that continued inactivity may result in project closure and application of cancellation consequences"
          ]
        },
        {
          subtitle: "Upon dormancy classification:",
          points: [
            "The financial and deliverable rules from Sections 17 and 18 apply (payment for work done, partial deliverables upon settlement)",
            "The project will be formally closed in our records",
            "Any future restart would require a new Project Agreement, potentially at updated rates and with new timelines"
          ],
          note: "This clause protects both parties from indefinite 'on-hold' projects that tie up resources without progress."
        }
      ]
    },
    {
      icon: AlertCircleIcon,
      title: "21. No-Cancellation Scenarios",
      content: [
        {
          text: "The following situations do not allow for cancellation under this policy:",
          points: [
            "Completed and handed-over projects: Once final payment is made, all Deliverables are transferred/accepted, and the project is closed (as confirmed in writing or by handover documentation), the engagement is complete — no cancellation is possible or applicable",
            "Approved milestones retroactively: Once a milestone is approved (or deemed accepted per the Terms and Conditions), you cannot 'cancel' or reverse payment/refund for that milestone",
            "Post-warranty support requests: Requests for fixes, updates, or enhancements after the warranty period (typically 30 days post-acceptance) are handled under a separate maintenance agreement — not as cancellation",
            "Projects in final handover stage: Once final payment is due and deliverables are ready for release, cancellation does not relieve the obligation to complete payment for handover"
          ],
          note: "In these cases, the project is considered finished, and any further work falls under new terms or a support contract."
        }
      ]
    },
    {
      icon: FileCheck,
      title: "22. Cancellation Process Summary",
      content: [
        {
          subtitle: "To ensure clear records and prompt handling:",
          text: "1. Send written notice: Email your cancellation request to reverencetech1@gmail.com with subject line 'Cancellation Request – [Project Name/Reference]'"
        },
        {
          text: "2. Our acknowledgment: We will reply within 2–3 business days confirming receipt and providing summary of financial implications"
        },
        {
          text: "3. Final accounting: Within 7–10 business days, we prepare and send a final statement/invoice detailing completed milestones, work in progress, and any termination costs"
        },
        {
          text: "4. Settlement: You settle any outstanding balance"
        },
        {
          text: "5. Deliverable handover: Once full payment is received, we release partially completed deliverables via secure file transfer",
          note: "We aim to handle cancellations professionally and efficiently. Prompt communication helps us finalize matters quickly and fairly."
        }
      ]
    }
  ];

  return (
    <div className="bg-paper pb-16">
      <PageHeader
        eyebrow="Legal"
        title="Refund & Cancellation Policy"
        description="Comprehensive guide to refunds and cancellations for custom software development services. Last updated February 4, 2026."
      />

      <Container className="py-12">
        <div className="mx-auto max-w-4xl">
        <Card className="mb-8 p-5 sm:p-8">
          <div className="prose prose-editorial">
            <p>
              This Refund Policy explains when and how refunds may be issued for our services. It forms part of and is subject to our full{' '}
              <a href="/terms">Terms and Conditions</a>.
              In case of any conflict, the Terms and Conditions prevail unless explicitly stated otherwise.
            </p>
            <p>
              Nothing in this policy affects your non-excludable statutory rights under Ugandan law, including the Sale of Goods and Supply of Services Act 2018,
              the Electronic Transactions Act 2011, or any applicable consumer protection legislation.
            </p>
          </div>
        </Card>

        {sections.map((section, idx) => {
          const IconComponent = section.icon;
          return (
            <Card
              key={idx}
              className="mb-8 p-5 sm:p-8"
            >
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
                      <p>{item.text}</p>
                    )}
                    {item.points && (
                      <ul>
                        {item.points.map((point, pointIdx) => (
                          <li key={pointIdx}>{point}</li>
                        ))}
                      </ul>
                    )}
                    {item.additional && (
                      <p>{item.additional}</p>
                    )}
                    {item.note && (
                      <blockquote>
                        <strong>Note:</strong> {item.note}
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        <div className="border border-rule bg-ink-deep p-5 text-paper sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Mail className="h-8 w-8 text-gold" />
            <h2 className="font-serif text-2xl font-medium">Contact Information</h2>
          </div>
          <p className="mb-6 text-paper/70">
            For any questions about this Refund and Cancellation Policy, to submit a refund request, cancellation notice, or to discuss concerns:
          </p>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-paper/15 p-4">
              <p className="mb-1 text-sm text-paper/60">Email</p>
              <p className="font-medium">reverencetech1@gmail.com</p>
            </div>
            <div className="rounded-md border border-paper/15 p-4">
              <p className="mb-1 text-sm text-paper/60">Phone / WhatsApp</p>
              <p className="font-medium">+256 783 676 313</p>
            </div>
            <div className="rounded-md border border-paper/15 p-4">
              <p className="mb-1 text-sm text-paper/60">Location</p>
              <p className="font-medium">Mutungo Zone 1, Kampala</p>
            </div>
            <div className="rounded-md border border-paper/15 p-4">
              <p className="mb-1 text-sm text-paper/60">Business Hours</p>
              <p className="font-medium">Mon-Fri, 9AM - 6PM EAT</p>
            </div>
          </div>
          <a
            href="/terms"
            className={buttonClassName()}
          >
            View Terms &amp; Conditions
          </a>
        </div>
        </div>
      </Container>
    </div>
  );
};

export default RefundPolicy;
