import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function AcknowledgedReceipt() {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    employee_name: "",
    department: "",
    position: "",
    hostname: "",
    serial_number: "",
    brand: "",
    asset_type: "",
    condition: "",
    accessories: "",
    remarks: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handlePrint = () => window.print();

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
      <div className="no-print mb-4">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="w-4 h-4 mr-2" /> Print Form
        </Button>
      </div>

      <div className="print-area bg-white p-8 rounded-xl border border-border max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">ACKNOWLEDGED RECEIPT</h1>
          <p className="text-xs text-muted-foreground mt-1">
            IT Equipment Assignment Form
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {field("Date", "date", "date")}
          {field("Employee Name", "employee_name")}
          {field("Department", "department")}
          {field("Position", "position")}
        </div>

        <div className="border-t border-border pt-4 mb-4">
          <h3 className="text-sm font-bold mb-3">Equipment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {field("Asset Type", "asset_type")}
            {field("Hostname", "hostname")}
            {field("Serial Number", "serial_number")}
            {field("Brand", "brand")}
            {field("Condition", "condition")}
            {field("Accessories", "accessories")}
          </div>
        </div>

        <div className="mb-6">{field("Remarks", "remarks")}</div>

        <div className="border-t border-border pt-8 mt-8">
          <p className="text-xs text-muted-foreground mb-8">
            I hereby acknowledge receipt of the above-described equipment. I agree
            to take full responsibility for its proper care and use, and to return it
            in good condition upon request or upon separation from the company.
          </p>

          <div className="grid grid-cols-2 gap-12">
            <div className="text-center">
              <div className="border-b border-foreground mb-1 h-8" />
              <p className="text-xs font-medium">Received By (Employee)</p>
              <p className="text-[10px] text-muted-foreground">
                Signature over printed name / Date
              </p>
            </div>

            <div className="text-center">
              <div className="border-b border-foreground mb-1 h-8" />
              <p className="text-xs font-medium">Issued By (IT Department)</p>
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