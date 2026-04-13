import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/assets";

const emptyAsset = {
  record_id: "",
  asset_type: "Laptop",
  hostname: "",
  serial_number: "",
  condition: "ACTIVE",
  custodian: "",
  department: "",
  warranty_end: "",
  business_unit: "",
  brand: "",
  ip_mac_address: "",
  wlan_address: "",
  os_version: "",
  office_version: "",
  office_key: "",
  processor: "",
  ram: "",
  storage: "",
  monitor_info: "",
  ups_info: "",
  status: "WORKING",
};

export default function AssetForm({ asset, onSaved, onCancel }) {
  const [form, setForm] = useState(emptyAsset);
  const [saving, setSaving] = useState(false);

  const isEditing = !!asset?.id || !!asset?.record_id;

  useEffect(() => {
    if (asset) {
      setForm({
        ...emptyAsset,
        ...asset,
        warranty_end: asset.warranty_end 
          ? String(asset.warranty_end).split("T")[0] 
          : "",
      });
    } else {
      setForm(emptyAsset);
    }
  }, [asset]);

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!form.hostname?.trim()) {
      toast.error("Hostname is required");
      return;
    }

    if (!form.asset_type) {
      toast.error("Asset type is required");
      return;
    }

    try {
      setSaving(true);

      const data = { ...form };

      // Clean up fields
      if (!data.warranty_end) data.warranty_end = null;
      delete data.id;
      delete data.created_date;
      delete data.updated_date;
      delete data.created_by;
      delete data.created_at;
      delete data.updated_at;

      const url = isEditing 
        ? `${API_BASE}/${asset.id || asset.record_id}` 
        : API_BASE;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save asset");
      }

      toast.success(isEditing ? "Asset updated successfully" : "Asset created successfully");
      onSaved?.();
    } catch (error) {
      console.error("Save asset error:", error);
      toast.error(error.message || "Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = "text") => (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        type={type}
        value={form[key] || ""}
        onChange={(e) => set(key, e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  );

  const selectField = (label, key, options) => (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Select value={form[key] || ""} onValueChange={(v) => set(key, v)}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">
          {isEditing ? "Edit Asset" : "Add New Asset"}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="hover:text-primary-foreground/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        {field("Record ID", "record_id")}
        {selectField("Asset Type", "asset_type", ["Laptop", "Desktop", "Printer", "Server", "Monitor"])}
        {field("Hostname", "hostname")}
        {field("Serial Number", "serial_number")}
        {selectField("Condition", "condition", ["ACTIVE", "INACTIVE", "FOR DISPOSAL"])}
        {field("Custodian", "custodian")}
        {field("Department", "department")}
        {field("Warranty End", "warranty_end", "date")}
        {field("Business Unit", "business_unit")}
        {field("Brand", "brand")}
        {field("IP / MAC Address", "ip_mac_address")}
        {field("WLAN Address", "wlan_address")}
        {field("OS Version", "os_version")}
        {field("Office Version", "office_version")}
        {field("Office Key", "office_key")}
        {field("Processor", "processor")}
        {field("RAM", "ram")}
        {field("Storage", "storage")}
        {field("Monitor Info", "monitor_info")}
        {field("UPS Info", "ups_info")}
        {selectField("Status", "status", [
          "WORKING",
          "NOT WORKING",
          "DEFECTIVE",
          "FOR RE-DEPLOYMENT",
          "FOR DISPOSAL",
        ])}
      </div>

      <div className="px-6 pb-6 flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : isEditing ? "Update Asset" : "Save Asset"}
        </Button>

        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}