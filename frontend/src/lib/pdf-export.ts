/**
 * AskDocs Universal PDF & Multi-Format Export Engine
 * Generates crisp, high-resolution vector printable PDFs and instant file downloads.
 */

export interface PdfExportSection {
  heading?: string;
  content?: string; // Markdown or plain text
  type?: "paragraph" | "callout" | "bullets" | "key_value";
  bullets?: string[];
  keyValues?: Record<string, string | number>;
}

export interface PdfExportTable {
  headers: string[];
  rows: (string | number)[][];
  summaryRow?: (string | number)[];
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  badge?: string;
  documentSource?: string;
  sections?: PdfExportSection[];
  table?: PdfExportTable;
  watermark?: string;
  workspaceName?: string;
}

/**
 * Opens a dedicated, styled print window formatted for high-resolution PDF printing
 */
export function exportToPdf(options: PdfExportOptions): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=900,height=750");
  if (!printWindow) {
    alert("Please allow popups to generate and download your PDF report.");
    return;
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sectionsHtml = (options.sections || [])
    .map((sec) => {
      let innerHtml = "";
      if (sec.heading) {
        innerHtml += `<h3 style="font-size: 14px; font-weight: 800; color: #1e1b4b; margin-top: 16px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px;">${sec.heading}</h3>`;
      }

      if (sec.type === "callout") {
        innerHtml += `<div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 12px 16px; border-radius: 6px; margin: 12px 0; font-size: 13px; line-height: 1.6; color: #3b0764;">${sec.content}</div>`;
      } else if (sec.type === "bullets" && sec.bullets) {
        innerHtml += `<ul style="margin: 8px 0 14px 20px; padding: 0; font-size: 13px; line-height: 1.7; color: #334155;">
          ${sec.bullets.map((b) => `<li style="margin-bottom: 4px;">${b}</li>`).join("")}
        </ul>`;
      } else if (sec.type === "key_value" && sec.keyValues) {
        innerHtml += `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 12px 0;">
          ${Object.entries(sec.keyValues)
            .map(
              ([k, v]) => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">${k}</div>
              <div style="font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 2px;">${v}</div>
            </div>`
            )
            .join("")}
        </div>`;
      } else if (sec.content) {
        innerHtml += `<p style="font-size: 13px; line-height: 1.65; color: #334155; margin: 8px 0 12px 0;">${sec.content}</p>`;
      }
      return innerHtml;
    })
    .join("");

  let tableHtml = "";
  if (options.table && options.table.headers.length > 0) {
    tableHtml = `
      <div style="margin-top: 20px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background: #1e1b4b; color: #ffffff;">
              ${options.table.headers
                .map(
                  (h) =>
                    `<th style="padding: 10px 12px; border: 1px solid #1e1b4b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${h}</th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${options.table.rows
              .map(
                (row, rIdx) => `
              <tr style="background: ${rIdx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0;">
                ${row
                  .map(
                    (cell, cIdx) =>
                      `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: ${
                        cIdx === 0 ? "#1e1b4b; font-weight: 600;" : "#334155;"
                      }">${cell}</td>`
                  )
                  .join("")}
              </tr>`
              )
              .join("")}
            ${
              options.table.summaryRow
                ? `<tr style="background: #ede9fe; font-weight: 800; border-top: 2px solid #7c3aed;">
                ${options.table.summaryRow
                  .map(
                    (s) =>
                      `<td style="padding: 10px 12px; border: 1px solid #cbd5e1; color: #4c1d95;">${s}</td>`
                  )
                  .join("")}
              </tr>`
                : ""
            }
          </tbody>
        </table>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${options.title} — AskDocs Report</title>
      <style>
        @page {
          size: A4;
          margin: 18mm 16mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background: #ffffff;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #7c3aed;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .brand {
          font-size: 16px;
          font-weight: 900;
          color: #7c3aed;
          letter-spacing: -0.02em;
        }
        .meta-info {
          font-size: 11px;
          color: #64748b;
          text-align: right;
          line-height: 1.4;
        }
        .badge {
          display: inline-block;
          background: #ede9fe;
          color: #6d28d9;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .report-title {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        .report-subtitle {
          font-size: 13px;
          color: #475569;
          margin: 0 0 16px 0;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header-bar">
        <div>
          <div class="brand">✦ AskDocs Intelligence Report</div>
          ${options.workspaceName ? `<div style="font-size: 12px; color: #475569; font-weight: 600; margin-top: 2px;">Workspace: ${options.workspaceName}</div>` : ""}
        </div>
        <div class="meta-info">
          <div>Generated: ${currentDate}</div>
          ${options.documentSource ? `<div>Source: ${options.documentSource}</div>` : ""}
        </div>
      </div>

      <div>
        ${options.badge ? `<div class="badge">${options.badge}</div>` : ""}
        <h1 class="report-title">${options.title}</h1>
        ${options.subtitle ? `<p class="report-subtitle">${options.subtitle}</p>` : ""}
      </div>

      ${sectionsHtml}
      ${tableHtml}

      <div class="footer">
        <div>Generated with AskDocs AI Document Intelligence Platform</div>
        <div>Verified Source Citations • Confidential</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Instant client-side blob downloader for CSV, JSON, Markdown, and TSV
 */
export function downloadBlob(filename: string, content: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
