"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";

interface Category { id: string; name_ne: string; name_en: string | null; kind: "income" | "expense"; parent_id: string | null; is_main: boolean }
interface CategoryListProps {
  items: Category[];
  t: Record<string, string>;
  locale: "en" | "ne";
  onEdit: (item: Category) => void;
  onDelete: (id: string) => void;
  userRole?: "user" | "admin" | "super_admin";
  onImportExcel?: (parsedItems: Array<{ kind: "income" | "expense"; mainNe: string; mainEn: string; subNe: string; subEn: string }>) => Promise<void>;
}

export function CategoryList({ items, t, locale, onEdit, onDelete, userRole, onImportExcel }: CategoryListProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [parsedRows, setParsedRows] = useState<Array<{ kind: "income" | "expense"; mainNe: string; mainEn: string; subNe: string; subEn: string }>>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const label = (item: Category) => locale === "ne" ? item.name_ne : (item.name_en || item.name_ne);
  const ActionButtons = ({ item }: { item: Category }) => (
    <span className="category-actions">
      <button type="button" className="action-btn-blue" onClick={() => onEdit(item)} title={t.edit}>✎</button>
      <button type="button" className="action-btn-red" onClick={() => onDelete(item.id)} title={t.remove}>×</button>
    </span>
  );

  const filteredItems = items.filter((item) => item.kind === activeTab);
  const mainItems = filteredItems.filter((item) => item.is_main);
  const subItems = filteredItems.filter((item) => !item.is_main);
  const parentName = (item: Category) => label(items.find((parent) => parent.id === item.parent_id) ?? item);

  // Excel parsing logic
  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
        
        // Parse rows starting from 5th row (index 4)
        const rows = json.slice(4) as Array<Array<unknown>>;
        const list: Array<{ kind: "income" | "expense"; mainNe: string; mainEn: string; subNe: string; subEn: string }> = [];
        
        for (const row of rows) {
          if (!row || row.length < 6) continue;
          const kindInput = String(row[1] ?? "").trim().toLowerCase();
          const kind: "income" | "expense" = kindInput.includes("income") || kindInput.includes("आम्दानी") ? "income" : "expense";
          const mainNe = String(row[2] ?? "").trim();
          const mainEn = String(row[3] ?? "").trim();
          const subNe = String(row[4] ?? "").trim();
          const subEn = String(row[5] ?? "").trim();
          
          if (!mainNe || !mainEn) continue;
          list.push({ kind, mainNe, mainEn, subNe, subEn });
        }
        setParsedRows(list);
      } catch {
        alert(locale === "ne" ? "फाइल पढ्न त्रुटि भयो!" : "Error reading file!");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const executeImport = async () => {
    if (!onImportExcel || parsedRows.length === 0) return;
    setIsImporting(true);
    await onImportExcel(parsedRows);
    setIsImporting(false);
    setParsedRows([]);
    setFileName("");
  };

  return (
    <section className="record-panel category-settings">
      <h2>{t.categories}</h2>
      <p className="category-help">
        {locale === "ne"
          ? "मुख्य श्रेणी र त्यसअन्तर्गतका उप-श्रेणी अलग-अलग व्यवस्थापन गर्नुहोस्।"
          : "Manage main categories and their subcategories separately."}
      </p>

      {/* Super Admin Excel Import Panel */}
      {userRole === "super_admin" && (
        <div className="excel-import-card">
          <div className="excel-import-header">
            <h4>📊 {locale === "ne" ? "Excel बाट क्याटेगोरी आयात गर्नुहोस् (Super Admin Only)" : "Import Categories from Excel (Super Admin Only)"}</h4>
            <p className="excel-import-subtitle">
              {locale === "ne"
                ? "हाम्रो स्ट्यान्डर्ड एक्सेल टेम्प्लेट ढाँचामा क्याटेगोरी र सब-क्याटेगोरीहरू अपलोड गर्नुहोस्।"
                : "Upload main categories and subcategories matching the template format."}
            </p>
          </div>

          <div 
            className={`excel-drag-drop-zone ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="excel-file-input" 
              className="excel-file-input-hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={onFileInputChange} 
            />
            <label htmlFor="excel-file-input" className="excel-upload-label-trigger">
              <span className="excel-upload-icon">📥</span>
              <span className="excel-upload-text">
                {fileName ? fileName : (locale === "ne" ? "फाइल ड्र्याग गर्नुहोस् वा यहाँ थिचेर छान्नुहोस्" : "Drag & drop your Excel file here or browse")}
              </span>
              <span className="excel-upload-hint">(.xlsx, .xls, .csv files only)</span>
            </label>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="excel-preview-container">
              <h5>👀 Preview (Total rows parsed: {parsedRows.length})</h5>
              <div className="excel-preview-scroll">
                <table className="excel-preview-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Main (Nepali)</th>
                      <th>Main (English)</th>
                      <th>Sub (Nepali)</th>
                      <th>Sub (English)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td><span className={`badge-type ${row.kind}`}>{row.kind}</span></td>
                        <td>{row.mainNe}</td>
                        <td>{row.mainEn}</td>
                        <td>{row.subNe || "-"}</td>
                        <td>{row.subEn || "-"}</td>
                      </tr>
                    ))}
                    {parsedRows.length > 5 && (
                      <tr>
                        <td colSpan={5} className="text-center font-semibold text-slate-500">
                          ... and {parsedRows.length - 5} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="excel-preview-actions">
                <button 
                  type="button" 
                  className="text-button" 
                  onClick={() => { setParsedRows([]); setFileName(""); }}
                  disabled={isImporting}
                >
                  {t.cancel}
                </button>
                <button 
                  type="button" 
                  className="primary-button" 
                  onClick={executeImport}
                  disabled={isImporting}
                >
                  {isImporting ? (locale === "ne" ? "आयात गरिँदै..." : "Importing...") : (locale === "ne" ? "आयात सुनिश्चित गर्नुहोस्" : "Proceed Import")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs System (Income vs Expense Separation) */}
      <div className="category-tabs-container">
        <button
          type="button"
          className={`category-tab-btn ${activeTab === "expense" ? "active" : ""}`}
          onClick={() => setActiveTab("expense")}
        >
          📤 {locale === "ne" ? "खर्च वर्गीकरण" : "Expense Categories"}
        </button>
        <button
          type="button"
          className={`category-tab-btn ${activeTab === "income" ? "active" : ""}`}
          onClick={() => setActiveTab("income")}
        >
          📥 {locale === "ne" ? "आम्दानी वर्गीकरण" : "Income Categories"}
        </button>
      </div>

      {/* Categories Grid */}
      <div className="category-settings-grid">
        <section className="category-list-section">
          <h3>
            {locale === "ne" 
              ? (activeTab === "income" ? "मुख्य आम्दानी श्रेणी" : "मुख्य खर्च श्रेणी")
              : (activeTab === "income" ? "Main Income Categories" : "Main Expense Categories")}
          </h3>
          {mainItems.length ? (
            mainItems.map((item) => (
              <article className="category-list-row" key={item.id}>
                <div>
                  <strong>{label(item)}</strong>
                  <small>{item.kind === "income" ? t.income : t.expense}</small>
                </div>
                <ActionButtons item={item} />
              </article>
            ))
          ) : (
            <p className="empty-state">
              {locale === "ne" ? "कुनै मुख्य श्रेणी फेला परेन।" : "No main categories yet."}
            </p>
          )}
        </section>

        <section className="category-list-section">
          <h3>
            {locale === "ne" 
              ? (activeTab === "income" ? "उप-आम्दानी श्रेणी" : "उप-खर्च श्रेणी")
              : (activeTab === "income" ? "Sub Income Categories" : "Sub Expense Categories")}
          </h3>
          {subItems.length ? (
            subItems.map((item) => (
              <article className="category-list-row" key={item.id}>
                <div>
                  <strong>{label(item)}</strong>
                  <small>{parentName(item)} · {item.kind === "income" ? t.income : t.expense}</small>
                </div>
                <ActionButtons item={item} />
              </article>
            ))
          ) : (
            <p className="empty-state">
              {locale === "ne" ? "कुनै उप-श्रेणी फेला परेन।" : "No subcategories yet."}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
