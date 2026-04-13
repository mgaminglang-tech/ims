import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/borrow-records";

export default function BorrowedForm() {
  const [form, setForm] = useState({
    borrower_name: "",
    department: "",
    asset_hostname: "",
    asset_serial: "",
    borrow_date: new Date().toISOString().split("T")[0],
    expected_return_date: "",
    purpose: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handlePrint = () => window.print();

  const handleSave = async () => {
    if (
      !form.borrower_name ||
      !form.asset_hostname ||
      !form.borrow_date ||
      !form.expected_return_date ||
      !form.purpose
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        status: "Borrowed",
      };

      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save borrow record");
      }

      toast.success("Borrow record saved");

      setForm({
        borrower_name: "",
        department: "",
        asset_hostname: "",
        asset_serial: "",
        borrow_date: new Date().toISOString().split("T")[0],
        expected_return_date: "",
        purpose: "",
      });
    } catch (error) {
      console.error("Save borrow record error:", error);
      toast.error(error.message || "Failed to save borrow record");
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = "text") => (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="bg-input h-9 text-sm"
      />
    </div>
  );

  return (
    <div>
      <div className="no-print mb-4 flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Record"}
        </Button>

        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer className="w-4 h-4 mr-2" /> Print Form
        </Button>
      </div>

      <div className="print-area bg-white p-8 rounded-xl border border-border max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">
            EQUIPMENT BORROW FORM
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Temporary Equipment Borrowing Agreement
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {field("Borrower Name *", "borrower_name")}
          {field("Department", "department")}
          {field("Asset Hostname *", "asset_hostname")}
          {field("Serial Number", "asset_serial")}
          {field("Borrow Date *", "borrow_date", "date")}
          {field("Expected Return Date *", "expected_return_date", "date")}
        </div>

        <div className="space-y-1 mb-6">
          <Label className="text-xs font-medium">Purpose *</Label>
          <Textarea
            value={form.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            placeholder="Describe the purpose of borrowing..."
            className="bg-input text-sm"
            rows={3}
          />
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <p className="text-xs text-muted-foreground mb-8">
            I agree to return the borrowed equipment on or before the expected
            return date in its original working condition. I accept full
            responsibility for any damage or loss that may occur while the
            equipment is in my possession.
          </p>
          <div className="grid grid-cols-2 gap-12">
            <div className="text-center">
              <div className="border-b border-foreground mb-1 h-8" />
              <p className="text-xs font-medium">Borrower</p>
              <p className="text-[10px] text-muted-foreground">
                Signature over printed name / Date
              </p>
            </div>
            <div className="text-center">
              <div className="border-b border-foreground mb-1 h-8" />
              <p className="text-xs font-medium">Approved By (IT)</p>
              <p className="text-[10px] text-muted-foreground">
                Signature over printed name / Date
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}