import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.mervinautomation.it.com/api";

const FALLBACK_ASSET_TYPES = [
  "Laptop",
  "Desktop",
  "Printer",
  "Monitor",
  "UPS",
  "Router",
  "Switch",
  "Access Point",
  "Scanner",
  "Projector",
  "Tablet",
  "IP Phone",
  "Biometric Device",
  "CCTV",
  "External Drive",
  "Other",
];

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importError, setImportError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [reportType, setReportType] = useState("executive_summary");
  const [assetType, setAssetType] = useState("all");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [limit, setLimit] = useState("all");
  const [customLimit, setCustomLimit] = useState("");

  const [assetTypes, setAssetTypes] = useState(FALLBACK_ASSET_TYPES);
  const [departments, setDepartments] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const selectTriggerClass =
    "h-11 rounded-xl border border-sky-200 bg-white text-slate-900 shadow-sm hover:bg-white focus:ring-2 focus:ring-sky-100";
  const selectContentClass =
    "z-50 rounded-xl border border-sky-200 bg-white text-slate-900 shadow-lg";

  const formatAssetTypeLabel = (type) => {
    const map = {
      LAPTOP: "Laptop",
      DESKTOP: "Desktop",
      PRINTER: "Printer",
      MONITOR: "Monitor",
      UPS: "UPS",
      ROUTER: "Router",
      SWITCH: "Switch",
      "ACCESS POINT": "Access Point",
      SCANNER: "Scanner",
      PROJECTOR: "Projector",
      TABLET: "Tablet",
      "IP PHONE": "IP Phone",
      "BIOMETRIC DEVICE": "Biometric Device",
      CCTV: "CCTV",
      "EXTERNAL DRIVE": "External Drive",
      OTHER: "Other",
    };

    const normalized = String(type || "").trim().toUpperCase();

    return (
      map[normalized] ||
      String(type || "")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  };

  const loadAssetTypes = async () => {
    try {
      setLoadingTypes(true);

      const response = await fetch(`${API_BASE}/assets/types`);
      if (!response.ok) {
        throw new Error(`Failed to load asset types (${response.status})`);
      }

      const result = await response.json();
      setAssetTypes(
        Array.isArray(result) && result.length ? result : FALLBACK_ASSET_TYPES
      );
    } catch (error) {
      console.error("Load asset types error:", error);
      setAssetTypes(FALLBACK_ASSET_TYPES);
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);

      const response = await fetch(`${API_BASE}/assets/departments`);
      if (!response.ok) {
        throw new Error(`Failed to load departments (${response.status})`);
      }

      const result = await response.json();
      setDepartments(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Load departments error:", error);
      toast.error("Failed to load departments");
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    loadAssetTypes();
    loadDepartments();
  }, []);

  const handleImport = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setImporting(true);
  setImportStatus(null);
  setImportError(null);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(`${API_BASE}/assets/import`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        throw new Error("Request timed out. Please check if backend is running.");
      }
      throw new Error("Cannot connect to backend server.");
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get("content-type") || "";
    let result;

    if (contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Unexpected server response: ${text.slice(0, 150)}`);
    }

    if (!response.ok) {
      throw new Error(result.message || result.error || "Import failed");
    }

    const inserted = Number(result.inserted ?? result.count ?? result.imported ?? 0);
    const skipped = Number(result.skipped ?? 0);
    const headerRow = result.headerRow ?? null;
    const errors = Array.isArray(result.errors) ? result.errors : [];

    let successMessage = `Imported ${inserted} asset${inserted === 1 ? "" : "s"}`;

    if (skipped > 0) {
      successMessage += ` • Skipped ${skipped}`;
    }

    if (headerRow) {
      successMessage += ` • Header row: ${headerRow}`;
    }

    setImportStatus(successMessage);

    if (inserted > 0) {
      toast.success(successMessage);
    } else if (skipped > 0) {
      toast.warning(successMessage);
    } else {
      toast.warning("Import finished but no valid rows were inserted.");
    }

    if (errors.length > 0) {
      setImportError(errors.slice(0, 3).join(" | "));
    }

    loadAssetTypes();
    loadDepartments();
  } catch (error) {
    console.error("Import error:", error);
    setImportError(error.message || "Import failed");
    toast.error(error.message || "Import failed");
  } finally {
    setImporting(false);
    e.target.value = "";
  }
};

  const finalLimit = useMemo(() => {
    if (limit === "custom") {
      const parsed = Number(customLimit);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    if (limit === "all") return null;

    const parsed = Number(limit);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [limit, customLimit]);

  const getExportFileName = () => {
    const date = new Date().toISOString().split("T")[0];

    const reportNames = {
      executive_summary: "Executive_Summary_Report",
      full_inventory: "Full_Inventory_Report",
      troubleshooting: "Troubleshooting_Report",
      non_working: "Non_Working_Assets_Report",
    };

    return `${reportNames[reportType] || "IT_Inventory"}_${date}.xlsx`;
  };

  const handleExport = async () => {
  if (limit === "custom" && !finalLimit) {
    toast.error("Please enter a valid custom limit.");
    return;
  }

  setExporting(true);

  try {
    const params = new URLSearchParams();

    params.append("reportType", reportType);
    params.append("assetType", assetType);
    params.append("status", status);
    params.append("department", department);

    if (finalLimit) {
      params.append("limit", String(finalLimit));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(`${API_BASE}/assets/export?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        throw new Error("Export timed out. Please check backend.");
      }
      throw new Error("Cannot connect to backend server.");
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      let errorMessage = `Export failed (${response.status})`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await response.text().catch(() => "");
        if (errorText) errorMessage = errorText;
      }

      throw new Error(errorMessage);
    }

    if (
      !contentType.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
    ) {
      let serverMessage = "Server did not return a valid Excel file.";

      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || serverMessage;
      } catch {
        const text = await response.text().catch(() => "");
        if (text) serverMessage = text.slice(0, 200);
      }

      throw new Error(serverMessage);
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error("Downloaded file is empty.");
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getExportFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Excel report exported successfully");
  } catch (error) {
    console.error("Export error:", error);
    toast.error(error.message || "Export failed");
  } finally {
    setExporting(false);
  }
};

  const reportDescription = {
    executive_summary:
      "Best for managers. Includes Hostname, Asset Type, Serial Number, Custodian, Department, Business Unit, Brand, Status, and Source.",
    full_inventory:
      "Best for backup and auditing. Includes all available asset fields.",
    troubleshooting:
      "Best for IT support. Includes Hostname, Asset Type, Serial Number, Brand, IP / MAC, WLAN, OS Version, Office Version, Processor, RAM, Storage, and Status.",
    non_working:
      "Best for replacement planning. Includes Hostname, Asset Type, Custodian, Department, Brand, Status, and Remarks / Specifications.",
  };

  const summaryText = [
    reportType === "executive_summary"
      ? "Executive Summary"
      : reportType === "full_inventory"
      ? "Full Inventory"
      : reportType === "troubleshooting"
      ? "Troubleshooting"
      : "Non-Working Assets",
    assetType === "all" ? "All assets" : `${formatAssetTypeLabel(assetType)} only`,
    status === "all"
      ? "All status"
      : status === "working"
      ? "Working only"
      : status === "not_working"
      ? "Not working only"
      : status === "inactive"
      ? "Inactive only"
      : status === "redeployment"
      ? "For re-deployment only"
      : "For disposal only",
    department === "all" ? "All departments" : department,
    limit === "all"
      ? "Export all"
      : limit === "custom"
      ? `${customLimit || 0} rows`
      : `First ${limit}`,
  ].join(" • ");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Import & Export</h1>
        <p className="mt-1 text-sm text-slate-600">
          Import asset data from Excel or export inventory reports with dynamic filters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Import from Excel</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Upload Excel or CSV files to import laptops, desktops, printers,
                  UPS, and other supported asset records.
                </p>
              </div>

              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importing}
                />
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700">
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {importing ? "Importing..." : "Choose File & Import"}
                </div>
              </label>

             {importStatus && (
  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
    <CheckCircle className="h-4 w-4 flex-shrink-0" />
    {importStatus}
  </div>
)}

              {importError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Download className="h-5 w-5 text-blue-600" />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Export Reports</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Choose the report type and export filters before downloading your file.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass}>
                      <SelectItem value="executive_summary">Executive Summary</SelectItem>
                      <SelectItem value="full_inventory">Full Inventory Export</SelectItem>
                      <SelectItem value="troubleshooting">Troubleshooting Report</SelectItem>
                      <SelectItem value="non_working">Non-Working Assets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Asset Type</label>
                  <Select value={assetType} onValueChange={setAssetType}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue
                        placeholder={loadingTypes ? "Loading asset types..." : "Select asset type"}
                      />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass}>
                      <SelectItem value="all">All assets</SelectItem>
                      {assetTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatAssetTypeLabel(type)} only
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Export Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass}>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="working">Working only</SelectItem>
                      <SelectItem value="not_working">Not working only</SelectItem>
                      <SelectItem value="inactive">Inactive only</SelectItem>
                      <SelectItem value="redeployment">For re-deployment only</SelectItem>
                      <SelectItem value="disposal">For disposal only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Export Department</label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue
                        placeholder={
                          loadingDepartments
                            ? "Loading departments..."
                            : "Select department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass}>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Export Size</label>
                  <Select value={limit} onValueChange={setLimit}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select export size" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass}>
                      <SelectItem value="all">Export all</SelectItem>
                      <SelectItem value="50">First 50</SelectItem>
                      <SelectItem value="100">First 100</SelectItem>
                      <SelectItem value="500">First 500</SelectItem>
                      <SelectItem value="custom">Custom limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {limit === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Custom Limit</label>
                  <Input
                    type="number"
                    min="1"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                    placeholder="Enter number of rows"
                    className="h-11 rounded-xl border border-sky-200 bg-white text-slate-900 shadow-sm placeholder:text-slate-400"
                  />
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                {reportDescription[reportType]}
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Ready to export: {summaryText}
              </div>

              <Button
                onClick={handleExport}
                disabled={exporting || loadingDepartments}
                className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {exporting ? "Exporting..." : "Export Selected Report"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <FileSpreadsheet className="h-5 w-5 text-slate-600" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">Supported Format</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Upload Excel files (.xlsx, .xls) or CSV files with your inventory data.
              Export reports will follow the filters you selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}