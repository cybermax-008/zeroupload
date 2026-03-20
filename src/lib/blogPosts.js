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
];

// Build lookup map
export const BLOG_POST_BY_SLUG = Object.fromEntries(
  BLOG_POSTS.map(p => [p.slug, p])
);

export { BLOG_POSTS, BASE_URL };
