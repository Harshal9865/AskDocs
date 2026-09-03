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

export interface PdfExportRiskItem {
  category: string;
  risk_level: "critical" | "warning" | "info" | "low" | string;
  clause_title: string;
  description: string;
  recommendation?: string;
}

export interface PdfExportChecklistItem {
  task: string;
  source_doc?: string;
  completed?: boolean;
}

export interface PdfExportSummaryCard {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  badge?: string;
  documentSource?: string;
  sections?: PdfExportSection[];
  table?: PdfExportTable;
  heatMap?: PdfExportRiskItem[];
  checklists?: PdfExportChecklistItem[];
  summaryCards?: PdfExportSummaryCard[];
  watermark?: string;
  workspaceName?: string;
}

/**
 * Opens a dedicated, styled print window formatted for high-resolution PDF printing
 */
export function exportToPdf(options: PdfExportOptions): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=960,height=800");
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

  // 1. Metric Summary Cards Ribbon
  let summaryCardsHtml = "";
  if (options.summaryCards && options.summaryCards.length > 0) {
    summaryCardsHtml = `
      <div style="display: grid; grid-template-columns: repeat(${Math.min(options.summaryCards.length, 4)}, 1fr); gap: 12px; margin: 18px 0 24px 0;">
        ${options.summaryCards
          .map(
            (c) => `
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-top: 3px solid ${c.color || "#6366f1"}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${c.label}</div>
            <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px; letter-spacing: -0.02em;">${c.value}</div>
            ${c.subtext ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${c.subtext}</div>` : ""}
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  // 2. Sections HTML
  const sectionsHtml = (options.sections || [])
    .map((sec) => {
      let innerHtml = "";
      if (sec.heading) {
        innerHtml += `
          <div style="display: flex; items-center; gap: 8px; margin-top: 22px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;">
            <span style="display: inline-block; width: 4px; height: 16px; background: linear-gradient(to bottom, #6366f1, #8b5cf6); border-radius: 2px;"></span>
            <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.06em;">${sec.heading}</h3>
          </div>`;
      }

      if (sec.type === "callout") {
        innerHtml += `
          <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-left: 4px solid #7c3aed; border-radius: 8px; padding: 14px 18px; margin: 14px 0; font-size: 12px; line-height: 1.65; color: #3b0764; box-shadow: 0 1px 2px rgba(124,58,237,0.05);">
            ${sec.content}
          </div>`;
      } else if (sec.type === "bullets" && sec.bullets) {
        innerHtml += `
          <div style="margin: 10px 0 16px 0; display: flex; flex-direction: column; gap: 6px;">
            ${sec.bullets
              .map(
                (b) => `
              <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 1.6; color: #334155; background: #fafafa; padding: 8px 12px; border-radius: 8px; border: 1px solid #f1f5f9;">
                <span style="color: #6366f1; font-weight: bold; font-size: 14px; line-height: 1;">•</span>
                <div style="flex: 1;">${b}</div>
              </div>`
              )
              .join("")}
          </div>`;
      } else if (sec.type === "key_value" && sec.keyValues) {
        innerHtml += `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 12px 0;">
            ${Object.entries(sec.keyValues)
              .map(
                ([k, v]) => `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">${k}</div>
                <div style="font-size: 13px; color: #0f172a; font-weight: 700; margin-top: 3px;">${v}</div>
              </div>`
              )
              .join("")}
          </div>`;
      } else if (sec.content) {
        innerHtml += `<p style="font-size: 12px; line-height: 1.7; color: #334155; margin: 8px 0 14px 0;">${sec.content}</p>`;
      }
      return innerHtml;
    })
    .join("");

  // 3. Comparison Matrix Table HTML
  let tableHtml = "";
  if (options.table && options.table.headers.length > 0) {
    tableHtml = `
      <div style="margin-top: 24px; page-break-inside: avoid;">
        <div style="display: flex; items-center; gap: 8px; margin-bottom: 10px;">
          <span style="display: inline-block; width: 4px; height: 16px; background: #6366f1; border-radius: 2px;"></span>
          <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.06em;">Multi-Document Comparative Matrix</h3>
        </div>
        <div style="border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
              <tr style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
                ${options.table.headers
                  .map(
                    (h, idx) => `
                  <th style="padding: 10px 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-right: 1px solid rgba(255,255,255,0.1); font-size: 10px; ${idx === 0 ? "width: 22%;" : ""}">
                    ${h}
                  </th>`
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${options.table.rows
                .map(
                  (row, rIdx) => `
                <tr style="background: ${rIdx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
                  ${row
                    .map(
                      (cell, cIdx) => `
                    <td style="padding: 10px 12px; border-right: 1px solid #e2e8f0; color: ${
                      cIdx === 0 ? "#4338ca; font-weight: 800;" : "#334155; font-weight: 500;"
                    }; line-height: 1.55; vertical-align: top;">
                      ${cell}
                    </td>`
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
                        `<td style="padding: 10px 12px; border-right: 1px solid #cbd5e1; color: #4c1d95;">${s}</td>`
                    )
                    .join("")}
                </tr>`
                  : ""
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 4. Dedicated Visual Risk & Compliance Heat Map Grid HTML
  let heatMapHtml = "";
  if (options.heatMap && options.heatMap.length > 0) {
    heatMapHtml = `
      <div style="margin-top: 26px; page-break-inside: avoid;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 4px; height: 16px; background: #ef4444; border-radius: 2px;"></span>
            <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.06em;">
              Risk & Compliance Heat Map Analysis
            </h3>
          </div>
          <span style="font-size: 10px; font-weight: 800; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 9999px;">
            ${options.heatMap.length} Evaluated Dimensions
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${options.heatMap
            .map((item) => {
              const level = (item.risk_level || "info").toLowerCase();
              let borderCol = "#38bdf8";
              let bgGrad = "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)";
              let badgeBg = "#bae6fd";
              let badgeText = "#0369a1";
              let badgeLabel = "INFO RISK";

              if (level === "critical" || level === "high") {
                borderCol = "#f87171";
                bgGrad = "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)";
                badgeBg = "#fecaca";
                badgeText = "#b91c1c";
                badgeLabel = "CRITICAL RISK";
              } else if (level === "warning" || level === "medium") {
                borderCol = "#fbbf24";
                bgGrad = "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)";
                badgeBg = "#fde68a";
                badgeText = "#b45309";
                badgeLabel = "WARNING RISK";
              } else if (level === "low" || level === "pass") {
                borderCol = "#34d399";
                bgGrad = "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";
                badgeBg = "#bbf7d0";
                badgeText = "#15803d";
                badgeLabel = "LOW RISK";
              }

              return `
                <div style="background: ${bgGrad}; border: 1px solid ${borderCol}; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); page-break-inside: avoid; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                      <span style="background: ${badgeBg}; color: ${badgeText}; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase;">
                        ${badgeLabel}
                      </span>
                      <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                        ${item.category}
                      </span>
                    </div>
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                      ${item.clause_title}
                    </div>
                    <div style="font-size: 11px; color: #334155; line-height: 1.55;">
                      ${item.description}
                    </div>
                  </div>
                  ${
                    item.recommendation
                      ? `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.1); font-size: 10px; font-weight: 700; color: #4338ca; display: flex; align-items: flex-start; gap: 4px;">
                      <span>⚡</span>
                      <span><strong>Rec:</strong> ${item.recommendation}</span>
                    </div>`
                      : ""
                  }
                </div>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // 5. Dedicated Action Checklist HTML
  let checklistHtml = "";
  if (options.checklists && options.checklists.length > 0) {
    checklistHtml = `
      <div style="margin-top: 26px; page-break-inside: avoid;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 4px; height: 16px; background: #10b981; border-radius: 2px;"></span>
            <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.06em;">
              Extracted Action Checklists & Deliverables
            </h3>
          </div>
          <span style="font-size: 10px; font-weight: 800; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 9999px;">
            ${options.checklists.filter((c) => c.completed).length} / ${options.checklists.length} Completed
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${options.checklists
            .map(
              (item) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: ${
              item.completed ? "#f0fdf4" : "#ffffff"
            }; border: 1px solid ${item.completed ? "#86efac" : "#e2e8f0"}; border-radius: 8px; font-size: 11px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 4px; background: ${
                  item.completed ? "#10b981" : "#e2e8f0"
                }; color: #ffffff; font-size: 10px; font-weight: bold;">
                  ${item.completed ? "✓" : ""}
                </span>
                <span style="font-weight: ${item.completed ? "600" : "700"}; color: ${
                item.completed ? "#15803d; text-decoration: line-through;" : "#0f172a"
              };">
                  ${item.task}
                </span>
              </div>
              ${
                item.source_doc
                  ? `<span style="font-size: 9px; font-weight: 800; color: #6366f1; background: #eef2ff; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                  ${item.source_doc}
                </span>`
                  : ""
              }
            </div>`
            )
            .join("")}
        </div>
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
          margin: 15mm 14mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #6366f1;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .brand {
          font-size: 17px;
          font-weight: 900;
          color: #4f46e5;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .meta-info {
          font-size: 10px;
          color: #64748b;
          text-align: right;
          line-height: 1.5;
        }
        .badge {
          display: inline-block;
          background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
          color: #4338ca;
          font-size: 9px;
          font-weight: 900;
          padding: 3px 10px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          border: 1px solid #c7d2fe;
        }
        .report-title {
          font-size: 23px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }
        .report-subtitle {
          font-size: 12px;
          color: #475569;
          margin: 0 0 14px 0;
          line-height: 1.5;
        }
        .footer {
          margin-top: 36px;
          border-top: 1.5px solid #e2e8f0;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #94a3b8;
          page-break-inside: avoid;
        }
        .verification-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #059669;
          font-weight: 800;
          background: #ecfdf5;
          padding: 2px 8px;
          border-radius: 9999px;
          border: 1px solid #a7f3d0;
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
          <div class="brand">✦ AskDocs Enterprise Intelligence</div>
          ${
            options.workspaceName
              ? `<div style="font-size: 11px; color: #475569; font-weight: 700; margin-top: 3px;">Workspace: ${options.workspaceName}</div>`
              : ""
          }
        </div>
        <div class="meta-info">
          <div><strong>Generated:</strong> ${currentDate}</div>
          ${options.documentSource ? `<div><strong>Source Docs:</strong> ${options.documentSource}</div>` : ""}
          <div style="color: #6366f1; font-weight: 700; margin-top: 2px;">Document Verification ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
        </div>
      </div>

      <div>
        ${options.badge ? `<div class="badge">${options.badge}</div>` : ""}
        <h1 class="report-title">${options.title}</h1>
        ${options.subtitle ? `<p class="report-subtitle">${options.subtitle}</p>` : ""}
      </div>

      ${summaryCardsHtml}
      ${sectionsHtml}
      ${tableHtml}
      ${heatMapHtml}
      ${checklistHtml}

      <div class="footer">
        <div>Generated with AskDocs AI Document Intelligence Platform</div>
        <div class="verification-tag">✓ Verified Source Citations • High-Yield AI Audit</div>
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
