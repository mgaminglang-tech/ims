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
import { Save, X, Package2, Info, MonitorSmartphone, Cpu } from "lucide-react";
import { toast } from "sonner";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/assets`;

const normalizeAssetTypeLabel = (value) => {
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

  const normalized = String(value || "").trim().toUpperCase();
  return map[normalized] || value || "Laptop";
};

const assetTypeOptions = [
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

const specTemplates = {
  Printer: {
    printer_type: "",
    ip_address: "",
    toner_model: "",
    page_count: "",
    connection_type: "",
  },
  Monitor: {
    screen_size: "",
    resolution: "",
    panel_type: "",
    ports: "",
  },
  UPS: {
    capacity: "",
    battery_type: "",
    runtime: "",
    connected_device: "",
  },
  Router: {
    ip_address: "",
    mac_address: "",
    firmware_version: "",
    location: "",
    notes: "",
  },
  Switch: {
    ip_address: "",
    mac_address: "",
    firmware_version: "",
    ports: "",
    location: "",
  },
  "Access Point": {
    ip_address: "",
    mac_address: "",
    firmware_version: "",
    location: "",
    notes: "",
  },
  Scanner: {
    scanner_type: "",
    connection_type: "",
    location: "",
  },
  Projector: {
    resolution: "",
    lumens: "",
    connection_type: "",
    location: "",
  },
  Tablet: {
    os_version: "",
    storage: "",
    ip_address: "",
    assigned_to: "",
  },
  "IP Phone": {
    ip_address: "",
    mac_address: "",
    firmware_version: "",
    extension_number: "",
  },
  "Biometric Device": {
    ip_address: "",
    mac_address: "",
    firmware_version: "",
    location: "",
    software_linked: "",
  },
  CCTV: {
    ip_address: "",
    resolution: "",
    camera_type: "",
    location: "",
    nvr_linked: "",
  },
  "External Drive": {
    capacity: "",
    interface: "",
    assigned_to: "",
    encryption_status: "",
  },
  Other: {
    details: "",
  },
};

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
  specifications: {},
};

const computerTypes = ["Laptop", "Desktop"];

const departmentOptions = [
  "Operation",
  "OPM",
  "Maintenance - Planning",
  "Maintenance - Mechanical",
  "Maintenance - I & C",
  "IT",
  "HR",
  "Finance",
  "Logistics",
  "Safety",
  "Materials Handling",
  "Water treatment",
  "Technical Services Department",
  "Procurement",
  "Warehouse",
];

const requiredLabels = {
  hostname: "Hostname",
  business_unit: "Business Unit",
  department: "Department",
  serial_number: "Serial Number",
  brand: "Brand",
  condition: "Condition",
  status: "Status",
};

export default function AssetForm({ asset, onSaved, onCancel }) {
  const [form, setForm] = useState(emptyAsset);
  const [saving, setSaving] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  const isEditing = !!asset?.id || !!asset?.record_id;
  const isComputerType = computerTypes.includes(form.asset_type);
  const isPrinterType = form.asset_type === "Printer";

  const getRequiredFields = (assetType) => {
    const common = [
      "hostname",
      "department",
      "serial_number",
      "brand",
      "condition",
      "status",
    ];

    if (assetType !== "Printer") {
      common.splice(1, 0, "business_unit");
    }

    return common;
  };

  useEffect(() => {
    const loadNextRecordId = async (assetType = "Laptop") => {
      if (assetType === "Printer") {
        setForm({
          ...emptyAsset,
          asset_type: assetType,
          record_id: "",
          specifications: { ...(specTemplates[assetType] || {}) },
        });
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/next-record-id?asset_type=${encodeURIComponent(assetType)}`
        );
        const data = await res.json();

        setForm({
          ...emptyAsset,
          asset_type: assetType,
          record_id: data.record_id || "",
          specifications: computerTypes.includes(assetType)
            ? {}
            : { ...(specTemplates[assetType] || {}) },
        });
      } catch (error) {
        console.error("Failed to load next record ID:", error);
        setForm({
          ...emptyAsset,
          asset_type: assetType,
          specifications: computerTypes.includes(assetType)
            ? {}
            : { ...(specTemplates[assetType] || {}) },
        });
      }
    };

    if (asset) {
      const parsedSpecifications =
        typeof asset.specifications === "string"
          ? safeJsonParse(asset.specifications)
          : asset.specifications || {};

      setForm({
        ...emptyAsset,
        ...asset,
        asset_type: normalizeAssetTypeLabel(asset.asset_type),
        specifications: parsedSpecifications,
        warranty_end: asset.warranty_end
          ? String(asset.warranty_end).split("T")[0]
          : "",
      });
    } else {
      loadNextRecordId("Laptop");
    }

    setMissingFields([]);
  }, [asset]);

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setMissingFields((prev) => prev.filter((field) => field !== key));
  };

  const setSpec = (key, val) => {
    setForm((prev) => ({
      ...prev,
      specifications: {
        ...(prev.specifications || {}),
        [key]: val,
      },
    }));
  };

  const handleAssetTypeChange = async (value) => {
    if (value === "Printer") {
      setForm((prev) => ({
        ...emptyAsset,
        ...prev,
        asset_type: value,
        record_id: "",
        ip_mac_address: prev.specifications?.ip_address || "",
        specifications: {
          ...(specTemplates[value] || {}),
          ...(prev.specifications || {}),
        },
      }));
      setMissingFields((prev) => prev.filter((field) => field !== "asset_type"));
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/next-record-id?asset_type=${encodeURIComponent(value)}`
      );
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        asset_type: value,
        record_id: data.record_id || "",
        specifications: computerTypes.includes(value)
          ? {}
          : {
              ...(specTemplates[value] || {}),
              ...(prev.specifications || {}),
            },
      }));

      setMissingFields((prev) => prev.filter((field) => field !== "asset_type"));
    } catch (error) {
      console.error("Failed to load next record ID:", error);

      setForm((prev) => ({
        ...prev,
        asset_type: value,
        specifications: computerTypes.includes(value)
          ? {}
          : {
              ...(specTemplates[value] || {}),
              ...(prev.specifications || {}),
            },
      }));
    }
  };

  const validateRequiredFields = () => {
    const requiredFields = getRequiredFields(form.asset_type);

    const missing = requiredFields.filter((key) => {
      const value = form[key];
      return !String(value || "").trim();
    });

    setMissingFields(missing);

    if (missing.length > 0) {
      const missingLabels = missing.map((key) => requiredLabels[key] || key);
      toast.error(`Please fill in all required fields: ${missingLabels.join(", ")}`);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!form.asset_type) {
      toast.error("Asset type is required");
      return;
    }

    if (!validateRequiredFields()) return;

    try {
      setSaving(true);

      const data = {
        ...form,
        specifications: JSON.stringify(form.specifications || {}),
      };

      if (!data.warranty_end) data.warranty_end = null;

      if (data.asset_type === "Printer") {
        data.ip_mac_address = form.specifications?.ip_address || null;
        data.wlan_address = null;
        data.os_version = null;
        data.office_version = null;
        data.office_key = null;
        data.processor = null;
        data.ram = null;
        data.storage = null;
        data.monitor_info = null;
        data.ups_info = null;
        data.business_unit = null;
      } else if (!computerTypes.includes(data.asset_type)) {
        data.ip_mac_address = null;
        data.wlan_address = null;
        data.os_version = null;
        data.office_version = null;
        data.office_key = null;
        data.processor = null;
        data.ram = null;
        data.storage = null;
        data.monitor_info = null;
        data.ups_info = null;
      }

      delete data.id;
      delete data.created_date;
      delete data.updated_date;
      delete data.created_by;
      delete data.created_at;
      delete data.updated_at;

      const url = isEditing ? `${API_BASE}/${asset.id}` : API_BASE;

      const payload = isEditing
        ? {
            ...data,
            source:
              asset?.source || (data.asset_type === "Printer" ? "Printer" : "Asset"),
          }
        : data;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save asset");
      }

      setMissingFields([]);
      toast.success(
        isEditing ? "Asset updated successfully" : "Asset created successfully"
      );
      onSaved?.();
    } catch (error) {
      console.error("Save asset error:", error);
      toast.error(error.message || "Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  const renderLabel = (label, required = false) => (
    <Label className="text-xs font-semibold text-slate-600">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </Label>
  );

  const sectionHeader = (icon, title, subtitle) => (
    <div className="mb-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );

  const field = (label, key, type = "text", required = false, placeholder = "") => {
    const hasError = missingFields.includes(key);

    return (
      <div className="space-y-1.5">
        {renderLabel(label, required)}
        <Input
          type={type}
          placeholder={placeholder}
          value={form[key] || ""}
          onChange={(e) => set(key, e.target.value)}
          className={`h-11 text-sm rounded-xl focus-visible:ring-2 ${
            hasError
              ? "border-red-500 bg-red-50 focus-visible:ring-red-500 focus-visible:border-red-500"
              : "bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500"
          }`}
        />
      </div>
    );
  };

  const specField = (label, key, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      {renderLabel(label)}
      <Input
        type={type}
        placeholder={placeholder}
        value={form.specifications?.[key] || ""}
        onChange={(e) => setSpec(key, e.target.value)}
        className="h-11 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
      />
    </div>
  );

  const selectField = (
    label,
    key,
    options,
    contentClassName = "",
    onValueChange = null,
    required = false
  ) => {
    const hasError = missingFields.includes(key);

    return (
      <div className="space-y-1.5">
        {renderLabel(label, required)}
        <Select
          value={form[key] || ""}
          onValueChange={(v) => {
            setMissingFields((prev) => prev.filter((field) => field !== key));
            if (onValueChange) onValueChange(v);
            else set(key, v);
          }}
        >
          <SelectTrigger
            className={`h-11 text-sm rounded-xl focus:ring-2 ${
              hasError
                ? "border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500"
                : "bg-slate-50 border-slate-200 focus:ring-blue-500 focus:border-blue-500"
            }`}
          >
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent className={contentClassName}>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
      <div className="bg-sky-50 text-slate-900 px-6 py-4 flex items-center justify-between border-b border-sky-100">
        <div>
          <h2 className="font-semibold tracking-tight text-base">
            {isEditing ? "Edit Asset" : "Add New Asset"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete the required information and technical details below.
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 md:p-7 bg-white space-y-8">
        <section className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:p-6">
          {sectionHeader(
            <Package2 className="w-5 h-5" />,
            "Asset Identification",
            "Primary asset record details used for tracking and classification."
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Record ID</Label>
              <Input
                value={form.record_id || (isPrinterType ? "N/A for Printer" : "Auto-generated")}
                disabled
                className="h-11 text-sm bg-slate-100 border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            {selectField(
              "Asset Type",
              "asset_type",
              assetTypeOptions,
              "bg-white text-slate-900 border border-slate-200 shadow-lg rounded-xl z-50",
              handleAssetTypeChange
            )}

            {field("Hostname", "hostname", "text", true, "Enter hostname")}
            {field("Serial Number", "serial_number", "text", true, "Enter serial number")}
            {field("Brand", "brand", "text", true, "Enter brand / manufacturer")}

            <div className="space-y-1.5">
              {renderLabel("Condition", true)}
              <Select
                value={form.condition || ""}
                onValueChange={(v) => {
                  set("condition", v);
                  if (v === "FOR DISPOSAL") {
                    set("status", "FOR DISPOSAL");
                  }
                }}
              >
                <SelectTrigger
                  className={`h-11 text-sm rounded-xl focus:ring-2 ${
                    missingFields.includes("condition")
                      ? "border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500"
                      : "bg-slate-50 border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                >
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border border-slate-200 shadow-lg rounded-xl z-50">
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  <SelectItem value="FOR DISPOSAL">FOR DISPOSAL</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Condition describes the asset lifecycle.
                <span className="block">• ACTIVE = currently part of active inventory</span>
                <span className="block">• INACTIVE = not currently active</span>
                <span className="block">• FOR DISPOSAL = retired / to be phased out</span>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:p-6">
          {sectionHeader(
            <Info className="w-5 h-5" />,
            "Ownership & Assignment",
            "Departmental ownership, assigned user, business unit, and asset lifecycle status."
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            {field("Custodian", "custodian", "text", false, "Leave blank if unassigned")}

            {selectField(
              "Department",
              "department",
              departmentOptions,
              "bg-white text-slate-900 border border-slate-200 shadow-lg rounded-xl z-50",
              null,
              true
            )}

            {!isPrinterType &&
              field("Business Unit", "business_unit", "text", true, "Enter business unit")}

            {field("Warranty End", "warranty_end", "date")}

            <div className="space-y-1.5">
              {renderLabel("Status", true)}
              <Select
                value={form.status || ""}
                onValueChange={(v) => set("status", v)}
              >
                <SelectTrigger
                  className={`h-11 text-sm rounded-xl focus:ring-2 ${
                    missingFields.includes("status")
                      ? "border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500"
                      : "bg-slate-50 border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                >
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border border-slate-200 shadow-lg rounded-xl z-50">
                  <SelectItem value="WORKING">WORKING</SelectItem>
                  <SelectItem value="NOT WORKING">NOT WORKING</SelectItem>
                  <SelectItem value="UNDER REPAIR">UNDER REPAIR</SelectItem>
                  <SelectItem value="FOR RE-DEPLOYMENT">FOR RE-DEPLOYMENT</SelectItem>
                  <SelectItem value="FOR DISPOSAL">FOR DISPOSAL</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Status describes the current operational state used in dashboard reporting.
                <span className="block">• WORKING = counted as Working</span>
                <span className="block">• NOT WORKING = counted as Not Working</span>
                <span className="block">• UNDER REPAIR = counted as Under Repair</span>
                <span className="block">• FOR RE-DEPLOYMENT = counted as For Redeployment</span>
                <span className="block">• FOR DISPOSAL = counted as Retired</span>
                <span className="block">• INACTIVE = counted as Inactive</span>
              </p>
            </div>
          </div>
        </section>

        {isComputerType && (
          <section className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:p-6">
            {sectionHeader(
              <MonitorSmartphone className="w-5 h-5" />,
              "Computer Technical Details",
              "System and hardware details for Laptop and Desktop assets."
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              {field("IP / MAC Address", "ip_mac_address", "text", false, "Enter IP or MAC address")}
              {field("WLAN Address", "wlan_address", "text", false, "Enter WLAN address")}
              {field("OS Version", "os_version", "text", false, "e.g. Windows 11 Pro")}
              {field("Office Version", "office_version", "text", false, "e.g. Microsoft 365")}
              {field("Office Key", "office_key", "text", false, "Enter office key")}
              {field("Processor", "processor", "text", false, "e.g. Intel Core i5")}
              {field("RAM", "ram", "text", false, "e.g. 16GB")}
              {field("Storage", "storage", "text", false, "e.g. 512GB SSD")}
              {field("Monitor Info", "monitor_info", "text", false, "Monitor details")}
              {field("UPS Info", "ups_info", "text", false, "UPS details")}
            </div>
          </section>
        )}

        {!isComputerType && (
          <section className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:p-6">
            {sectionHeader(
              <Cpu className="w-5 h-5" />,
              "Device-Specific Details",
              "Additional technical information stored under specifications for this asset type."
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              {form.asset_type === "Printer" && (
                <>
                  {specField("Printer Type", "printer_type", "text", "Laser / Inkjet / Thermal")}
                  {specField("IP Address", "ip_address", "text", "Enter IP address")}
                  {specField("Toner Model", "toner_model", "text", "Enter toner model")}
                  {specField("Page Count", "page_count", "text", "Enter page count")}
                  {specField("Connection Type", "connection_type", "text", "USB / Network / Wi-Fi")}
                </>
              )}

              {form.asset_type === "Monitor" && (
                <>
                  {specField("Screen Size", "screen_size", "text", "e.g. 24 inches")}
                  {specField("Resolution", "resolution", "text", "e.g. 1920x1080")}
                  {specField("Panel Type", "panel_type", "text", "IPS / VA / TN")}
                  {specField("Ports", "ports", "text", "HDMI / DP / VGA")}
                </>
              )}

              {form.asset_type === "UPS" && (
                <>
                  {specField("Capacity", "capacity", "text", "e.g. 650VA")}
                  {specField("Battery Type", "battery_type", "text", "Battery specification")}
                  {specField("Runtime", "runtime", "text", "Estimated runtime")}
                  {specField("Connected Device", "connected_device", "text", "Connected equipment")}
                </>
              )}

              {["Router", "Switch", "Access Point"].includes(form.asset_type) && (
                <>
                  {specField("IP Address", "ip_address", "text", "Enter IP address")}
                  {specField("MAC Address", "mac_address", "text", "Enter MAC address")}
                  {specField("Firmware Version", "firmware_version", "text", "Firmware version")}
                  {specField("Location", "location", "text", "Installation location")}
                  {form.asset_type === "Switch" && specField("Ports", "ports", "text", "e.g. 24 Ports")}
                  {form.asset_type !== "Switch" && specField("Notes", "notes", "text", "Additional notes")}
                </>
              )}

              {form.asset_type === "Scanner" && (
                <>
                  {specField("Scanner Type", "scanner_type", "text", "Flatbed / Document Scanner")}
                  {specField("Connection Type", "connection_type", "text", "USB / Network")}
                  {specField("Location", "location", "text", "Installed location")}
                </>
              )}

              {form.asset_type === "Projector" && (
                <>
                  {specField("Resolution", "resolution", "text", "Native resolution")}
                  {specField("Lumens", "lumens", "text", "Brightness in lumens")}
                  {specField("Connection Type", "connection_type", "text", "HDMI / VGA / Wireless")}
                  {specField("Location", "location", "text", "Installed location")}
                </>
              )}

              {form.asset_type === "Tablet" && (
                <>
                  {specField("OS Version", "os_version", "text", "Android / iPadOS version")}
                  {specField("Storage", "storage", "text", "e.g. 128GB")}
                  {specField("IP Address", "ip_address", "text", "Enter IP address")}
                  {specField("Assigned To", "assigned_to", "text", "Assigned user")}
                </>
              )}

              {form.asset_type === "IP Phone" && (
                <>
                  {specField("IP Address", "ip_address", "text", "Enter IP address")}
                  {specField("MAC Address", "mac_address", "text", "Enter MAC address")}
                  {specField("Firmware Version", "firmware_version", "text", "Firmware version")}
                  {specField("Extension Number", "extension_number", "text", "Extension number")}
                </>
              )}

              {form.asset_type === "Biometric Device" && (
                <>
                  {specField("IP Address", "ip_address", "text", "Enter IP address")}
                  {specField("MAC Address", "mac_address", "text", "Enter MAC address")}
                  {specField("Firmware Version", "firmware_version", "text", "Firmware version")}
                  {specField("Location", "location", "text", "Installed location")}
                  {specField("Software Linked", "software_linked", "text", "Linked software / platform")}
                </>
              )}

              {form.asset_type === "CCTV" && (
                <>
                  {specField("IP Address", "ip_address", "text", "Enter IP address")}
                  {specField("Resolution", "resolution", "text", "Camera resolution")}
                  {specField("Camera Type", "camera_type", "text", "Dome / Bullet / PTZ")}
                  {specField("Location", "location", "text", "Installed location")}
                  {specField("NVR Linked", "nvr_linked", "text", "Linked NVR")}
                </>
              )}

              {form.asset_type === "External Drive" && (
                <>
                  {specField("Capacity", "capacity", "text", "e.g. 1TB")}
                  {specField("Interface", "interface", "text", "USB 3.0 / Type-C")}
                  {specField("Assigned To", "assigned_to", "text", "Assigned user")}
                  {specField("Encryption Status", "encryption_status", "text", "Encrypted / Not Encrypted")}
                </>
              )}

              {form.asset_type === "Other" && specField("Details", "details", "text", "Enter additional details")}
            </div>
          </section>
        )}
      </div>

      <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-sky-100 bg-slate-50/60">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-sm font-medium"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : isEditing ? "Update Asset" : "Save Asset"}
        </Button>

        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border-slate-200 text-slate-700 text-sm font-medium"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}