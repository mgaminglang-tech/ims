import { useState, useEffect } from "react";
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
import { Search as SearchIcon, X, Plus } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/assets";

export default function Search() {
  const [assets, setAssets] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchField, setSearchField] = useState("hostname");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE);

      if (!response.ok) throw new Error("Failed to fetch assets");

      const data = await response.json();
      setAssets(data);
      setResults(data);
    } catch (error) {
      console.error("Load assets error:", error);
      toast.error("Failed to load assets");
      setAssets([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  // Real-time search as user types (better UX)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults(assets);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = assets.filter((asset) => {
      const value = String(asset[searchField] || "").toLowerCase();
      return value.includes(term);
    });

    setResults(filtered);
  }, [searchTerm, searchField, assets]);

  const handleAddNew = () => {
    setEditAsset(null);
    setShowForm(true);
  };

  const handleEdit = (asset) => {
    setEditAsset(asset);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditAsset(null);
    loadAssets();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditAsset(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Modal-like Section */}
      {showForm && (
        <AssetForm
          asset={editAsset}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      )}

      {/* Search Header */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="bg-foreground text-background px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Asset Search</h2>
          <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Asset
          </Button>
        </div>

        <div className="p-6 flex flex-col sm:flex-row gap-4">
          <Select value={searchField} onValueChange={setSearchField}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hostname">Hostname</SelectItem>
              <SelectItem value="serial_number">Serial Number</SelectItem>
              <SelectItem value="custodian">Custodian</SelectItem>
              <SelectItem value="record_id">Record ID</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="asset_type">Asset Type</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 flex gap-2">
            <Input
              placeholder={`Search by ${searchField.replace("_", " ")}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />

            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center px-1">
        <p className="text-sm text-muted-foreground">
          {results.length} result{results.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Asset Table */}
      <AssetTable
        assets={results}
        onEdit={handleEdit}
        onDeleted={loadAssets}
      />
    </div>
  );
}