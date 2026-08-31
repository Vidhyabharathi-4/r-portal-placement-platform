/**
 * Reusable Data Export and Print Utilities for R-PORTAL
 */

export function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function exportToCSV(filename, columns, data, metadata = {}) {
  const activeCols = columns.filter((col) => !col.hidden);
  const headers = activeCols.map((col) => `"${col.label.replace(/"/g, '""')}"`);
  
  const rows = data.map((item, idx) => {
    return activeCols.map((col) => {
      let val = col.accessor ? col.accessor(item, idx) : item[col.key];
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const lines = [];
  if (metadata.title) lines.push(`"# Title: ${metadata.title.replace(/"/g, '""')}"`);
  if (metadata.filters) lines.push(`"# Applied Filters: ${metadata.filters.replace(/"/g, '""')}"`);
  if (metadata.generatedAt) lines.push(`"# Generated At: ${metadata.generatedAt.replace(/"/g, '""')}"`);
  if (lines.length > 0) lines.push('');
  
  lines.push(headers.join(','));
  lines.push(...rows);

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToXLSX(filename, columns, data, metadata = {}) {
  const activeCols = columns.filter((col) => !col.hidden);
  
  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; font-family: sans-serif; font-size: 11pt; }
      td { border: 1px solid #cbd5e1; padding: 6px; font-family: sans-serif; font-size: 10pt; }
      .meta { font-family: sans-serif; font-size: 10pt; color: #475569; }
      .title { font-family: sans-serif; font-size: 14pt; font-weight: bold; color: #0f172a; }
    </style>
  </head>
  <body>
    <table>
      ${metadata.title ? `<tr><td colspan="${activeCols.length}" class="title">${metadata.title}</td></tr>` : ''}
      ${metadata.filters ? `<tr><td colspan="${activeCols.length}" class="meta"><b>Filters:</b> ${metadata.filters}</td></tr>` : ''}
      ${metadata.generatedAt ? `<tr><td colspan="${activeCols.length}" class="meta"><b>Generated:</b> ${metadata.generatedAt}</td></tr>` : ''}
      <tr><td colspan="${activeCols.length}"></td></tr>
      <thead>
        <tr>
          ${activeCols.map((col) => `<th>${col.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map((item, idx) => `
          <tr>
            ${activeCols.map((col) => {
              const val = col.accessor ? col.accessor(item, idx) : item[col.key];
              return `<td>${val !== null && val !== undefined ? String(val) : '—'}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'export'}_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printDataTable({
  title = 'R-PORTAL Report',
  subtitle = 'College Placement Operations',
  columns = [],
  data = [],
  filtersSummary = '',
  orientation = 'portrait',
  pageSize = 'A4',
  margin = 'normal',
}) {
  const activeCols = columns.filter((col) => !col.hidden);
  const timestamp = new Date().toLocaleString();

  const marginMap = {
    compact: '8mm',
    normal: '15mm',
    wide: '25mm',
  };

  const printHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${title} - Print</title>
  <meta charset="utf-8">
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: ${marginMap[margin] || '15mm'};
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 10pt;
      color: #475569;
      margin: 4px 0 0 0;
    }
    .print-meta {
      text-align: right;
      font-size: 9pt;
      color: #64748b;
    }
    .filters-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 9pt;
      color: #334155;
    }
    .filters-box strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .status-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      background: #e2e8f0;
      color: #334155;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <h1 class="brand-title">R-PORTAL</h1>
      <p class="brand-subtitle">${subtitle} &mdash; <b>${title}</b></p>
    </div>
    <div class="print-meta">
      <div><b>Total Records:</b> ${data.length}</div>
      <div><b>Date:</b> ${timestamp}</div>
    </div>
  </div>

  ${filtersSummary ? `
    <div class="filters-box">
      <strong>Active Filter Configuration:</strong> ${filtersSummary}
    </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        ${activeCols.map((col) => `<th>${col.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.length === 0 ? `
        <tr><td colspan="${activeCols.length}" style="text-align: center; padding: 20px; color: #64748b;">No matching records found.</td></tr>
      ` : data.map((item, idx) => `
        <tr>
          ${activeCols.map((col) => {
            const val = col.accessor ? col.accessor(item, idx) : item[col.key];
            return `<td>${val !== null && val !== undefined ? String(val) : '—'}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <span>R-PORTAL College Placement Operations Platform</span>
    <span>Page generated: ${timestamp}</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  } else {
    window.print();
  }
}
