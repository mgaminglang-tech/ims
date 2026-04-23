import { useState, useEffect, useMemo } from "react";
import AssetTable from "../components/assets/AssetTable";
import AssetForm from "../components/assets/AssetForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search as SearchIcon, Plus } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/assets";

export default function Search() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchField, setSearchField] = useState("hostname");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const searchOptions = [
    { value: "hostname", label: "Hostname" },
    { value: "serial_number", label: "Serial Number" },
    { value: "custodian", label: "Custodian" },
    { value: "department", label: "Department" },
    { value: "brand", label: "Brand" },
    { value: "asset_type", label: "Asset Type" },
    { value: "status", label: "Status" },
    { value: "source", label: "Source" },
  ];

  const getPlaceholder = () => {
    switch (searchField) {
      case "hostname":
        return "Search by hostname...";
      case "serial_number":
        return "Search by serial number...";
      case "custodian":
        return "Search by custodian...";
      case "department":
        return "Search by department...";
      case "brand":
        return "Search by brand...";
      case "asset_type":
        return "Search by asset type...";
      case "status":
        return "Search by status...";
      case "source":
        return "Search by source...";
      default:
        return "Search assets...";
    }
  };

  const normalizeSearchValue = (value, field) => {
    const raw = String(value || "").trim();

    if (field === "custodian") {
      const normalized = raw.toUpperCase();
      if (
        !raw ||
        ["-", "UNASSIGNED", "N/A", "NONE", "NULL"].includes(normalized)
      ) {
        return "unassigned";
      }
    }

    return raw.toLowerCase();
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE);

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

      const data = await response.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load assets error:", error);
      toast.error("Failed to load assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const results = useMemo(() => {
    if (!searchTerm.trim()) return assets;

    const term = searchTerm.toLowerCase().trim();

    return assets.filter((asset) => {
      const value = normalizeSearchValue(asset?.[searchField], searchField);
      return value.includes(term);
    });
  }, [assets, searchTerm, searchField]);

  const handleAddNew = () => {
    setEditAsset(null);
    setShowForm(true);
  };

  const handleEdit = (asset) => {
    setEditAsset(asset);
    setShowForm(true);
  };

  const handleSaved = async () => {
    setShowForm(false);
    setEditAsset(null);
    await loadAssets();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditAsset(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <AssetForm
          asset={editAsset}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-sky-100 bg-sky-50/80 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Asset Search</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and manage your inventory records
            </p>
          </div>

          <Button
            onClick={handleAddNew}
            className="h-10 rounded-xl bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Asset
          </Button>
        </div>

        <div className="bg-gradient-to-b from-sky-50/70 to-white px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="w-full md:w-[220px]">
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="!h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-200">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>

                <SelectContent className="rounded-xl border border-slate-200 bg-white shadow-md">
                  {searchOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-sm text-slate-700"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getPlaceholder()}
                className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-200"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {results.length}
              </span>{" "}
              result{results.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AssetTable
          assets={results}
          onEdit={handleEdit}
          onDeleted={loadAssets}
        />
      </div>
    </div>
  );
}