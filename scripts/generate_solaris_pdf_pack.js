const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..", "workspace", "Solaris_DD_Demo_DataRoom");
const outRoot = path.join(root, "10_PDF_Ingestion_Pack");
const htmlRoot = path.join(outRoot, "_html_sources");

const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

const browser = edgeCandidates.find((candidate) => fs.existsSync(candidate));
if (!browser) {
  throw new Error("No Chromium browser found for PDF generation.");
}

const docs = [
  {
    folder: "A_Market_Regulatory",
    file: "market_context_us_healthcare_2024.pdf",
    title: "U.S. Healthcare Market Context for Medtech Diligence",
    subtitle: "Public-source market packet for Solaris Endovascular demo ingestion",
    status: "Public-source summary with synthetic diligence implications",
    sections: [
      ["Purpose", [
        "This packet gives investors market context for a U.S. life-sciences and medical technology diligence process. It is intended to support source-grounded answers about market size, spending pressure, and reimbursement scrutiny.",
        "Solaris Endovascular company-specific statements remain synthetic. CMS figures in this packet are public context only."
      ]],
      ["Key Public Data Points", [
        "CMS reported that U.S. national health expenditures grew 7.2% in 2024 and reached $5.3 trillion.",
        "CMS reported 2024 spending of $15,474 per person.",
        "CMS reported that health spending accounted for 18.0% of U.S. gross domestic product in 2024.",
        "CMS projected average national health expenditure growth of 5.8% over 2024-2033, outpacing projected average GDP growth of 4.3%."
      ]],
      ["Diligence Implications", [
        "Large health spending supports a significant addressable system for innovative devices, but it also increases payer and provider scrutiny.",
        "Investors should ask whether Solaris can demonstrate procedural value, training efficiency, reimbursement fit, and hospital budget alignment.",
        "The diligence agent should cite this packet only for public market context, not for Solaris-specific revenue claims."
      ]],
      ["Sources", [
        "CMS NHE Fact Sheet: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
        "CMS National Health Expenditure Historical Data: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical"
      ]]
    ]
  },
  {
    folder: "A_Market_Regulatory",
    file: "fda_510k_regulatory_pathway_packet.pdf",
    title: "FDA 510(k) Regulatory Pathway Packet",
    subtitle: "Regulatory source summary for a neurovascular delivery-device diligence review",
    status: "Public FDA context plus synthetic Solaris application notes",
    sections: [
      ["Public FDA Context", [
        "FDA describes 510(k) as a premarket submission used to demonstrate that a device is substantially equivalent to a legally marketed device.",
        "FDA states that device manufacturers required to register must notify FDA of their intent to market a medical device at least 90 days in advance through the 510(k) process when applicable.",
        "FDA's public device clearance resources and CDRH reporting are useful sources for diligence questions about authorization pathways, predicate strategy, and review expectations."
      ]],
      ["Solaris Application Notes", [
        "Solaris management expects a 510(k) strategy for Solaris Arc v2.3 if intended-use wording and technological characteristics can be aligned with legally marketed predicate devices.",
        "The main diligence uncertainty is whether FDA will request additional clinical evidence or narrower labeling before accepting substantial equivalence.",
        "Investors should ask for a predicate matrix, verification and validation plan, biocompatibility test plan, sterilization strategy, and labeling-risk assessment."
      ]],
      ["Evidence Checklist for Ingestion Demo", [
        "Predicate comparison table",
        "Design verification protocol",
        "Simulated-use results",
        "Biocompatibility plan",
        "Sterilization validation summary",
        "Labeling and instructions-for-use draft"
      ]],
      ["Sources", [
        "FDA 510(k) Clearances: https://www.fda.gov/510k-clearances",
        "FDA Device Approvals and Clearances: https://www.fda.gov/medical-devices/products-and-medical-procedures/device-approvals-and-clearances",
        "FDA CDRH 2024 Annual Report: https://www.fda.gov/about-fda/cdrh-reports/cdrh-2024-annual-report"
      ]]
    ]
  },
  {
    folder: "A_Market_Regulatory",
    file: "part_11_electronic_records_assessment.pdf",
    title: "21 CFR Part 11 Electronic Records Assessment",
    subtitle: "Quality-system evidence packet for investor and regulatory diligence",
    status: "Synthetic company controls with public FDA context",
    sections: [
      ["Scope", [
        "This assessment covers electronic quality management workflows for design controls, document approvals, CAPA, supplier qualification, training records, and release evidence.",
        "The document supports questions about whether the diligence data bank contains evidence of electronic record integrity and electronic signature controls."
      ]],
      ["Public FDA Context", [
        "FDA guidance describes the agency's current thinking regarding the scope and application of Part 11 for electronic records and electronic signatures.",
        "FDA guidance discusses validation, audit trails, record retention, record copying, and legacy systems in the context of enforcement discretion."
      ]],
      ["Solaris Control Status", [
        "Unique user accounts are active for eQMS users.",
        "Role-based approval workflows are active for document creation, release, and revision.",
        "Audit trails are retained for approval events and controlled-document revisions.",
        "Quarterly access reviews are planned, with the first review targeted for 2026-09-30.",
        "The eQMS validation binder remains open and is targeted for completion before pivotal-study enrollment."
      ]],
      ["Open Items", [
        "Complete validation test scripts for design-history workflow.",
        "Formalize audit-trail review procedure.",
        "Document disaster recovery evidence for regulated records.",
        "Add second-person approval for design history file release."
      ]],
      ["Sources", [
        "FDA Part 11 Guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application"
      ]]
    ]
  },
  {
    folder: "B_Financial",
    file: "series_b_investor_memo_finance_pack.pdf",
    title: "Series B Investor Memo - Finance Pack",
    subtitle: "Solaris Endovascular synthetic investor finance memorandum",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Financing Ask", [
        "Solaris is seeking $18.0 million in Series B preferred equity.",
        "Primary use of proceeds: pivotal clinical study execution, regulatory submission preparation, manufacturing validation, security and quality-system maturity, and limited commercial expansion."
      ]],
      ["Historical Financials", [
        "2025 revenue: $3.84 million.",
        "2025 gross profit: $2.37 million.",
        "2025 gross margin: 61.8%.",
        "2025 net loss: $6.94 million.",
        "Cash at 2026-03-31: $5.62 million.",
        "Average monthly net burn in Q1 2026: $416,000.",
        "Estimated runway before Series B: 13.5 months."
      ]],
      ["Forecast Summary", [
        "2026 forecast revenue: $7.95 million.",
        "2027 forecast revenue: $18.4 million.",
        "2028 forecast revenue: $42.1 million.",
        "The forecast assumes U.S. clearance in Q4 2027 and a full U.S. launch in 2028."
      ]],
      ["Investor Diligence Questions", [
        "How much 2026 revenue is contracted versus pipeline weighted?",
        "What happens to runway if FDA requests additional evidence?",
        "How much of 2028 revenue depends on U.S. clearance timing?",
        "Which customer and distributor accounts drive revenue concentration?"
      ]]
    ]
  },
  {
    folder: "B_Financial",
    file: "quality_of_revenue_review.pdf",
    title: "Quality of Revenue Review",
    subtitle: "Revenue concentration and contract durability packet",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Executive View", [
        "Solaris recognized $3.84 million of 2025 revenue from OUS evaluation units, physician training kits, engineering services, and minimum distributor commitments.",
        "No U.S. commercial product revenue was recognized because Solaris Arc has not received U.S. marketing authorization."
      ]],
      ["Concentration", [
        "Top three accounts represented 58% of 2025 recognized revenue.",
        "Hanse Neurovascular GmbH represented 24%.",
        "St. Brigid Research Hospital represented 19%.",
        "MedBridge Education represented 15%."
      ]],
      ["Contract Durability", [
        "Hanse Neurovascular has a 2026 minimum purchase commitment of $1.45 million.",
        "St. Brigid Research Hospital has a $620,000 evaluation and training purchase order.",
        "MedBridge Education has a $240,000 physician training kit commitment.",
        "Some commitments can be delayed or terminated for unshipped units, creating timing risk."
      ]],
      ["Diligence Conclusion", [
        "Revenue quality is acceptable for a pre-clearance medtech company but should not be valued like recurring commercial revenue.",
        "Investors should underwrite revenue using scenario analysis tied to regulatory timing, distributor renewals, and clinical-site activation."
      ]]
    ]
  },
  {
    folder: "B_Financial",
    file: "cash_runway_sensitivity_analysis.pdf",
    title: "Cash Runway Sensitivity Analysis",
    subtitle: "Burn-rate and financing-risk review",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Base Case", [
        "Cash at 2026-03-31: $5.62 million.",
        "Average Q1 2026 net burn: $416,000 per month.",
        "Base-case runway: 13.5 months.",
        "Series B close target: Q3 2026."
      ]],
      ["Downside Case", [
        "If monthly burn rises to $575,000 due to accelerated pivotal-study preparation, runway falls to approximately 9.8 months.",
        "If revenue collections are delayed by 90 days, the company may need a bridge or delayed hiring plan before Series B close."
      ]],
      ["Upside Case", [
        "If distributor collections arrive on schedule and clinical hiring is paced to site activation, runway can extend beyond 14 months.",
        "Operating leverage improves meaningfully only after direct commercial revenue begins."
      ]],
      ["Investor Questions", [
        "Which expenses are deferrable without compromising the pivotal study?",
        "What bridge terms are available if Series B timing slips?",
        "What cash covenant or minimum cash threshold has the board approved?"
      ]]
    ]
  },
  {
    folder: "C_Clinical",
    file: "ous_registry_clinical_study_report.pdf",
    title: "OUS Registry Clinical Study Report",
    subtitle: "Synthetic observational evidence packet for Solaris Arc v2.3",
    status: "Synthetic clinical data for demo ingestion",
    sections: [
      ["Registry Overview", [
        "Study type: OUS observational registry.",
        "Sites: 5.",
        "Cases enrolled: 62.",
        "Clinical events committee: independent physician adjudication panel."
      ]],
      ["Performance Summary", [
        "Technical success rate: 94.1%.",
        "Mean device navigation time: 11.8 minutes.",
        "Device-related serious adverse events: 0 adjudicated.",
        "All-cause serious adverse events within 30 days: 3, none adjudicated as device-related.",
        "Minor protocol deviations: 4."
      ]],
      ["Interpretation", [
        "The registry provides useful early evidence of feasibility and device performance.",
        "The registry is not randomized and is not powered to detect rare adverse events.",
        "The pivotal study must validate procedural success and safety in a controlled, prospective U.S. study."
      ]],
      ["Agent Citation Test", [
        "A good answer should cite this document for clinical success rate and adverse-event statements.",
        "A good answer should avoid claiming U.S. market clearance or clinical superiority."
      ]]
    ]
  },
  {
    folder: "C_Clinical",
    file: "pivotal_study_protocol_synopsis.pdf",
    title: "Pivotal Study Protocol Synopsis",
    subtitle: "Draft U.S. pivotal-study design for Solaris Arc v2.3",
    status: "Synthetic clinical protocol summary",
    sections: [
      ["Study Design", [
        "Prospective, multicenter, single-arm pivotal study.",
        "Planned enrollment: 140 subjects.",
        "Planned U.S. clinical sites: 12.",
        "Target first subject in: Q4 2026, dependent on site activation and regulatory alignment."
      ]],
      ["Primary Endpoint", [
        "Technical success without device-related major adverse event through 30 days.",
        "Endpoint adjudication will be performed by an independent clinical events committee."
      ]],
      ["Secondary Endpoints", [
        "Navigation time.",
        "Successful agent delivery.",
        "Device deficiency rate.",
        "Physician usability score.",
        "Rate of minor and major protocol deviations."
      ]],
      ["Operational Risks", [
        "Site activation may be delayed by budget negotiations or IRB review timing.",
        "Training consistency must be monitored across operators.",
        "Clinical supply must be released only after manufacturing and quality controls are complete."
      ]]
    ]
  },
  {
    folder: "D_Commercial",
    file: "commercial_pipeline_board_packet.pdf",
    title: "Commercial Pipeline Board Packet",
    subtitle: "Revenue pipeline and customer risk packet",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Pipeline Snapshot", [
        "2026 forecast revenue: $7.95 million.",
        "Contracted or high-probability revenue includes Hanse Neurovascular, St. Brigid Research Hospital, and MedBridge Education.",
        "Pipeline upside includes distributor expansion in the Middle East, clinical-study site training, and a non-recurring engineering services proposal."
      ]],
      ["Top Pipeline Accounts", [
        "Hanse Neurovascular GmbH: $1.45 million expected 2026 revenue, contracted expansion.",
        "St. Brigid Research Hospital: $620,000 expected 2026 revenue, active evaluation.",
        "AsterMed Trading: $980,000 expected 2026 revenue at 55% probability, LOI stage.",
        "VectorCath OEM: $720,000 expected 2026 revenue at 70% probability, engineering services proposal."
      ]],
      ["Commercial Gating Events", [
        "No U.S. commercial product revenue before FDA marketing authorization.",
        "Distributor renewals depend on training demand and clinical evidence generation.",
        "Direct sales hiring should be staged to clearance and value-analysis committee readiness."
      ]]
    ]
  },
  {
    folder: "D_Commercial",
    file: "press_release_entity_disambiguation_packet.pdf",
    title: "Solaris Press Release and Entity Disambiguation Packet",
    subtitle: "Demo packet for testing name ambiguity and source attribution",
    status: "Synthetic company releases with real-world diligence framing",
    sections: [
      ["Why This Matters", [
        "Multiple real-world companies use the Solaris name across energy, mining, infrastructure, software, and media.",
        "A due diligence agent must not attribute third-party press releases to Solaris Endovascular unless legal identity, domain, issuer, and document source match."
      ]],
      ["Synthetic Solaris Endovascular Releases", [
        "2026-04-22: Solaris Endovascular announces design freeze for Solaris Arc v2.3.",
        "2026-02-05: Solaris Endovascular expands OUS clinical registry to five sites.",
        "2025-11-18: Solaris Endovascular opens San Diego pilot manufacturing line."
      ]],
      ["Attribution Rules", [
        "Use issuer legal name first.",
        "Check domain ownership and investor-relations site.",
        "Check headquarters, industry, and product references.",
        "Flag low-confidence external mentions when legal identity is not confirmed."
      ]],
      ["Demo Question", [
        "Ask: What press releases are available for Solaris, and are there naming risks?",
        "Expected answer: cite this packet and distinguish Solaris Endovascular from unrelated Solaris-branded entities."
      ]]
    ]
  },
  {
    folder: "E_Security_Compliance",
    file: "soc2_hipaa_readiness_packet.pdf",
    title: "SOC 2 and HIPAA Readiness Packet",
    subtitle: "Security and privacy diligence evidence for Solaris Endovascular",
    status: "Synthetic control evidence for demo ingestion",
    sections: [
      ["Program Scope", [
        "Solaris maintains cloud-hosted quality, clinical evidence, and investor diligence environments.",
        "The company uses role-based access controls, MFA, audit logging, endpoint management, encrypted backups, and vendor reviews."
      ]],
      ["SOC 2 Readiness", [
        "Target readiness review: Q4 2026.",
        "Controls in scope: access reviews, change management, vendor risk management, incident response, backups, logical access, and security monitoring.",
        "Open item: formalize evidence retention and management review cadence."
      ]],
      ["HIPAA Readiness", [
        "Solaris restricts identifiable clinical data and stores only minimum necessary clinical metadata in the diligence environment.",
        "Business associate agreements are required for vendors that handle protected health information.",
        "Open item: complete annual privacy training and finalize data retention schedules."
      ]],
      ["Investor Interpretation", [
        "The security program is credible for a scaling medtech company but not yet mature enough to claim completed SOC 2 attestation.",
        "The agent should answer SOC 2 questions with readiness status, not certification status."
      ]]
    ]
  },
  {
    folder: "E_Security_Compliance",
    file: "fedramp_alignment_gap_assessment.pdf",
    title: "FedRAMP Alignment Gap Assessment",
    subtitle: "Future-readiness assessment for academic medical center and public-sector buyers",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Assessment Summary", [
        "Solaris is not FedRAMP authorized.",
        "Management maps selected controls to FedRAMP Moderate as a future-readiness exercise.",
        "The current alignment effort is intended for buyer diligence and roadmap planning, not for federal authorization claims."
      ]],
      ["Aligned Areas", [
        "MFA for workforce cloud accounts.",
        "Role-based access controls for regulated records.",
        "Encrypted backups.",
        "Incident response tabletop planning.",
        "Vendor security reviews for critical vendors."
      ]],
      ["Gaps", [
        "No formal FedRAMP system security plan.",
        "No third-party assessment organization engagement.",
        "Incomplete continuous monitoring package.",
        "Incomplete configuration baseline evidence."
      ]],
      ["Investor Interpretation", [
        "FedRAMP alignment should be treated as roadmap evidence, not a compliance certification.",
        "Buyers requiring federal authorization would require a materially larger compliance investment."
      ]]
    ]
  },
  {
    folder: "F_Legal_IP",
    file: "patent_landscape_and_fto_summary.pdf",
    title: "Patent Landscape and FTO Summary",
    subtitle: "Synthetic IP diligence packet for Solaris Endovascular",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Patent Families", [
        "Family 1: variable-stiffness distal catheter architecture; U.S. non-provisional filed 2023-04-14; PCT filed 2024-04-12.",
        "Family 2: low-friction hydrophilic coating process; U.S. provisional filed 2024-09-03.",
        "Family 3: lot-specific procedural traceability workflow; U.S. provisional filed 2025-12-18."
      ]],
      ["Trade Secrets", [
        "Braided-shaft thermal set process.",
        "Distal marker placement process.",
        "Tortuous-path simulated-use fixture design.",
        "Supplier acceptance criteria for micro-braid lots."
      ]],
      ["FTO View", [
        "Outside counsel's initial landscape review did not identify a blocking patent.",
        "Counsel recommended a refreshed review before commercial launch because neurovascular delivery systems are an active patent area.",
        "Investors should request the counsel memo under NDA before signing final investment documents."
      ]]
    ]
  },
  {
    folder: "F_Legal_IP",
    file: "material_contracts_summary.pdf",
    title: "Material Contracts Summary",
    subtitle: "Synthetic legal packet for customer, supplier, and CRO diligence",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Customer Contracts", [
        "Hanse Neurovascular GmbH: OUS distributor agreement through 2026-12-31 with $1.45 million 2026 minimum commitment.",
        "St. Brigid Research Hospital: evaluation and training purchase order through 2026-06-30 with $620,000 minimum commitment.",
        "MedBridge Education: physician training kit supply agreement through 2026-09-30 with $240,000 commitment."
      ]],
      ["Supplier Contracts", [
        "Primary braided-shaft supplier: qualified supplier with annual price adjustment clause.",
        "Secondary braided-shaft supplier: qualification in progress; not yet released for pivotal inventory.",
        "Sterilization vendor: master services agreement under legal review."
      ]],
      ["CRO Contract", [
        "Draft pivotal-study CRO agreement under budget review.",
        "Key open items: pass-through cost cap, site-startup milestones, data ownership, and termination assistance."
      ]],
      ["Diligence Risks", [
        "Supplier concentration remains a key operating risk.",
        "Some customer commitments can be delayed or terminated for unshipped units.",
        "CRO contract timing can affect pivotal-study activation."
      ]]
    ]
  },
  {
    folder: "G_Founder_Dashboard",
    file: "investor_engagement_dashboard_export.pdf",
    title: "Investor Engagement Dashboard Export",
    subtitle: "Founder view of Q&A activity and warm leads",
    status: "Synthetic dashboard data for demo ingestion",
    sections: [
      ["Engagement Summary", [
        "Sophia Klein at MedVector Strategic asked 24 questions, opened 15 documents, clicked 47 citations, downloaded the DD summary, and has a warm-lead score of 96.",
        "Amara Singh at Northstar Growth Partners asked 18 questions, opened 12 documents, clicked 31 citations, downloaded the DD summary, and has a warm-lead score of 92.",
        "Elena Torres at Keiretsu Forum asked 13 questions, opened 9 documents, clicked 20 citations, downloaded the DD summary, and has a warm-lead score of 81."
      ]],
      ["Recommended Actions", [
        "Offer Sophia Klein a strategic partnership call.",
        "Offer Amara Singh a CEO meeting and regulatory deep dive.",
        "Offer Elena Torres a clinical advisory meeting.",
        "Ask Daniel Reed to complete NDA upgrade for gated access.",
        "Send Marcus Hill a DD summary reminder."
      ]],
      ["Demo Use", [
        "Use this packet to demonstrate founder dashboard analytics, investor intent scoring, and meeting prioritization.",
        "A strong agent answer should cite this document when asked which investors look ready for a meeting."
      ]]
    ]
  },
  {
    folder: "G_Founder_Dashboard",
    file: "approved_dd_report_version_history.pdf",
    title: "Approved DD Report Version History",
    subtitle: "Founder approval and republication audit packet",
    status: "Synthetic company data for demo ingestion",
    sections: [
      ["Version History", [
        "v0.8 draft generated: 2026-05-20 at 09:14.",
        "Founder comments added: 2026-05-21 at 15:32.",
        "Regulatory section revised: 2026-05-22 at 10:05.",
        "Financial pipeline refreshed: 2026-05-24 at 18:10.",
        "v1.0 founder approved and published: 2026-05-25 at 08:45.",
        "v1.1 revenue pipeline update published: 2026-05-27 at 12:20."
      ]],
      ["Approval Policy", [
        "No investor-visible DD report section is published without founder approval.",
        "Financial, clinical, and regulatory claims must cite an approved source document.",
        "Sensitive sections remain gated by investor access level."
      ]],
      ["Demo Use", [
        "Use this packet to show that the agent can explain freshness, republishing, and evidence approval history.",
        "A strong answer should distinguish draft content from founder-approved published content."
      ]]
    ]
  }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDoc(doc) {
  const body = doc.sections.map(([heading, bullets]) => `
    <section>
      <h2>${escapeHtml(heading)}</h2>
      ${bullets.length > 1 ? `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p>${escapeHtml(bullets[0])}</p>`}
    </section>
  `).join("\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(doc.title)}</title>
  <style>
    @page { size: Letter; margin: 0.65in; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #17202a;
      line-height: 1.45;
      font-size: 10.5pt;
    }
    header {
      border-bottom: 2px solid #1f6f8b;
      margin-bottom: 22px;
      padding-bottom: 14px;
    }
    h1 {
      color: #123746;
      font-size: 24pt;
      margin: 0 0 6px;
      letter-spacing: 0;
    }
    .subtitle {
      color: #4f5f68;
      font-size: 11.5pt;
      margin: 0 0 12px;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      background: #f3f7f8;
      border: 1px solid #d9e5e8;
      padding: 10px 12px;
      font-size: 9pt;
    }
    h2 {
      color: #1f6f8b;
      font-size: 14pt;
      margin: 18px 0 6px;
      page-break-after: avoid;
    }
    ul {
      margin: 6px 0 0 18px;
      padding: 0;
    }
    li {
      margin: 0 0 6px;
    }
    p {
      margin: 6px 0;
    }
    footer {
      margin-top: 28px;
      border-top: 1px solid #d9e5e8;
      padding-top: 8px;
      font-size: 8.5pt;
      color: #60727b;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="subtitle">${escapeHtml(doc.subtitle)}</p>
    <div class="meta">
      <div><strong>Company:</strong> Solaris Endovascular, Inc.</div>
      <div><strong>Prepared:</strong> 2026-05-27</div>
      <div><strong>Status:</strong> ${escapeHtml(doc.status)}</div>
      <div><strong>Demo Use:</strong> Data-room ingestion and citation testing</div>
    </div>
  </header>
  ${body}
  <footer>
    Demo data room packet. Company-specific Solaris information is synthetic unless explicitly identified as public-source context.
  </footer>
</body>
</html>`;
}

fs.mkdirSync(htmlRoot, { recursive: true });

for (const doc of docs) {
  const folder = path.join(outRoot, doc.folder);
  fs.mkdirSync(folder, { recursive: true });
  const htmlPath = path.join(htmlRoot, doc.file.replace(/\.pdf$/i, ".html"));
  const pdfPath = path.join(folder, doc.file);
  fs.writeFileSync(htmlPath, renderDoc(doc), "utf8");

  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    `file:///${htmlPath.replace(/\\/g, "/")}`,
  ], { stdio: "pipe" });
}

const manifest = [
  "folder,file,pdf_type,synthetic_or_public,demo_use",
  ...docs.map((doc) => [
    `10_PDF_Ingestion_Pack/${doc.folder}`,
    doc.file,
    doc.title,
    doc.status,
    "PDF ingestion and citation demo",
  ].map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")),
].join("\n");

fs.writeFileSync(path.join(outRoot, "pdf_manifest.csv"), manifest, "utf8");

console.log(`Generated ${docs.length} PDFs in ${outRoot}`);
