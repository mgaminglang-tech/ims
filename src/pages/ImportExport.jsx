import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:5000/api";

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/assets/import`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Import failed");
      }

      setImportStatus(`Successfully imported ${result.count || 0} assets`);
      toast.success(`Imported ${result.count || 0} assets`);
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus("Import failed");
      toast.error(error.message || "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch(`${API_BASE}/assets/export`);
      if (!response.ok) {
        throw new Error("Failed to export assets");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `IT_Inventory_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      toast.success("Export complete");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-foreground">Import & Export</h1>
        <p className="text-sm text-muted-foreground">
          Import data from Excel or export your inventory
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="bg-foreground text-background px-5 py-3">
          <h2 className="text-sm font-bold tracking-wide">Import from Excel</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your Excel file (.xlsx) to import assets. The system will automatically extract
            Laptops, Desktops, and Printers from your spreadsheet.
          </p>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImport}
                className="hidden"
                disabled={importing}
              />
              <div className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importing ? "Importing..." : "Choose File & Import"}
              </div>
            </label>
          </div>

          {importStatus && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              {importStatus}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="bg-foreground text-background px-5 py-3">
          <h2 className="text-sm font-bold tracking-wide">Export to CSV</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Download all your inventory data as a CSV file that can be opened in Excel.
          </p>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting ? "Exporting..." : "Export All Assets"}
          </Button>
        </div>
      </div>

      <div className="bg-accent/50 rounded-xl border border-border p-5">
        <div className="flex gap-3">
          <FileSpreadsheet className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Supported Format</p>
            <p>
              Upload Excel files (.xlsx, .xls) or CSV files with your asset data.
              The system reads sheets named LAPTOP, DESKTOP, and PRINTER.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}