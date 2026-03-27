// Rich below-the-fold content for each tool page.
// Gives Google 300–500 words of unique, crawlable text per tool page.
// Imported by ToolPage.jsx and rendered after the interactive tool.

const TOOL_CONTENT = {

  '/resize-image': {
    relatedTools: ['/compress-image', '/convert-image', '/crop-image', '/strip-metadata'],
    sections: [
      {
        heading: 'How browser-based image resizing works',
        paragraphs: [
          'Acorn Tools resizes images using libvips compiled to WebAssembly — the same library behind Sharp, Cloudinary, and other professional image pipelines. The difference is that it runs entirely in your browser tab instead of on a remote server. Your images never leave your device.',
          'The Lanczos3 resampling algorithm produces sharp, artifact-free results whether you\'re scaling up or down. If your browser doesn\'t support WebAssembly SharedArrayBuffer, the tool automatically falls back to Pica.js with the same high-quality algorithm.',
        ],
      },
      {
        heading: 'Common reasons to resize images',
        paragraphs: [
          'Resize photos for social media platforms (Instagram, Twitter/X, LinkedIn) that require specific dimensions. Scale product images to exact pixel sizes for e-commerce listings on Shopify, Amazon, or Etsy. Reduce image dimensions before embedding in presentations or documents to keep file sizes manageable.',
          'You can enter exact width and height in pixels, resize by percentage, or use common presets. Aspect ratio can be locked for proportional scaling or unlocked for exact dimensions.',
        ],
      },
      {
        heading: 'Why resize images without uploading them',
        paragraphs: [
          'Most online image resizers upload your photo to their server, process it, and send the result back. Your images — including GPS coordinates, faces, and private content — pass through infrastructure you don\'t control.',
          'Browser-based resizing keeps everything local. This matters for photographers protecting client work, businesses handling images under NDA, and anyone who prefers not to hand personal photos to a third-party server. The tool works offline too — disconnect from the internet and it still works.',
        ],
      },
    ],
  },

  '/compress-image': {
    relatedTools: ['/resize-image', '/convert-image', '/compress-pdf', '/strip-metadata'],
    sections: [
      {
        heading: 'How image compression works without uploading',
        paragraphs: [
          'Acorn Tools compresses images using libvips WebAssembly — the same engine behind professional image CDNs. You control the quality slider and see the resulting file size in real time before downloading, so you find the right balance between visual quality and file size.',
          'JPEG compression typically achieves 50–80% size reduction depending on the image. PNG optimization removes unnecessary chunks and metadata. WebP leverages modern codecs for smaller files at equivalent quality.',
        ],
      },
      {
        heading: 'When to compress images',
        paragraphs: [
          'Compress photos before uploading to your website or CMS to improve page load speed — Google uses Core Web Vitals as a ranking factor, and image size is often the biggest bottleneck. Reduce file sizes for email campaigns where large attachments get blocked or slow to download.',
          'Prepare images for mobile apps where bandwidth and storage are limited. Batch compress entire folders for web galleries, product catalogs, or archival. The tool processes multiple files simultaneously with no upload or server dependency.',
        ],
      },
      {
        heading: 'Real-time quality preview',
        paragraphs: [
          'Unlike server-based compressors that apply a fixed setting, Acorn Tools shows a live before-and-after comparison. Zoom in to check fine details, compare file sizes, and adjust the quality slider until the result meets your standards — all before saving.',
          'Because compression runs locally, the feedback loop is instant. No re-uploading, no waiting for server processing. Experiment freely with different quality levels until you get exactly the result you want.',
        ],
      },
    ],
  },

  '/convert-image': {
    relatedTools: ['/resize-image', '/compress-image', '/crop-image', '/image-to-pdf'],
    sections: [
      {
        heading: 'Supported format conversions',
        paragraphs: [
          'Convert between JPEG, PNG, WebP, and AVIF formats. Common conversions include PNG to JPG for smaller file sizes, WebP to PNG for compatibility with older software, AVIF to JPEG for universal support, and JPG to WebP for modern web performance.',
          'Converting to lossy formats (JPEG, WebP) gives you control over the quality setting. Converting to lossless formats (PNG) preserves full image quality with no artifacts.',
        ],
      },
      {
        heading: 'Why convert image formats',
        paragraphs: [
          'Different platforms and contexts require different formats. JPEGs are universal but lossy. PNGs support transparency and are lossless. WebP offers 25–35% smaller files than JPEG at equivalent quality — ideal for websites. AVIF pushes compression even further but has limited browser support.',
          'Convert screenshots from PNG to JPEG to reduce email attachment sizes. Convert WebP images downloaded from websites to PNG or JPEG for use in software that doesn\'t support WebP. Convert photos to WebP before uploading to your website for faster page loads.',
        ],
      },
      {
        heading: 'Batch conversion without uploading',
        paragraphs: [
          'Drop multiple images and convert them all to your target format in one operation. Each file is processed independently in your browser — no server, no upload, no file size limits imposed by a third party.',
          'This is particularly useful for web developers preparing image assets, photographers delivering files in a client\'s preferred format, or anyone standardizing a folder of mixed-format images.',
        ],
      },
    ],
  },

  '/crop-image': {
    relatedTools: ['/resize-image', '/compress-image', '/convert-image'],
    sections: [
      {
        heading: 'How image cropping works in the browser',
        paragraphs: [
          'Select any rectangular region of your image with click-and-drag, then export just that portion. The cropping interface shows real-time pixel coordinates and dimensions so you can make precise selections.',
          'The cropped result preserves the original image quality — no recompression is applied during cropping. The output is saved in the same format as the input.',
        ],
      },
      {
        heading: 'When to crop images online',
        paragraphs: [
          'Crop photos to focus on a subject, remove distracting background elements, or fit a specific aspect ratio for social media or print layouts. Extract a region of a screenshot to highlight a specific UI element or error message.',
          'Crop product photos to consistent dimensions for e-commerce listings. Remove borders or letterboxing from images. Prepare headshots by cropping to square or portrait dimensions.',
        ],
      },
      {
        heading: 'Privacy-safe cropping',
        paragraphs: [
          'Cropping happens entirely in your browser. Your image never leaves your device, and no copy is stored anywhere else. This matters when cropping screenshots that contain sensitive information, personal photos, or work documents.',
          'The tool works offline once loaded — you can disconnect from the internet and continue cropping.',
        ],
      },
    ],
  },

  '/strip-metadata': {
    relatedTools: ['/compress-image', '/redact-pdf', '/convert-image', '/compress-pdf'],
    sections: [
      {
        heading: 'What metadata is hidden in your files',
        paragraphs: [
          'Photos contain EXIF data embedded by your camera or phone: GPS coordinates revealing where the photo was taken, device serial numbers, camera model, lens information, timestamps, and sometimes even thumbnail images of the original uncropped photo.',
          'PDFs contain author names, creation and modification dates, the software used to create them, keywords, subject lines, and sometimes tracked changes or comments. This hidden data can reveal sensitive information you didn\'t intend to share.',
        ],
      },
      {
        heading: 'Why strip metadata before sharing',
        paragraphs: [
          'When you share a photo online, anyone can extract its GPS coordinates and identify exactly where it was taken — your home, workplace, or other private locations. Social media platforms strip some metadata, but not all do, and sharing via email or direct download preserves everything.',
          'PDF metadata can reveal who authored a document, what software was used, and when it was last edited. In legal, healthcare, or business contexts, this metadata may disclose information protected by NDAs, HIPAA, or internal policies.',
        ],
      },
      {
        heading: 'Browser-based metadata removal',
        paragraphs: [
          'Acorn Tools strips metadata entirely in your browser. For images, it re-encodes the pixel data without the EXIF tags. For PDFs, it clears all document information fields using pdf-lib. No file ever leaves your device during the process.',
          'This is especially important for metadata stripping — the whole point is privacy. Uploading a file to a server to remove its metadata defeats the purpose. Local processing ensures the metadata is destroyed without ever being transmitted.',
        ],
      },
    ],
  },

  '/image-to-pdf': {
    relatedTools: ['/compress-image', '/pdf-pages', '/merge-pdf', '/compress-pdf'],
    sections: [
      {
        heading: 'How image-to-PDF conversion works',
        paragraphs: [
          'Acorn Tools uses pdf-lib to embed your images directly into a PDF document. Each image becomes a page in the final PDF. You can drag to reorder pages, and the tool handles page sizing automatically.',
          'JPEG and PNG images are embedded natively. WebP and AVIF images are converted to PNG via the browser\'s Canvas API before embedding, ensuring compatibility with all PDF viewers.',
        ],
      },
      {
        heading: 'Common use cases for image-to-PDF',
        paragraphs: [
          'Combine scanned receipts, invoices, or handwritten notes into a single PDF for filing or submission. Create photo books or visual reports from a collection of images. Package design mockups or screenshots into a shareable document.',
          'Convert whiteboard photos from meetings into PDF documents for distribution. Assemble multiple pages of a hand-signed contract that was photographed page by page.',
        ],
      },
      {
        heading: 'No upload required',
        paragraphs: [
          'The entire conversion happens in your browser using pdf-lib. Your images are read from your device, assembled into a PDF in browser memory, and saved back to your device. No server is involved at any step.',
          'This is important when converting images that contain sensitive content — medical photos, financial receipts, legal documents, or personal records. The files stay under your control throughout.',
        ],
      },
    ],
  },

  '/pdf-to-image': {
    relatedTools: ['/image-to-pdf', '/compress-pdf', '/crop-image', '/compress-image'],
    sections: [
      {
        heading: 'How PDF-to-image conversion works',
        paragraphs: [
          'Acorn Tools renders PDF pages using Mozilla\'s pdfjs-dist library — the same engine that powers Firefox\'s built-in PDF viewer. Each page is rendered to a canvas at your chosen resolution, then exported as JPEG or PNG.',
          'Higher DPI settings produce sharper images suitable for printing or presentations. Lower DPI settings produce smaller files suitable for web use or thumbnails.',
        ],
      },
      {
        heading: 'When to convert PDFs to images',
        paragraphs: [
          'Extract pages as images for use in presentations, social media posts, or web content where embedding a PDF isn\'t practical. Create thumbnail previews of PDF documents for file management systems or document indexes.',
          'Convert PDF charts, diagrams, or infographics to standalone image files. Extract specific pages from a report to include in emails or messaging apps that don\'t handle PDF attachments well.',
        ],
      },
      {
        heading: 'Local rendering for sensitive documents',
        paragraphs: [
          'PDF documents often contain confidential information — contracts, financial reports, medical records. Converting them to images through an online tool means the entire document content is uploaded to a third-party server.',
          'Browser-based conversion keeps your PDF on your device. The rendering engine runs locally, and the resulting images are saved directly to your downloads. Particularly important for documents bound by NDAs, HIPAA, or GDPR requirements.',
        ],
      },
    ],
  },

  '/compress-pdf': {
    relatedTools: ['/merge-pdf', '/split-pdf', '/compress-image', '/pdf-toolkit'],
    sections: [
      {
        heading: 'Smart vs. aggressive PDF compression',
        paragraphs: [
          'Smart compression (default) targets embedded images inside the PDF — it finds each image, re-encodes it at an optimal quality level guided by SSIM perceptual measurement, and replaces the original. Text, fonts, and vector graphics are preserved exactly. Text remains selectable and searchable.',
          'Aggressive compression rasterizes every page and re-encodes as JPEG. This produces smaller files but converts text to image pixels, losing selectability and searchability. Use aggressive mode for scan-heavy documents where text selectability isn\'t needed.',
        ],
      },
      {
        heading: 'When to compress PDFs',
        paragraphs: [
          'Reduce file size before emailing documents that exceed attachment limits. Compress PDFs before uploading to court e-filing systems, client portals, or document management systems with size restrictions.',
          'Optimize scan-heavy PDFs (medical records, signed contracts, receipts) that are often 10–50MB due to high-resolution embedded images. Smart compression typically achieves 40–70% reduction on image-heavy PDFs without visible quality loss.',
        ],
      },
      {
        heading: 'Why compress PDFs without uploading',
        paragraphs: [
          'PDFs frequently contain contracts, financial statements, medical records, legal filings, and other confidential material. Uploading them to an online compression tool sends the entire document to a third-party server — even if "only for processing."',
          'Acorn Tools compresses PDFs entirely in your browser. The SSIM-guided quality optimization runs locally using MozJPEG WebAssembly. Your document never exists anywhere but your device. This is not just a privacy preference — for HIPAA, GDPR, and SOX-regulated documents, it can be a compliance requirement.',
        ],
      },
    ],
  },

  '/pdf-toolkit': {
    relatedTools: ['/merge-pdf', '/split-pdf', '/compress-pdf', '/watermark-pdf'],
    sections: [
      {
        heading: 'All-in-one PDF processing',
        paragraphs: [
          'The PDF Toolkit combines five essential operations: merge multiple PDFs, split by page range, rotate pages, add text watermarks, and insert page numbers. Switch between modes without leaving the page or re-uploading your document.',
          'All operations use pdf-lib running in your browser. No server processing, no file uploads, no account required.',
        ],
      },
      {
        heading: 'Common PDF workflows',
        paragraphs: [
          'Merge a cover letter with a resume into a single application PDF. Split a large report into chapter files for distribution. Rotate scanned pages that came through the scanner sideways. Add "CONFIDENTIAL" or "DRAFT" watermarks before sharing internal documents.',
          'Insert page numbers before printing or binding a multi-document package. These are everyday tasks that previously required desktop software like Adobe Acrobat — now they run directly in your browser.',
        ],
      },
      {
        heading: 'Works offline with no software to install',
        paragraphs: [
          'Once the page loads, every tool works without an internet connection. This makes it ideal for use on locked-down corporate machines where installing software requires IT approval, or in air-gapped environments where network access is restricted.',
          'Since all processing is local, the toolkit is safe to use with confidential, privileged, or regulated documents without introducing third-party data processing risks.',
        ],
      },
    ],
  },

  '/merge-pdf': {
    relatedTools: ['/split-pdf', '/compress-pdf', '/pdf-pages', '/pdf-toolkit'],
    sections: [
      {
        heading: 'How PDF merging works in the browser',
        paragraphs: [
          'Acorn Tools uses pdf-lib to combine multiple PDF files into a single document. Pages are copied directly from the source files without any re-encoding — text, images, fonts, and formatting are preserved exactly as they appear in the originals.',
          'Drag and drop files to set the order, then export. There\'s no artificial limit on the number of files — you can merge as many as your device\'s memory allows.',
        ],
      },
      {
        heading: 'When to merge PDFs',
        paragraphs: [
          'Combine a cover letter, resume, and references into a single application document. Merge invoices into a monthly bundle for accounting. Assemble legal exhibits, declarations, and supporting documents into a unified court filing.',
          'Package multiple contracts or agreements into one file for a deal room. Combine scanned pages from different scanning sessions into a complete document.',
        ],
      },
      {
        heading: 'Merge confidential documents safely',
        paragraphs: [
          'When you merge PDFs through most online tools, every document in the merge is uploaded to a third-party server. If any of those documents contain confidential information — client data, financial figures, PHI, privileged communications — that\'s an unauthorized disclosure.',
          'Browser-based merging eliminates this risk entirely. All files are read locally, combined in browser memory, and the merged result is saved to your device. No document ever leaves your control. For law firms, healthcare organizations, and finance teams, this is the difference between compliance and exposure.',
        ],
      },
    ],
  },

  '/split-pdf': {
    relatedTools: ['/merge-pdf', '/pdf-pages', '/compress-pdf', '/pdf-toolkit'],
    sections: [
      {
        heading: 'How PDF splitting works',
        paragraphs: [
          'Enter a page range (e.g., 1-3, 5, 8-12) and Acorn Tools extracts those pages into a new PDF. Pages are copied directly from the original without re-encoding, so quality is identical to the source.',
          'Split a large document into chapters, extract a signature page, or pull specific pages from a report — all without uploading the document to any server.',
        ],
      },
      {
        heading: 'Common reasons to split a PDF',
        paragraphs: [
          'Extract specific pages from a report to share only relevant sections with different recipients. Pull a signature page from a contract without sharing the full agreement. Split a large PDF into smaller files that fit within email attachment limits.',
          'Separate a multi-chapter document into individual files for distribution. Extract an exhibit or appendix from a legal filing.',
        ],
      },
      {
        heading: 'Split sensitive documents locally',
        paragraphs: [
          'Splitting often involves documents where you specifically want to limit what gets shared — pulling a few pages out of a larger confidential document. Uploading the full document to an online splitting tool defeats the purpose.',
          'With Acorn Tools, the original document stays on your device. Only the pages you select end up in the exported file. The full document is never transmitted anywhere.',
        ],
      },
    ],
  },

  '/rotate-pdf': {
    relatedTools: ['/pdf-pages', '/pdf-toolkit', '/split-pdf', '/compress-pdf'],
    sections: [
      {
        heading: 'How PDF rotation works',
        paragraphs: [
          'Rotate pages by 90° (clockwise), 180°, or 270° (counter-clockwise). You can rotate all pages at once or individual pages independently. Rotation is applied via pdf-lib by modifying the page rotation attribute — no re-rendering or quality loss.',
          'The rotated PDF preserves all original content: text remains selectable, links remain clickable, and images maintain their quality.',
        ],
      },
      {
        heading: 'When to rotate PDF pages',
        paragraphs: [
          'Fix landscape-scanned documents that display sideways. Correct upside-down pages from double-sided scanning. Standardize page orientation in a document assembled from multiple sources.',
          'Rotate architectural drawings, spreadsheets, or wide tables from portrait to landscape for better readability. Fix phone-scanned documents that were captured in the wrong orientation.',
        ],
      },
      {
        heading: 'Quick fix without leaving your browser',
        paragraphs: [
          'No software to download, no account to create. Drop your PDF, rotate the pages, and download the corrected file. The entire operation takes seconds and runs completely on your device.',
        ],
      },
    ],
  },

  '/watermark-pdf': {
    relatedTools: ['/pdf-toolkit', '/pdf-page-numbers', '/compress-pdf', '/merge-pdf'],
    sections: [
      {
        heading: 'How PDF watermarking works',
        paragraphs: [
          'Acorn Tools draws text watermarks directly onto each page using pdf-lib. You control the text, font size, opacity, rotation angle, color, and position. The watermark is applied consistently across every page.',
          'Watermarks are embedded in the PDF structure — they appear in all viewers and in print. They are not easily removable overlays.',
        ],
      },
      {
        heading: 'When to watermark PDFs',
        paragraphs: [
          'Mark documents as "CONFIDENTIAL," "DRAFT," or "FOR REVIEW ONLY" before sharing with external parties. Add your company name or copyright notice to proposals and reports. Mark pre-release documents to discourage unauthorized distribution.',
          'Watermark legal documents, architectural drawings, or financial reports to indicate their status. Add "SAMPLE" or "NOT FOR DISTRIBUTION" to sensitive previews shared during negotiations.',
        ],
      },
      {
        heading: 'Add watermarks without a server',
        paragraphs: [
          'Watermarking often applies to your most sensitive documents — draft contracts, confidential reports, pre-release financials. These are exactly the files that should not be uploaded to a third-party service. Acorn Tools applies watermarks entirely in your browser.',
        ],
      },
    ],
  },

  '/pdf-page-numbers': {
    relatedTools: ['/watermark-pdf', '/merge-pdf', '/pdf-toolkit', '/pdf-pages'],
    sections: [
      {
        heading: 'How page numbering works',
        paragraphs: [
          'Acorn Tools draws page numbers directly onto each page using pdf-lib. Choose top or bottom placement, left/center/right alignment, and set a custom starting number. The numbers are embedded in the PDF and appear in all viewers and print output.',
          'The formatting is clean and professional — suitable for court filings, bound reports, and formal submissions.',
        ],
      },
      {
        heading: 'When to add page numbers to PDFs',
        paragraphs: [
          'Number pages before printing and binding a multi-document package. Add page references for court filings, legal exhibits, or academic submissions where page citations are needed.',
          'Number merged documents that lost their original page numbering. Add sequential page numbers to a collection of scanned documents that need to be referenced by page.',
        ],
      },
      {
        heading: 'Process in your browser',
        paragraphs: [
          'Like all Acorn Tools, page numbering runs entirely in your browser. Your PDF stays on your device throughout. No upload, no account, no server processing.',
        ],
      },
    ],
  },

  '/redact-pdf': {
    relatedTools: ['/strip-metadata', '/compress-pdf', '/merge-pdf', '/split-pdf'],
    sections: [
      {
        heading: 'True redaction vs. visual covering',
        paragraphs: [
          'Many "redaction" tools simply draw a black rectangle over text — the original content is still in the PDF and can be extracted by selecting, copying, or using command-line PDF tools. Acorn Tools performs true redaction: each redacted page is rasterized with the redaction rectangles burned in, permanently destroying the content underneath.',
          'The redacted text cannot be recovered, selected, or extracted by any means. Unredacted pages are copied verbatim from the original without any quality loss or re-rendering.',
        ],
      },
      {
        heading: 'When true redaction matters',
        paragraphs: [
          'Legal document production: redact privileged, irrelevant, or protected information before producing documents in discovery. Healthcare records: remove PHI from documents shared with third parties or in response to records requests. Government FOIA: redact classified or exempted information from public records.',
          'Financial documents: remove account numbers, SSNs, or other PII before sharing statements. Internal reports: redact proprietary details before sharing summaries with external stakeholders.',
        ],
      },
      {
        heading: 'Why local redaction is essential',
        paragraphs: [
          'Redaction is the one operation where local processing is not just preferable — it\'s critical. The unredacted version of your document is the most sensitive version. Uploading it to a server for redaction means the unredacted content exists on third-party infrastructure, even if only temporarily.',
          'Acorn Tools redacts entirely in your browser. The unredacted document never exists anywhere but your device. For HIPAA, GDPR, legal privilege, and NDA compliance, this is the only architecture that makes sense.',
        ],
      },
    ],
  },

  '/pdf-pages': {
    relatedTools: ['/merge-pdf', '/split-pdf', '/rotate-pdf', '/pdf-toolkit'],
    sections: [
      {
        heading: 'How the page organizer works',
        paragraphs: [
          'Acorn Tools generates visual thumbnails of every page in your PDF using pdfjs-dist. Drag and drop thumbnails to reorder pages, click to select pages for deletion, or add pages from other PDF files.',
          'The visual interface makes it easy to identify and rearrange content without guessing page numbers. Changes are applied when you export the reorganized PDF.',
        ],
      },
      {
        heading: 'When to reorganize PDF pages',
        paragraphs: [
          'Reorder pages in a scanned document that were fed through the scanner out of sequence. Delete blank pages, duplicate pages, or pages that shouldn\'t be included in the final document. Insert cover pages, appendices, or additional exhibits from other PDFs.',
          'Prepare documents for binding by ensuring correct page order. Clean up multi-page scans where some pages need to be removed or rearranged.',
        ],
      },
      {
        heading: 'Visual editing without uploading',
        paragraphs: [
          'All thumbnails are rendered locally using Mozilla\'s PDF rendering engine. Your document stays on your device throughout the editing process. The reorganized PDF is assembled and saved locally.',
          'This is particularly important for document packages that contain a mix of confidential and non-confidential pages — you can see exactly what you\'re reorganizing without sending the content to a server.',
        ],
      },
    ],
  },

};

export { TOOL_CONTENT };
