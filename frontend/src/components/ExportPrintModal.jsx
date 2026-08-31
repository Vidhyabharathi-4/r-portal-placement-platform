import React, { useState } from 'react';
import { Download, Printer, FileSpreadsheet, FileText, CheckSquare, Square, X, Settings2 } from 'lucide-react';
import { exportToCSV, exportToXLSX, printDataTable } from '../utils/exportPrint';

export default function ExportPrintModal({
  isOpen,
  onClose,
  title = 'Export & Print Data',
  subtitle = 'College Placement Operations',
  filename = 'data_export',
  columns = [],
  data = [],
  filtersSummary = '',
}) {
  const [selectedColumns, setSelectedColumns] = useState(() =>
    columns.map((col) => col.key)
  );
  const [orientation, setOrientation] = useState('portrait');
  const [pageSize, setPageSize] = useState('A4');
  const [margin, setMargin] = useState('normal');

  if (!isOpen) return null;

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedColumns(columns.map((c) => c.key));
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const getEffectiveColumns = () => {
    return columns.map((col) => ({
      ...col,
      hidden: !selectedColumns.includes(col.key),
    }));
  };

  const metadata = {
    title,
    filters: filtersSummary,
    generatedAt: new Date().toLocaleString(),
  };

  const handleExportCSV = () => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column.');
      return;
    }
    exportToCSV(filename, getEffectiveColumns(), data, metadata);
    onClose();
  };

  const handleExportXLSX = () => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column.');
      return;
    }
    exportToXLSX(filename, getEffectiveColumns(), data, metadata);
    onClose();
  };

  const handlePrint = () => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column.');
      return;
    }
    printDataTable({
      title,
      subtitle,
      columns: getEffectiveColumns(),
      data,
      filtersSummary,
      orientation,
      pageSize,
      margin,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-export-print" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={20} color="#2563eb" />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{title}</h2>
              <small style={{ color: '#64748b' }}>Configure export columns, format, and print layout</small>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Banner */}
          <div className="export-summary-box">
            <div>
              <strong>Matching Records:</strong> <span className="badge-count">{data.length}</span>
            </div>
            {filtersSummary && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#475569' }}>
                <b>Active Filters:</b> {filtersSummary}
              </div>
            )}
          </div>

          {/* Section: Column Selection */}
          <div className="export-section">
            <div className="export-section-header">
              <label><b>Select Columns to Include ({selectedColumns.length}/{columns.length})</b></label>
              <div className="column-quick-actions">
                <button type="button" className="text-btn" onClick={selectAll}>Select All</button>
                <span>|</span>
                <button type="button" className="text-btn" onClick={deselectAll}>Deselect All</button>
              </div>
            </div>

            <div className="columns-grid">
              {columns.map((col) => {
                const isChecked = selectedColumns.includes(col.key);
                return (
                  <label key={col.key} className={`column-checkbox-card ${isChecked ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: Print & Layout Settings */}
          <div className="export-section">
            <label><b>Print & Layout Configuration</b></label>
            <div className="form-row three-col" style={{ marginTop: '8px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px' }}>Orientation</label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px' }}>Paper Size</label>
                <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="letter">Letter (8.5 x 11 in)</option>
                  <option value="legal">Legal (8.5 x 14 in)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px' }}>Page Margins</label>
                <select value={margin} onChange={(e) => setMargin(e.target.value)}>
                  <option value="compact">Compact (8mm)</option>
                  <option value="normal">Normal (15mm)</option>
                  <option value="wide">Wide (25mm)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer export-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <div className="export-actions-group">
            <button type="button" className="export-action-btn csv-btn" onClick={handleExportCSV}>
              <FileText size={16} />
              CSV
            </button>
            <button type="button" className="export-action-btn xlsx-btn" onClick={handleExportXLSX}>
              <FileSpreadsheet size={16} />
              XLSX
            </button>
            <button type="button" className="primary-button print-btn" onClick={handlePrint}>
              <Printer size={16} />
              Print / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
