import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";

export default function ExcelImport({ onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Send to backend
        const response = await fetch("http://localhost:3001/api/assets/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assets: jsonData }),
        });

        const result = await response.json();

        if (response.ok) {
          setMessage(`✅ Successfully imported ${result.imported} assets!`);
          onSuccess?.(); // Refresh dashboard
        } else {
          setMessage(`❌ Error: ${result.error}`);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setMessage("❌ Failed to process Excel file");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
      <h3 className="font-medium mb-1">Import from Excel</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload your Excel file to bulk add assets
      </p>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
        id="excel-upload"
      />
      
      <Button asChild disabled={uploading}>
        <label htmlFor="excel-upload" className="cursor-pointer">
          {uploading ? "Processing..." : "Choose Excel File"}
        </label>
      </Button>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.includes("✅") ? "✅" : <AlertCircle className="h-4 w-4" />}
          {message}
        </div>
      )}
    </div>
  );
}