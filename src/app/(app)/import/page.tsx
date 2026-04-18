"use client";
import { useState, useRef } from "react";
import TopBar from "@/components/layout/TopBar";
import { projects } from "@/lib/data";
import { cn } from "@/lib/utils";
import { FileUp, Download, CheckCircle2, AlertCircle, X, Table, FileSpreadsheet, Info } from "lucide-react";
import * as XLSX from "xlsx";

type ImportRow = {
  date: string;
  project: string;
  planned: number;
  actual: number;
  gridAvailability: number;
  spillHours: number;
  discharge: number;
  status: "valid" | "error";
  error?: string;
};

const EXPECTED_HEADERS = ["date", "project", "planned_mwh", "actual_mwh", "grid_availability", "spill_hours", "discharge_m3s"];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["date", "project", "planned_mwh", "actual_mwh", "grid_availability", "spill_hours", "discharge_m3s"],
    ["2026-04-01", "Upper Seti Hydropower", 612.0, 585.5, 98.2, 0, 22.4],
    ["2026-04-01", "Solu Khola Hydropower", 1248.0, 1198.0, 99.1, 0, 41.2],
    ["2026-04-02", "Upper Seti Hydropower", 612.0, 601.2, 100.0, 0, 23.1],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Generation Data");
  XLSX.writeFile(wb, "hydrotrack_template.xlsx");
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseFile(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (raw.length < 2) {
          alert("File appears empty. Please check the format.");
          return;
        }

        const headers = (raw[0] as string[]).map(h => String(h).toLowerCase().trim().replace(/\s+/g, "_"));
        const dataRows = raw.slice(1).filter((r) => r.some(c => c !== "" && c !== null && c !== undefined));

        const parsed: ImportRow[] = dataRows.map((row) => {
          const get = (key: string) => {
            const idx = headers.indexOf(key);
            return idx >= 0 ? row[idx] : undefined;
          };

          const dateVal = get("date");
          const projectVal = String(get("project") ?? "");
          const plannedVal = Number(get("planned_mwh") ?? 0);
          const actualVal = Number(get("actual_mwh") ?? 0);
          const gridVal = Number(get("grid_availability") ?? 100);
          const spillVal = Number(get("spill_hours") ?? 0);
          const dischargeVal = Number(get("discharge_m3s") ?? 0);

          // Validate
          const errors: string[] = [];
          if (!dateVal) errors.push("Missing date");
          if (!projectVal) errors.push("Missing project name");
          if (isNaN(plannedVal) || plannedVal < 0) errors.push("Invalid planned MWh");
          if (isNaN(actualVal) || actualVal < 0) errors.push("Invalid actual MWh");

          // Normalize date
          let dateStr = "";
          if (dateVal) {
            if (typeof dateVal === "number") {
              // Excel serial date
              const d = XLSX.SSF.parse_date_code(dateVal);
              dateStr = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
            } else {
              dateStr = String(dateVal);
            }
          }

          return {
            date: dateStr,
            project: projectVal,
            planned: plannedVal,
            actual: actualVal,
            gridAvailability: gridVal,
            spillHours: spillVal,
            discharge: dischargeVal,
            status: errors.length === 0 ? "valid" : "error",
            error: errors.join("; "),
          };
        });

        setRows(parsed);
        setStep("preview");
      } catch {
        alert("Failed to parse file. Please ensure it is a valid .xlsx or .csv file.");
      }
    };
    reader.readAsArrayBuffer(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  }

  const validRows = rows.filter(r => r.status === "valid");
  const errorRows = rows.filter(r => r.status === "error");

  return (
    <div className="min-h-screen">
      <TopBar title="Import Data" />
      <div className="p-4 lg:p-6 space-y-5 animate-fade-in max-w-5xl">

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {["upload", "preview", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border",
                step === s ? "bg-blue-500 border-blue-500 text-white" :
                  (["upload", "preview", "done"].indexOf(step) > i)
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-[#162035] border-[#1e3a5f] text-gray-500"
              )}>
                {(["upload", "preview", "done"].indexOf(step) > i) ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium capitalize hidden sm:block",
                step === s ? "text-white" : "text-gray-500"
              )}>{s}</span>
              {i < 2 && <div className="w-6 h-px bg-[#1e3a5f]" />}
            </div>
          ))}
        </div>

        {/* Upload step */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-[#1e3a5f] hover:border-blue-500/40 hover:bg-blue-500/5"
              )}
            >
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-white font-semibold mb-1">Drop your Excel or CSV file here</p>
              <p className="text-sm text-gray-500 mb-4">Supports .xlsx, .xls, and .csv formats</p>
              <span className="btn-secondary text-sm text-blue-400 px-4 py-2 rounded-xl inline-flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Browse File
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) parseFile(e.target.files[0]); }}
              />
            </div>

            {/* Template download */}
            <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Use our template for best results</p>
                <p className="text-xs text-gray-400">
                  Download the Excel template with the correct column headers. Works with NEA standard generation formats.
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="btn-secondary text-xs text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Template
              </button>
            </div>

            {/* Supported columns */}
            <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-400" />
                Expected Column Headers
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {EXPECTED_HEADERS.map(h => (
                  <div key={h} className="bg-[#162035] rounded-lg px-3 py-1.5">
                    <code className="text-xs text-cyan-400">{h}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview step */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{rows.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Rows</p>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{validRows.length}</p>
                <p className="text-xs text-gray-500 mt-1">Valid</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{errorRows.length}</p>
                <p className="text-xs text-gray-500 mt-1">Errors</p>
              </div>
            </div>

            {/* File info */}
            <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-xl p-3 flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-green-400" />
              <span className="text-sm text-white">{file?.name}</span>
              <span className="text-xs text-gray-500 ml-auto">{file ? (file.size / 1024).toFixed(1) + " KB" : ""}</span>
              <button onClick={() => { setStep("upload"); setRows([]); setFile(null); }}>
                <X className="w-4 h-4 text-gray-500 hover:text-white" />
              </button>
            </div>

            {/* Error rows */}
            {errorRows.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errorRows.length} row(s) have validation errors and will be skipped
                </p>
                <div className="space-y-1">
                  {errorRows.slice(0, 5).map((r, i) => (
                    <p key={i} className="text-xs text-red-300/70">
                      Row {i + 1}: {r.error}
                    </p>
                  ))}
                  {errorRows.length > 5 && (
                    <p className="text-xs text-red-300/50">...and {errorRows.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="bg-[#0f1929] border border-[#1e3a5f] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1e3a5f]">
                <h3 className="text-sm font-medium text-white">Data Preview (first 10 valid rows)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e3a5f]">
                      {["Date", "Project", "Planned (MWh)", "Actual (MWh)", "Grid Avail.", "Spill Hrs", "Discharge"].map(h => (
                        <th key={h} className="text-left text-gray-500 font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-[#1e3a5f]/50 hover:bg-[#162035]">
                        <td className="px-4 py-2.5 text-gray-300">{r.date}</td>
                        <td className="px-4 py-2.5 text-gray-300">{r.project}</td>
                        <td className="px-4 py-2.5 text-gray-400">{r.planned}</td>
                        <td className="px-4 py-2.5 text-white font-medium">{r.actual}</td>
                        <td className="px-4 py-2.5 text-gray-400">{r.gridAvailability}%</td>
                        <td className="px-4 py-2.5 text-gray-400">{r.spillHours}h</td>
                        <td className="px-4 py-2.5 text-gray-400">{r.discharge}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("done")}
                disabled={validRows.length === 0}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Import {validRows.length} Records
              </button>
              <button
                onClick={() => { setStep("upload"); setRows([]); setFile(null); }}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-[#162035] border border-[#1e3a5f]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Done step */}
        {step === "done" && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5 animate-glow">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Import Successful!</h2>
            <p className="text-gray-400 mb-2">
              <span className="text-white font-semibold">{validRows.length} records</span> imported from{" "}
              <span className="text-blue-400">{file?.name}</span>
            </p>
            {errorRows.length > 0 && (
              <p className="text-sm text-amber-400 mb-6">{errorRows.length} rows were skipped due to errors</p>
            )}
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => { setStep("upload"); setRows([]); setFile(null); }}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              >
                Import Another File
              </button>
              <a
                href="/generation"
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
              >
                View Generation Log
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
