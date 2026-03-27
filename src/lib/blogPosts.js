import { BASE_URL } from './routes';

const BLOG_POSTS = [
  {
    slug: 'process-sensitive-documents-without-uploading',
    title: 'How to Process Sensitive Documents Without Uploading Them',
    metaTitle: 'How to Process Sensitive Documents Without Uploading Them — Acorn Tools',
    description: 'Learn why uploading sensitive files to online tools creates compliance risks, and how browser-based processing keeps your documents private and secure.',
    date: '2026-03-19',
    readTime: '6 min read',
    category: 'Privacy & Compliance',
    ctas: [
      { label: 'Redact PDF', path: '/redact-pdf', icon: '█' },
      { label: 'Strip Metadata', path: '/strip-metadata', icon: '⊘' },
      { label: 'Compress PDF', path: '/compress-pdf', icon: '▼' },
    ],
    sections: [
      {
        heading: 'The hidden risk in "free online tools"',
        paragraphs: [
          'Every day, millions of people upload contracts, medical records, financial statements, and legal documents to free online PDF and image tools. The workflow feels harmless: drag a file, wait for processing, download the result. But between steps two and three, something important happens — your file sits on someone else\'s server.',
          'Most online tools process files server-side. Your document travels across the internet, gets stored (even temporarily) on infrastructure you don\'t control, and may be logged, cached, or retained longer than you\'d expect. Terms of service often grant broad rights to uploaded content, and even well-intentioned services can suffer data breaches.',
          'For anyone handling sensitive information — whether you\'re a lawyer reviewing client contracts, a healthcare administrator processing patient records, or a financial advisor managing statements — this creates real compliance exposure.',
        ],
      },
      {
        heading: 'What regulations actually require',
        paragraphs: [
          'HIPAA requires covered entities to ensure that protected health information (PHI) is not disclosed to unauthorized parties. When you upload a document containing PHI to an online tool, that tool\'s operator becomes a "business associate" — and you need a signed BAA (Business Associate Agreement) before sharing any data. Most free online tools don\'t offer BAAs.',
          'GDPR requires a lawful basis for processing personal data and mandates data processing agreements (DPAs) with any third party that handles personal data on your behalf. Uploading a document with EU residents\' personal information to a random online tool likely violates Articles 28 and 44 of the GDPR, especially if the tool\'s servers are outside the EU.',
          'Even outside regulated industries, NDAs and client confidentiality agreements typically prohibit sharing documents with third parties without consent. That "quick PDF merge" could technically breach your confidentiality obligations.',
        ],
      },
      {
        heading: 'The browser-based alternative',
        paragraphs: [
          'Modern web browsers are remarkably capable. Technologies like WebAssembly (WASM) and the Canvas API allow complex file operations — compression, format conversion, redaction, metadata removal — to run entirely within the browser tab. No server roundtrip. No upload. The file never leaves your device.',
          'This isn\'t a compromise on quality. Browser-based tools can use the same algorithms as server-side ones. For example, Acorn Tools uses libvips compiled to WebAssembly for image processing — the same library used by major platforms like Sharp and Cloudinary. The difference is that the processing happens on your machine, not theirs.',
          'Client-side processing also means the tool works offline. Once loaded, you can disconnect from the internet entirely and still process files. This is particularly valuable for air-gapped environments or situations where network security is a concern.',
        ],
      },
      {
        heading: 'What to look for in a private file tool',
        paragraphs: [
          'Not every tool that claims to be "private" actually is. Here\'s what to verify: First, check whether the tool works offline. If it requires an internet connection to process files, it\'s likely sending data to a server. Open your browser\'s developer tools and watch the network tab — you should see zero outbound requests during processing.',
          'Second, look for open-source code. If the tool is open source, you can verify the claims yourself. You can inspect the code to confirm that no data is transmitted, and you can self-host it within your own infrastructure if needed.',
          'Third, check for Cross-Origin headers. Tools that use WebAssembly for heavy processing need specific HTTP headers (Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy). These headers actually increase security by isolating the page from other browsing contexts.',
        ],
      },
      {
        heading: 'Common tasks you can do without uploading',
        paragraphs: [
          'PDF redaction is one of the most sensitive operations you can perform on a document, and it\'s also one where privacy matters most. True redaction permanently removes content — it doesn\'t just draw a black box over text. Doing this client-side means the unredacted version of your document never exists anywhere but your device.',
          'Metadata stripping is another critical operation. Photos and PDFs often contain hidden metadata: GPS coordinates, device information, author names, revision history. Stripping this metadata before sharing prevents accidental information disclosure. When done in the browser, the metadata is removed locally — no third party ever sees it.',
          'File compression, format conversion, merging, and splitting are everyday tasks that often involve sensitive documents. There\'s no reason these operations need to touch a server. Browser-based tools handle them with the same speed and quality, minus the privacy risk.',
        ],
      },
      {
        heading: 'Making the switch',
        paragraphs: [
          'Switching to browser-based tools doesn\'t require changing your workflow significantly. The interface is the same: drag and drop a file, adjust settings, download the result. The difference is invisible but important — your files stay on your device throughout the entire process.',
          'For organizations with compliance requirements, browser-based tools simplify your vendor assessment process considerably. There\'s no data processing agreement to negotiate, no server infrastructure to audit, and no breach notification chain to establish. The tool never has access to your data in the first place.',
        ],
      },
    ],
  },
  {
    slug: 'hipaa-compliant-pdf-tools-browser-based',
    title: 'HIPAA-Compliant PDF Tools: Why Browser-Based Matters',
    metaTitle: 'HIPAA-Compliant PDF Tools: Why Browser-Based Matters — Acorn Tools',
    description: 'Understand how browser-based PDF tools help healthcare organizations maintain HIPAA compliance by keeping PHI off third-party servers entirely.',
    date: '2026-03-19',
    readTime: '7 min read',
    category: 'Healthcare Compliance',
    ctas: [
      { label: 'Redact PDF', path: '/redact-pdf', icon: '█' },
      { label: 'Merge PDFs', path: '/merge-pdf', icon: '⊕' },
      { label: 'Compress PDF', path: '/compress-pdf', icon: '▼' },
    ],
    sections: [
      {
        heading: 'The HIPAA problem with online PDF tools',
        paragraphs: [
          'Healthcare organizations process PDFs constantly — patient intake forms, lab results, insurance claims, referral letters, discharge summaries. When staff need to merge, compress, redact, or convert these documents, they often reach for the first free online tool that appears in a search.',
          'This creates an immediate HIPAA problem. The moment a PDF containing protected health information (PHI) is uploaded to an online tool, that tool\'s operator has received PHI. Under HIPAA\'s Privacy Rule, this disclosure requires authorization. Under the Security Rule, the tool operator becomes a business associate — and you need a signed BAA before sharing any data.',
          'Most free online PDF tools don\'t offer BAAs. They\'re not designed for healthcare use, and their terms of service typically include broad data usage rights that directly conflict with HIPAA requirements. Using them with PHI isn\'t just risky — it\'s a potential violation that can trigger OCR enforcement.',
        ],
      },
      {
        heading: 'Understanding the business associate requirement',
        paragraphs: [
          'HIPAA defines a business associate as any entity that creates, receives, maintains, or transmits PHI on behalf of a covered entity. When you upload a document to an online tool, the tool operator receives and processes PHI — that\'s textbook business associate territory.',
          'The consequences of operating without a BAA are significant. The Office for Civil Rights (OCR) has levied millions in penalties for unauthorized PHI disclosure. In 2023, a health system was fined $1.3 million for sharing patient data with a tracking vendor without a BAA. The principle applies equally to PDF tools: if the service touches PHI, you need a BAA.',
          'Even if a tool claims to "delete files immediately after processing," this doesn\'t eliminate the BAA requirement. The transmission itself constitutes disclosure under HIPAA. The file existed on their server, even if only for seconds. Their infrastructure handled your PHI, and you have no technical verification that deletion actually occurred.',
        ],
      },
      {
        heading: 'How browser-based processing changes the equation',
        paragraphs: [
          'Browser-based PDF tools fundamentally change the HIPAA analysis because they eliminate the data flow that creates the business associate relationship. When processing happens entirely in the browser, PHI never leaves the user\'s device. There\'s no transmission, no server-side receipt, no storage — and therefore no business associate relationship.',
          'This isn\'t a legal loophole; it\'s a genuine architectural difference. The tool\'s JavaScript code runs in the user\'s browser. The PDF is read from the local file system, processed in browser memory, and saved back to the local file system. The tool operator\'s servers serve static files (HTML, JavaScript, WASM binaries) but never see the user\'s documents.',
          'You can verify this yourself. Open your browser\'s Network tab in Developer Tools, then process a PDF. You\'ll see the initial page load, but during actual file processing, there are zero outbound network requests. The file stays local.',
        ],
      },
      {
        heading: 'Common healthcare PDF workflows',
        paragraphs: [
          'Redacting PDFs before sharing is one of the most common needs in healthcare. When releasing medical records in response to subpoenas or records requests, certain information must be redacted — other patients\' names in group therapy notes, Social Security numbers, or information outside the scope of the request. True redaction permanently removes the underlying content, not just visually obscures it.',
          'Merging documents is another frequent task. Assembling a patient\'s record for transfer, combining intake forms with clinical notes, or packaging documents for insurance submission — all involve merging PDFs that contain PHI. Doing this through an online tool means every document in the merge gets uploaded to a third-party server.',
          'Compressing PDFs matters for electronic health records and patient portals. Large scan-heavy documents need to be compressed before upload to EHR systems, but the compression shouldn\'t happen on an external server. Browser-based compression uses the same algorithms (smart JPEG re-encoding of embedded images) without the data leaving your workstation.',
          'Stripping metadata from PDFs before external sharing prevents accidental disclosure. PDF metadata can contain author names, revision dates, embedded comments, and even track changes from editing — information that could violate minimum necessary standards or reveal internal deliberations.',
        ],
      },
      {
        heading: 'HIPAA Security Rule considerations',
        paragraphs: [
          'The HIPAA Security Rule requires administrative, physical, and technical safeguards for ePHI. Browser-based tools align well with these requirements. For access control, the tool runs within the user\'s existing authenticated session on their workstation — no additional credentials or access grants needed.',
          'For audit controls, there\'s nothing to audit on the tool\'s side because the tool never has access to the data. Your existing workstation audit logs capture the file operations. For transmission security, there\'s nothing to encrypt in transit because there\'s no transit — the data stays in browser memory.',
          'For integrity controls, the tool operates on a copy of the file in browser memory. The original file isn\'t modified unless the user explicitly saves over it. And for person or entity authentication, the tool doesn\'t need its own authentication layer because it never stores or accesses data that requires protection.',
        ],
      },
      {
        heading: 'Evaluating tools for your organization',
        paragraphs: [
          'When evaluating PDF tools for healthcare use, ask these questions: Does the tool work offline? Can you verify through network inspection that no data leaves the browser? Is the source code available for security review? Does the tool require an account or collect user data?',
          'Browser-based tools that meet these criteria significantly simplify your compliance posture. There\'s no vendor security assessment to conduct, no BAA to negotiate and maintain, no data breach notification obligation from the tool vendor, and no data retention policy to audit. The simplest way to protect PHI from unauthorized disclosure is to never disclose it in the first place.',
          'For organizations that want maximum control, open-source browser-based tools can be self-hosted on internal infrastructure. This means the static files (HTML, JS, WASM) are served from your own servers, and staff access the tool through your intranet. The architecture remains the same — all processing happens client-side — but you control even the distribution of the tool itself.',
        ],
      },
    ],
  },
  {
    slug: 'gdpr-file-processing-personal-data-off-servers',
    title: 'GDPR File Processing: Keeping Personal Data Off Third-Party Servers',
    metaTitle: 'GDPR File Processing: Keeping Personal Data Off Third-Party Servers — Acorn Tools',
    description: 'How browser-based file tools help EU businesses stay GDPR compliant by processing documents locally — no third-party data transfers or DPAs needed.',
    date: '2026-03-19',
    readTime: '7 min read',
    category: 'EU Compliance',
    ctas: [
      { label: 'Strip Metadata', path: '/strip-metadata', icon: '⊘' },
      { label: 'Redact PDF', path: '/redact-pdf', icon: '█' },
      { label: 'Compress Images', path: '/compress-image', icon: '▼' },
    ],
    sections: [
      {
        heading: 'The GDPR implications of online file tools',
        paragraphs: [
          'When an employee in an EU organization uploads a document to an online PDF or image tool, they may be initiating a data transfer that triggers multiple GDPR obligations. If the document contains personal data — a name, email address, photo, signature, or any information that can identify a natural person — the upload constitutes processing by a third party.',
          'Under the GDPR, this third party becomes a data processor. Article 28 requires a written contract (a Data Processing Agreement, or DPA) between the controller and any processor, specifying the scope of processing, security measures, sub-processor chains, and data subject rights procedures. Most free online tools don\'t offer DPAs.',
          'The problem compounds if the tool\'s servers are outside the European Economic Area. Since the Schrems II ruling invalidated the EU-US Privacy Shield, transferring personal data to US-based services requires additional safeguards — Standard Contractual Clauses (SCCs) plus a Transfer Impact Assessment. For a free online PDF tool, this level of due diligence is impractical.',
        ],
      },
      {
        heading: 'What counts as personal data in documents',
        paragraphs: [
          'The GDPR\'s definition of personal data is broader than many people realize. It\'s not limited to obvious identifiers like names and email addresses. Any information that can directly or indirectly identify a natural person qualifies. In practice, this means most business documents contain personal data.',
          'Contracts contain names, addresses, and signatures. Invoices contain contact information and financial details. Photos contain faces (biometric data under GDPR) and often GPS metadata. Employee records, customer lists, project documents with contributor names, meeting minutes — all contain personal data. Even a PDF\'s metadata fields (author, creation date) can constitute personal data if they identify a specific person.',
          'This means that nearly every time someone uses an online tool to process a business document, they\'re likely transferring personal data to a third party. The question isn\'t whether GDPR applies — it\'s whether the transfer is lawful.',
        ],
      },
      {
        heading: 'The data minimization principle',
        paragraphs: [
          'Article 5(1)(c) of the GDPR establishes the principle of data minimization: personal data should be "adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed." Uploading an entire document to a third-party server to perform a simple operation (like compression or format conversion) processes far more data than necessary.',
          'Browser-based processing aligns perfectly with data minimization. The personal data in the document is never exposed to a third party. Only the minimum necessary processing occurs — in browser memory, on the user\'s own device. No copies are created on external servers, no logs capture document contents, and no caches retain personal data.',
          'Data Protection Authorities (DPAs) across the EU have increasingly emphasized data minimization in enforcement actions. The French CNIL, in particular, has fined organizations for collecting and processing more personal data than necessary. Using browser-based tools demonstrates a proactive commitment to minimization.',
        ],
      },
      {
        heading: 'Eliminating the processor relationship',
        paragraphs: [
          'The most effective way to simplify GDPR compliance is to reduce the number of data processors in your chain. Every processor requires a DPA, a security assessment, ongoing monitoring, and inclusion in your Records of Processing Activities (ROPA). Each processor also represents a potential breach notification obligation under Article 33.',
          'When you use a browser-based tool, there is no processor relationship. The tool vendor serves static files — HTML, JavaScript, and WebAssembly binaries — but never receives, accesses, or processes the personal data in your documents. The processing happens entirely within the data controller\'s infrastructure (the user\'s browser on the user\'s device).',
          'This eliminates an entire category of compliance overhead. No DPA to negotiate. No sub-processor chain to monitor. No cross-border transfer assessment. No breach notification dependency. No entry in your ROPA for this processing activity. For organizations managing dozens or hundreds of processor relationships, this simplification is significant.',
        ],
      },
      {
        heading: 'Cross-border transfer risks',
        paragraphs: [
          'Many popular online tools are operated by US-based companies with servers in the United States or other non-EEA countries. Since the Schrems II decision (Case C-311/18), transferring personal data to the US requires Standard Contractual Clauses plus a documented Transfer Impact Assessment demonstrating that the recipient country provides adequate protection.',
          'While the EU-US Data Privacy Framework (adopted in 2023) provides a mechanism for certified US companies, many online tool operators haven\'t obtained certification. And the Framework itself faces ongoing legal challenges. Relying on it for everyday document processing creates regulatory uncertainty.',
          'Browser-based processing eliminates cross-border transfer concerns entirely. Since personal data never leaves the user\'s device, there\'s no international transfer to assess. This is particularly valuable for organizations operating across multiple EU jurisdictions, where even intra-EU transfers can raise questions under local implementing legislation.',
        ],
      },
      {
        heading: 'Practical steps for GDPR-compliant file processing',
        paragraphs: [
          'Start by auditing your current tool usage. What online services do employees use to process documents? Are DPAs in place for each one? Do any involve cross-border transfers? This audit often reveals a surprising number of unmanaged processor relationships created by staff using free online tools for everyday tasks.',
          'Replace server-dependent tools with browser-based alternatives. For PDF operations (merge, split, compress, redact, convert) and image operations (resize, compress, convert, strip metadata), browser-based tools provide identical functionality without the compliance overhead. Verify claims by checking network activity during processing.',
          'For organizations that want additional assurance, open-source browser-based tools can be self-hosted. Deploy the static files on your own infrastructure, behind your existing authentication. Staff access the tool through your intranet, and you maintain full control over the distribution and versioning of the tool — while processing still happens entirely client-side.',
          'Document your choice of browser-based tools in your ROPA and data protection policies. Noting that specific processing activities use client-side-only tools demonstrates proactive compliance and can be a valuable reference point during DPA audits or data protection impact assessments.',
        ],
      },
    ],
  },
  {
    slug: 'confidential-legal-documents-without-breaking-ndas',
    title: 'Handling Confidential Legal Documents Online Without Breaking NDAs',
    metaTitle: 'Handling Confidential Legal Documents Online Without Breaking NDAs — Acorn Tools',
    description: 'Why uploading client files to online PDF tools may breach your NDA and confidentiality obligations — and how browser-based processing avoids the risk entirely.',
    date: '2026-03-19',
    readTime: '7 min read',
    category: 'Legal & Confidentiality',
    ctas: [
      { label: 'Redact PDF', path: '/redact-pdf', icon: '█' },
      { label: 'Merge PDFs', path: '/merge-pdf', icon: '⊕' },
      { label: 'Strip Metadata', path: '/strip-metadata', icon: '⊘' },
    ],
    sections: [
      {
        heading: 'The confidentiality problem hiding in your workflow',
        paragraphs: [
          'Every law firm, in-house legal department, and solo practitioner handles documents bound by confidentiality obligations. Client contracts, settlement agreements, court filings, due diligence materials, IP documentation — these all carry an implicit or explicit duty of confidentiality. Yet the tools used to process these documents often undermine that duty without anyone noticing.',
          'When a paralegal merges two PDFs using an online tool, or an associate compresses a filing before upload to a court portal, the document is typically sent to a third-party server for processing. This transmission — even if brief and encrypted — constitutes disclosure to a third party. And in many cases, that disclosure violates the confidentiality obligations attached to the document.',
          'The risk isn\'t theoretical. Bar associations have issued ethics opinions on cloud storage and third-party document processing. The ABA\'s Model Rule 1.6 requires lawyers to make "reasonable efforts to prevent the inadvertent or unauthorized disclosure" of client information. Uploading client documents to an unvetted online tool is difficult to characterize as a reasonable effort.',
        ],
      },
      {
        heading: 'What NDAs actually prohibit',
        paragraphs: [
          'Most NDAs define "confidential information" broadly — typically any information disclosed in connection with a business relationship, excluding information that becomes publicly available or was independently known. Documents exchanged under NDA almost certainly qualify as confidential information under these standard definitions.',
          'NDAs typically restrict disclosure to third parties without prior written consent. When you upload a document to an online tool, the tool operator receives and processes the document. Even if they don\'t read it, even if they delete it immediately, the transmission itself may constitute unauthorized disclosure. Many NDAs don\'t distinguish between intentional sharing and incidental processing — disclosure is disclosure.',
          'Mutual NDAs compound the problem. In M&A due diligence, for example, both parties exchange sensitive financials, customer lists, and IP documentation under strict confidentiality. If either party\'s staff uses an online tool to process these documents, they may breach the NDA — potentially jeopardizing the deal or creating liability.',
          'Some NDAs include specific provisions about data handling, requiring that confidential information be processed only on approved systems or within certain jurisdictions. Online tools with servers in unknown or multiple locations make compliance with these provisions impossible to verify.',
        ],
      },
      {
        heading: 'Attorney-client privilege at risk',
        paragraphs: [
          'Beyond NDAs, attorney-client privilege adds another layer of concern. Privileged communications — including draft briefs, legal memoranda, strategy documents, and attorney work product — lose their protected status if disclosed to third parties outside the privilege.',
          'Courts have held that privilege can be waived by voluntary disclosure to third parties, even when unintentional. While most jurisdictions apply a "reasonable precautions" test rather than strict liability for inadvertent disclosure, routinely uploading privileged documents to online tools undermines the argument that reasonable precautions were taken.',
          'The risk is particularly acute for litigation documents. Work product shared during discovery preparation, deposition summaries, and case strategy memos are exactly the types of documents that might need merging, redacting, or compressing. If opposing counsel discovers that these documents were processed through a third-party online tool, they may challenge the privilege claim.',
        ],
      },
      {
        heading: 'How browser-based tools preserve confidentiality',
        paragraphs: [
          'Browser-based document tools eliminate the third-party disclosure problem entirely. When a PDF is merged, redacted, compressed, or converted in the browser, the document never leaves the user\'s device. There\'s no upload, no server-side processing, no temporary storage on external infrastructure.',
          'From a confidentiality analysis, browser-based processing is equivalent to using desktop software installed on your workstation. The tool\'s code runs locally, the document stays local, and the result is saved locally. The tool vendor serves the application code (HTML, JavaScript) but never has access to the documents being processed.',
          'This means no NDA breach from document transmission, no privilege waiver risk from third-party disclosure, no need to vet the tool vendor\'s security posture or data retention policies, and no conflict with jurisdictional restrictions in NDAs. The simplest way to maintain confidentiality is to ensure the confidential information never leaves your control.',
        ],
      },
      {
        heading: 'Common legal workflows that create exposure',
        paragraphs: [
          'Document redaction is arguably the highest-risk operation in legal practice. Redacting a document before production means the original contains information that must not be disclosed — exactly the type of content that should never touch a third-party server. True redaction permanently removes the underlying content, and doing it client-side ensures the unredacted version exists only on the attorney\'s device.',
          'Merging exhibits, declarations, and supporting documents into a single filing is a daily task in litigation. Each component may contain confidential or privileged information, and the merged result contains all of it. Processing through an online tool exposes every document in the merge.',
          'Metadata stripping before document production is a professional obligation in many jurisdictions. PDF and image metadata can contain revision history, author names, comments, and tracked changes — information that may reveal attorney work product or confidential client communications. Stripping metadata locally prevents this information from being transmitted to any third party.',
          'Compressing documents before filing with courts or sharing with co-counsel seems routine, but if those documents contain confidential information, the compression should happen locally. Many court e-filing systems have file size limits, making compression a necessary step that shouldn\'t introduce confidentiality risk.',
        ],
      },
      {
        heading: 'Building a compliant document workflow',
        paragraphs: [
          'The solution is straightforward: replace server-dependent online tools with browser-based alternatives for any document that carries confidentiality obligations. This doesn\'t require changing your workflow — the user experience is identical (drag, process, download) — it just changes where the processing happens.',
          'For firms with formal information security policies, browser-based tools simplify the vendor assessment process. There\'s no data processing to evaluate because no data is processed by the vendor. There\'s no security questionnaire to complete, no SOC 2 report to review, and no data breach notification obligation from the tool provider.',
          'Consider making browser-based tools the default for all document processing, not just confidential documents. This eliminates the risk of staff misjudging whether a document is confidential and using the wrong tool. When every document is processed locally, confidentiality is maintained by default rather than by judgment call.',
          'For firms that want maximum assurance, open-source browser-based tools can be self-hosted behind the firm\'s firewall. The static application files are served from internal infrastructure, and staff access the tools through the firm\'s intranet. Processing still happens entirely in the browser — self-hosting just adds control over the application distribution.',
        ],
      },
    ],
  },
  {
    slug: 'sox-compliance-document-processing-local',
    title: 'SOX Compliance and Document Processing: Why Local Matters',
    metaTitle: 'SOX Compliance and Document Processing: Why Local Matters — Acorn Tools',
    description: 'How browser-based file tools help finance teams maintain SOX compliance by keeping sensitive financial documents off third-party servers.',
    date: '2026-03-19',
    readTime: '7 min read',
    category: 'Finance & Compliance',
    ctas: [
      { label: 'Compress PDF', path: '/compress-pdf', icon: '▼' },
      { label: 'Redact PDF', path: '/redact-pdf', icon: '█' },
      { label: 'Merge PDFs', path: '/merge-pdf', icon: '⊕' },
    ],
    sections: [
      {
        heading: 'Financial documents and the third-party tool problem',
        paragraphs: [
          'Finance teams, auditors, and banking professionals work with some of the most sensitive documents in any organization: quarterly earnings drafts, audit workpapers, M&A term sheets, loan applications, customer financial statements, board presentations, and internal forecasts. These documents move through countless processing steps — merging, compressing, redacting, converting — before reaching their final destination.',
          'When any of these steps involves an online tool that uploads documents to a server, the organization loses control over where that financial data exists. For publicly traded companies subject to SOX (Sarbanes-Oxley Act), this loss of control creates compliance exposure that extends far beyond data privacy.',
          'The stakes are high. SOX violations can result in criminal penalties for executives, including fines up to $5 million and imprisonment up to 20 years for willful violations. Even unintentional compliance failures can trigger costly remediation, restatements, and reputational damage.',
        ],
      },
      {
        heading: 'SOX Section 302 and document integrity',
        paragraphs: [
          'Section 302 of SOX requires CEOs and CFOs to personally certify the accuracy of financial reports and the effectiveness of internal controls over financial reporting. This certification extends to the processes and systems that handle financial data — including the tools used to process financial documents.',
          'When financial documents are uploaded to third-party online tools, a gap is introduced in the chain of custody. The document leaves the organization\'s controlled environment, is processed on infrastructure the organization doesn\'t manage, and returns. During that window, the organization cannot certify what happened to the data — whether it was logged, cached, modified, or accessed by unauthorized parties.',
          'Internal controls are only as strong as their weakest link. If the finance team uses vetted, controlled systems for accounting and reporting but processes supporting documents through unvetted online tools, the control environment has a gap that auditors can identify and that management must address.',
        ],
      },
      {
        heading: 'Section 404 internal controls and IT general controls',
        paragraphs: [
          'Section 404 requires management to assess the effectiveness of internal controls over financial reporting annually, with external auditor attestation for accelerated filers. IT General Controls (ITGCs) are a critical component of this assessment, covering access management, change management, and IT operations for systems that process financial data.',
          'Every third-party tool that handles financial documents potentially falls within the scope of ITGC testing. If an online PDF tool processes documents containing financial data, auditors may ask: What access controls does the tool have? What is its change management process? How are operations monitored? What is the data retention policy? For free online tools, the answers to these questions are typically unavailable or unsatisfactory.',
          'Browser-based tools fall outside ITGC scope because they never access financial data. The tool vendor serves static application code, but the financial documents are processed entirely within the user\'s browser on the organization\'s workstation. The relevant ITGCs are those already in place for the workstation itself — access controls, patching, endpoint protection — not new controls for an additional vendor.',
          'This distinction significantly reduces the scope of ITGC testing. Each third-party tool that processes financial data adds to the audit scope, requiring vendor assessments, control testing, and documentation. Eliminating these tools from the scope saves time and cost during the annual SOX compliance cycle.',
        ],
      },
      {
        heading: 'Material non-public information (MNPI)',
        paragraphs: [
          'Public companies handle material non-public information regularly — draft earnings releases, M&A discussions, strategic plans, board materials, and financial forecasts. SEC regulations and insider trading laws impose strict obligations on how MNPI is handled. Unauthorized disclosure of MNPI can trigger SEC enforcement actions and private litigation.',
          'When a document containing MNPI is uploaded to an online tool, it\'s transmitted to and processed by a third party. Even if the tool operator doesn\'t intentionally access the content, the transmission creates a record that could be subpoenaed, the data may exist in logs or backups, and the tool\'s employees have theoretical access to the processing infrastructure.',
          'For organizations with robust MNPI policies, the use of online tools for document processing should be a red flag. Most MNPI policies restrict information sharing to authorized individuals and approved systems. Free online tools are unlikely to qualify as approved systems, and their operators are not authorized recipients.',
          'Browser-based processing eliminates MNPI exposure from document processing. The information never leaves the authorized user\'s device, never exists on third-party infrastructure, and never creates records accessible to unauthorized parties. This aligns with the principle of limiting MNPI dissemination to the minimum necessary.',
        ],
      },
      {
        heading: 'Audit trail and chain of custody',
        paragraphs: [
          'Financial document processing requires a defensible chain of custody. When auditors ask how a document was prepared — how exhibits were merged, how sensitive information was redacted, how files were compressed for submission — the answer should demonstrate controlled, documented processes.',
          'Online tools break this chain. The document leaves the organization\'s environment, is processed in an unknown location, and returns. There\'s typically no audit log from the tool, no verification of processing integrity, and no evidence of what data was retained. If questions arise about document integrity months or years later, the organization cannot demonstrate what happened during the online processing step.',
          'Browser-based processing keeps the entire chain of custody local. The document is processed within the organization\'s controlled environment, on a device subject to the organization\'s access controls and logging policies. The processing is equivalent to using installed desktop software — it inherits the existing control environment rather than introducing a new, uncontrolled link.',
        ],
      },
      {
        heading: 'Practical recommendations for finance teams',
        paragraphs: [
          'Start with a tool inventory. Identify all online tools that finance staff use for document processing. This often reveals a surprising number of shadow IT tools — free online services that individuals discovered through search and adopted without IT or compliance review. Each one represents potential SOX scope and MNPI exposure.',
          'Replace server-dependent tools with browser-based alternatives. For the common operations finance teams need — compressing PDFs for filing, merging supporting documents, redacting sensitive information before sharing, converting formats, and stripping metadata — browser-based tools provide equivalent functionality without the compliance overhead.',
          'Update your IT and information security policies to specify approved document processing tools. Explicitly note that browser-based tools that process documents locally are preferred over server-dependent alternatives. This provides clear guidance to staff and demonstrates proactive compliance effort to auditors.',
          'For organizations with strict IT governance, consider self-hosting browser-based tools on internal infrastructure. Deploy the static application files behind your corporate authentication, and staff access the tools through the intranet. Processing still happens in the browser — self-hosting just ensures the application itself is distributed under your control.',
        ],
      },
    ],
  },

  // ── How-to articles targeting long-tail search queries ──

  {
    slug: 'compress-pdf-without-adobe',
    title: 'How to Compress a PDF Without Adobe Acrobat',
    metaTitle: 'How to Compress a PDF Without Adobe Acrobat — Acorn Tools',
    description: 'Reduce PDF file size for free without Adobe Acrobat or any software. Learn how browser-based compression works and when to use smart vs. aggressive mode.',
    date: '2026-03-27',
    readTime: '5 min read',
    category: 'How-To Guide',
    ctas: [
      { label: 'Compress PDF', path: '/compress-pdf', icon: '▼' },
      { label: 'Merge PDFs', path: '/merge-pdf', icon: '⊕' },
      { label: 'Compress Images', path: '/compress-image', icon: '▼' },
    ],
    sections: [
      {
        heading: 'Why people look for Adobe alternatives',
        paragraphs: [
          'Adobe Acrobat Pro costs $19.99/month. For someone who needs to compress a PDF once a week — to email a contract, submit a court filing, or upload to a portal with a file size limit — that subscription is hard to justify. And the free version of Acrobat Reader doesn\'t include compression.',
          'The result is that millions of people search for "compress PDF free" or "compress PDF without Adobe" every month. The alternatives they find are mostly online tools that upload your document to a server, compress it remotely, and send it back. That works — but it means your document sits on someone else\'s infrastructure during processing.',
        ],
      },
      {
        heading: 'The three types of PDF compressors',
        paragraphs: [
          'Server-based tools (iLovePDF, SmallPDF, etc.) upload your file, process it on their servers, and return the result. They\'re convenient but your document leaves your device. Most impose file size limits or require accounts for repeated use.',
          'Desktop software (Adobe Acrobat, Preview on Mac, various open-source tools) runs locally but requires installation. On corporate machines, installing software often requires IT approval.',
          'Browser-based tools run in your web browser using WebAssembly. No installation, no upload, no server processing. The file stays on your device throughout. Acorn Tools falls into this category — it uses the same compression algorithms as server-based tools, but executes them in your browser tab.',
        ],
      },
      {
        heading: 'How smart PDF compression works',
        paragraphs: [
          'Most PDF file size comes from embedded images — scanned pages, photographs, diagrams. Smart compression targets these images specifically. It enumerates every image in the PDF, measures the perceptual quality impact of re-encoding at various quality levels (using SSIM — Structural Similarity Index), and replaces each image at the optimal quality.',
          'Text, fonts, vector graphics, and annotations are preserved exactly. Text remains selectable and searchable. Only the images are re-encoded. This is why smart compression can reduce a scan-heavy PDF by 40–70% without visible quality loss.',
        ],
      },
      {
        heading: 'When to use aggressive compression',
        paragraphs: [
          'Aggressive compression rasterizes every page — converting the entire page (text, images, vectors) into a single image, then re-encoding as JPEG. This produces the smallest files but text becomes an image: it\'s no longer selectable or searchable.',
          'Use aggressive mode for scanned documents that are already images (no selectable text to preserve), documents where file size is the top priority (email limits, portal uploads), and archival copies where text search isn\'t needed.',
        ],
      },
      {
        heading: 'Step by step: compress a PDF in your browser',
        paragraphs: [
          'Open the Compress PDF tool. Drop your PDF file onto the page (or click to browse). Choose Smart or Aggressive mode. For Smart mode, the tool analyzes embedded images and shows the estimated reduction. Click compress and download the result.',
          'The entire process happens in your browser tab. You can verify this by opening your browser\'s Network tab in Developer Tools — you\'ll see zero outbound requests during compression. Your document never leaves your device.',
        ],
      },
    ],
  },
  {
    slug: 'remove-exif-data-before-sharing-photos',
    title: 'How to Remove EXIF Data From Photos Before Sharing',
    metaTitle: 'How to Remove EXIF Data From Photos Before Sharing — Acorn Tools',
    description: 'Your photos contain hidden GPS coordinates, device info, and timestamps. Learn what EXIF data is, why it matters, and how to strip it before posting online.',
    date: '2026-03-27',
    readTime: '5 min read',
    category: 'Privacy Guide',
    ctas: [
      { label: 'Strip Metadata', path: '/strip-metadata', icon: '⊘' },
      { label: 'Compress Images', path: '/compress-image', icon: '▼' },
      { label: 'Convert Format', path: '/convert-image', icon: '⇄' },
    ],
    sections: [
      {
        heading: 'What EXIF data is hiding in your photos',
        paragraphs: [
          'Every photo taken with a smartphone or digital camera contains EXIF (Exchangeable Image File Format) metadata embedded invisibly in the file. This includes GPS coordinates (latitude and longitude of where the photo was taken), the exact date and time, your device model and serial number, camera settings (aperture, shutter speed, ISO), and sometimes a thumbnail of the original image.',
          'On a smartphone, this often means every photo you take is tagged with your exact location. A photo taken at home reveals your home address. A photo taken at work reveals your workplace. This data persists when you share the file — unless you explicitly remove it.',
        ],
      },
      {
        heading: 'Why EXIF data is a privacy risk',
        paragraphs: [
          'When you share a photo via email, messaging apps, cloud storage, or forums, the EXIF data often travels with it. Anyone who receives the file can extract the GPS coordinates using free tools or even the file properties dialog in their operating system.',
          'Journalists, activists, domestic violence survivors, and anyone with safety concerns have specific reasons to strip location data. But even for everyday use, sharing your precise location history with strangers on the internet is an unnecessary risk. Some social media platforms strip EXIF on upload (Instagram, Twitter/X), but many don\'t — and sharing via email, Slack, Discord, or file hosting preserves everything.',
        ],
      },
      {
        heading: 'What platforms strip EXIF and which don\'t',
        paragraphs: [
          'Platforms that strip EXIF on upload: Instagram, Twitter/X, Facebook. These re-encode your photo for their own purposes (resizing, compression), which removes EXIF as a side effect.',
          'Platforms that preserve EXIF: Email attachments, Slack, Discord (in most cases), Google Drive, Dropbox, iCloud sharing links, direct file transfers, personal websites, forums, and most cloud storage services. If you share photos through any of these channels, the EXIF data is included unless you remove it first.',
        ],
      },
      {
        heading: 'How to strip EXIF without uploading your photos',
        paragraphs: [
          'The irony of most online EXIF removers is that they require you to upload your photo to a server — exposing the very data you\'re trying to protect. Your GPS coordinates and device info travel to a third-party server before being stripped.',
          'Browser-based metadata removal avoids this entirely. Acorn Tools strips EXIF data by re-encoding the image pixel data without the metadata tags. The processing happens in your browser — the photo with its embedded location data never leaves your device. You can batch-process multiple photos at once.',
        ],
      },
      {
        heading: 'What about PDF metadata?',
        paragraphs: [
          'PDFs have their own metadata problem. The document properties can contain the author\'s name, the software used to create it, creation and modification dates, and keywords. When you merge, edit, or convert PDFs, metadata accumulates from every tool in the chain.',
          'Acorn Tools strips PDF metadata the same way — locally in your browser. Author, title, subject, keywords, creator, and date fields are all cleared. This is particularly important before sharing legal documents, contracts, or reports where the metadata could reveal information about your internal processes.',
        ],
      },
    ],
  },
  {
    slug: 'png-vs-jpg-vs-webp-which-format',
    title: 'PNG vs JPG vs WebP: Which Image Format Should You Use?',
    metaTitle: 'PNG vs JPG vs WebP: Which Image Format Should You Use? — Acorn Tools',
    description: 'A practical guide to choosing between PNG, JPG, and WebP for websites, social media, and everyday use. Understand the trade-offs between quality, file size, and compatibility.',
    date: '2026-03-27',
    readTime: '6 min read',
    category: 'Technical Guide',
    ctas: [
      { label: 'Convert Format', path: '/convert-image', icon: '⇄' },
      { label: 'Compress Images', path: '/compress-image', icon: '▼' },
      { label: 'Resize Images', path: '/resize-image', icon: '⤡' },
    ],
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Use JPEG for photographs and complex images with many colors. Use PNG for screenshots, logos, text-heavy images, and anything that needs transparency. Use WebP for web content where you want smaller files and your audience uses modern browsers.',
          'That\'s the quick rule. The rest of this article explains why, and when the exceptions apply.',
        ],
      },
      {
        heading: 'JPEG: the universal photograph format',
        paragraphs: [
          'JPEG uses lossy compression — it discards visual information that humans are unlikely to notice, achieving dramatic file size reductions. A 10MB raw photo might compress to 500KB as a JPEG with no visible quality difference at normal viewing sizes.',
          'JPEG excels at photographs, artwork, and images with smooth gradients and complex color variations. It struggles with sharp edges, text, and flat-color graphics — these develop visible artifacts (blocky patterns) at lower quality settings. JPEG does not support transparency.',
          'Use JPEG when: sharing photos by email, uploading to social media, embedding images in documents, or any situation where universal compatibility matters. Every device, browser, and application supports JPEG.',
        ],
      },
      {
        heading: 'PNG: lossless quality and transparency',
        paragraphs: [
          'PNG uses lossless compression — no information is discarded. The decompressed image is identical to the original, pixel for pixel. This makes PNG ideal for images where precision matters: screenshots, text, logos, UI elements, diagrams, and graphics with flat colors and sharp edges.',
          'PNG supports full alpha transparency, meaning pixels can be partially transparent. This is essential for logos and graphics that need to appear on different background colors. JPEG has no transparency support at all.',
          'The trade-off is file size. PNG files are typically 5–10x larger than equivalent JPEGs for photographs. A photo saved as PNG might be 15MB; the same photo as JPEG might be 800KB. For photographs, this size penalty isn\'t worth it because the quality difference is imperceptible.',
        ],
      },
      {
        heading: 'WebP: the modern web standard',
        paragraphs: [
          'Developed by Google, WebP supports both lossy and lossless compression, plus transparency. At equivalent visual quality, WebP files are typically 25–35% smaller than JPEG and 25% smaller than PNG. This makes it the best choice for web performance.',
          'The main limitation is compatibility. While all modern browsers support WebP (Chrome, Firefox, Safari, Edge), older software and some image editors don\'t. If you\'re sharing images via email or using them in desktop applications, JPEG or PNG is safer.',
          'Use WebP when: building websites where page load speed matters, serving images through a CDN, or storing images where storage costs are a concern. Use JPEG or PNG as a fallback for email and offline use.',
        ],
      },
      {
        heading: 'AVIF: the next generation',
        paragraphs: [
          'AVIF (AV1 Image File Format) pushes compression further than WebP — typically 20% smaller at equivalent quality. It supports transparency, HDR, and wide color gamuts. Browser support is growing but not universal: Chrome and Firefox support it, Safari added support in version 16.4.',
          'For most use cases today, WebP remains the practical choice for web delivery. AVIF is worth considering if you\'re building for cutting-edge browsers and want maximum compression.',
        ],
      },
      {
        heading: 'How to convert between formats',
        paragraphs: [
          'Acorn Tools converts between JPEG, PNG, WebP, and AVIF directly in your browser. Drop an image, select the target format, adjust quality settings if applicable, and download. You can batch-convert multiple images at once.',
          'All conversion happens locally — your images are never uploaded to a server. This is particularly useful when converting screenshots or photos that contain sensitive content, since the files stay on your device throughout.',
        ],
      },
    ],
  },
  {
    slug: 'merge-pdf-files-without-software',
    title: 'How to Merge PDF Files Without Downloading Software',
    metaTitle: 'How to Merge PDF Files Without Downloading Software — Acorn Tools',
    description: 'Combine multiple PDFs into one document without installing software or uploading files. Browser-based merging that works on any device.',
    date: '2026-03-27',
    readTime: '4 min read',
    category: 'How-To Guide',
    ctas: [
      { label: 'Merge PDFs', path: '/merge-pdf', icon: '⊕' },
      { label: 'Compress PDF', path: '/compress-pdf', icon: '▼' },
      { label: 'Organize Pages', path: '/pdf-pages', icon: '⊞' },
    ],
    sections: [
      {
        heading: 'The problem with PDF merging tools',
        paragraphs: [
          'You need to combine two PDFs — a cover letter and a resume, or several invoices into a monthly bundle. Adobe Acrobat can do it, but you don\'t have a subscription. Free desktop tools exist but require downloading and installing software, which may not be allowed on corporate machines.',
          'So you search for "merge PDF online" and find dozens of web tools. They work, but they all upload your files to their servers. For personal documents, that might be acceptable. For client contracts, medical records, financial statements, or anything under NDA — it\'s a problem.',
        ],
      },
      {
        heading: 'Browser-based merging: no upload, no install',
        paragraphs: [
          'Modern browsers can run complex operations locally using WebAssembly and JavaScript libraries. Acorn Tools uses pdf-lib — a pure JavaScript PDF library — to merge PDFs entirely in your browser tab. Your files are read from your device, combined in browser memory, and the result is saved back to your device.',
          'No server is involved. No installation is required. It works on any device with a modern browser — Windows, Mac, Linux, Chromebook, even tablets.',
        ],
      },
      {
        heading: 'Step by step: merge PDFs in your browser',
        paragraphs: [
          'Open the Merge PDFs tool. Drop your PDF files onto the page (or click to browse). The files appear in a list — drag to reorder them. Click merge and download the combined document.',
          'Pages are copied directly from the source files. Text, images, fonts, formatting, hyperlinks, and bookmarks are preserved. There\'s no re-encoding, no quality loss, and no page limit. The only constraint is your device\'s available memory.',
        ],
      },
      {
        heading: 'When confidentiality matters',
        paragraphs: [
          'Merging is one of the most common operations in legal, healthcare, and financial document workflows. Assembling court filings, combining patient records for transfer, packaging due diligence documents — these all involve merging PDFs that contain confidential information.',
          'Every file in a merge gets uploaded to the server when using online tools. That\'s not one document exposed — it\'s every document. Browser-based merging keeps all files on your device, which is the difference between compliance and exposure for organizations subject to HIPAA, GDPR, or confidentiality agreements.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-redact-pdf-free',
    title: 'How to Redact a PDF for Free — True Redaction, Not Just Black Boxes',
    metaTitle: 'How to Redact a PDF for Free — True Redaction | Acorn Tools',
    description: 'Learn the difference between true PDF redaction and fake redaction (black boxes). Free browser-based tool that permanently destroys sensitive content.',
    date: '2026-03-27',
    readTime: '5 min read',
    category: 'Privacy & Compliance',
    ctas: [
      { label: 'Redact PDF', path: '/redact-pdf', icon: '█' },
      { label: 'Strip Metadata', path: '/strip-metadata', icon: '⊘' },
      { label: 'Compress PDF', path: '/compress-pdf', icon: '▼' },
    ],
    sections: [
      {
        heading: 'Most PDF "redaction" tools don\'t actually redact',
        paragraphs: [
          'A surprising number of tools — including some expensive ones — "redact" PDFs by drawing a black rectangle over the text. The text is still in the file. Anyone can select it, copy it, or extract it with command-line tools. This isn\'t redaction; it\'s decoration.',
          'Real-world consequences of fake redaction are well-documented. In 2014, a TSA security directive was "redacted" with black boxes that could be removed by copy-pasting into a text editor. In legal proceedings, improperly redacted documents have exposed privileged information, personal data, and classified details.',
        ],
      },
      {
        heading: 'What true redaction looks like',
        paragraphs: [
          'True redaction permanently destroys the content underneath the redaction mark. The original text or image no longer exists in the file in any form — not hidden, not covered, not accessible through any viewer or tool.',
          'Acorn Tools achieves this by rasterizing each redacted page: the page is rendered as an image with the redaction rectangles burned in, then the rasterized version replaces the original page. The text underneath is not present in the output file. It cannot be recovered because it was never included.',
          'Pages without redactions are copied verbatim — no quality loss, no rasterization. Only pages where you draw redaction rectangles are re-rendered.',
        ],
      },
      {
        heading: 'Why redaction must happen locally',
        paragraphs: [
          'Redaction is unique among document operations because the input (unredacted document) is more sensitive than the output (redacted document). When you upload a document to an online redaction tool, you\'re sending the unredacted version — the version with the sensitive content — to a third-party server.',
          'This fundamentally defeats the purpose. The information you\'re trying to protect exists on someone else\'s infrastructure, even if only temporarily. For legal, medical, financial, or classified documents, this is unacceptable.',
          'Browser-based redaction means the unredacted document never leaves your device. The sensitive content is destroyed locally, and only the redacted result is saved or shared. This is the only architecture that makes sense for true redaction.',
        ],
      },
      {
        heading: 'How to redact a PDF in your browser',
        paragraphs: [
          'Open the Redact PDF tool. Drop your PDF file. Pages are rendered as visual previews. Draw rectangles over any content you want to permanently remove — text, images, signatures, numbers, anything. The redaction rectangles appear in red so you can see exactly what will be removed.',
          'Click redact and download the result. Redacted pages are rasterized with the content destroyed. Clean pages are preserved in their original quality. The whole process runs in your browser with no server involvement.',
        ],
      },
      {
        heading: 'Redaction for compliance',
        paragraphs: [
          'HIPAA requires redaction of protected health information (PHI) before sharing records with unauthorized parties. GDPR\'s "right to erasure" may require redacting personal data from archived documents. Legal discovery requires redacting privileged information before document production.',
          'In all these cases, the tool you use matters as much as the redaction itself. Using a server-based tool to redact HIPAA-protected information means the unredacted PHI was transmitted to a third party — potentially a violation in itself. Browser-based redaction keeps PHI on the covered entity\'s device throughout.',
        ],
      },
    ],
  },
];

// Build lookup map
export const BLOG_POST_BY_SLUG = Object.fromEntries(
  BLOG_POSTS.map(p => [p.slug, p])
);

export { BLOG_POSTS, BASE_URL };
