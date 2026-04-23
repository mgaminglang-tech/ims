import { useState, useEffect } from "react";
import AssetTable from "../components/assets/AssetTable";
import AssetForm from "../components/assets/AssetForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Laptop,
  Monitor,
  Printer,
  Package,
  Search,
  Plus,
  Ellipsis,
} from "lucide-react";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editAsset, setEditAsset] = useState(null);

  const [searchField, setSearchField] = useState("hostname");
  const [searchTerm, setSearchTerm] = useState("");

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/assets`);
      if (!response.ok) throw new Error("Failed to fetch assets");
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error("Error loading assets:", error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleEdit = (asset) => {
    setEditAsset(asset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaved = () => {
    setEditAsset(null);
    loadAssets();
  };

  const normalize = (value) => String(value || "").toLowerCase();

  const filteredAssets = assets.filter((asset) =>
    normalize(asset[searchField]).includes(normalize(searchTerm))
  );

  const laptops = filteredAssets.filter(
    (a) => normalize(a.asset_type) === "laptop"
  );
  const desktops = filteredAssets.filter(
    (a) => normalize(a.asset_type) === "desktop"
  );
  const printers = filteredAssets.filter(
    (a) => normalize(a.asset_type) === "printer"
  );

  const otherAssets = filteredAssets.filter(
    (a) =>
      !["laptop", "desktop", "printer"].includes(normalize(a.asset_type))
  );

  const groupedOtherAssets = otherAssets.reduce((acc, asset) => {
    const type = asset.asset_type || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {});

  const searchOptions = [
    { value: "hostname", label: "Hostname" },
    { value: "serial_number", label: "Serial Number" },
    { value: "custodian", label: "Custodian" },
    { value: "department", label: "Department" },
    { value: "brand", label: "Brand" },
    { value: "asset_type", label: "Asset Type" },
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
      default:
        return "Search assets...";
    }
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
      {editAsset && (
        <AssetForm
          asset={editAsset}
          onSaved={handleSaved}
          onCancel={() => setEditAsset(null)}
        />
      )}

      {/* Search Bar */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100">
          <h2 className="text-xl font-semibold text-slate-800">Asset Search</h2>

          <Button
            onClick={() => setEditAsset({})}
            className="h-10 rounded-xl bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Asset
          </Button>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="h-11 min-w-[190px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {searchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getPlaceholder()}
                className="h-11 rounded-xl border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="flex flex-wrap gap-3 bg-transparent p-0 justify-center">
          <TabsTrigger
            value="all"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600"
          >
            <Package className="w-4 h-4 mr-2" />
            All ({filteredAssets.length})
          </TabsTrigger>

          <TabsTrigger
            value="laptops"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600"
          >
            <Laptop className="w-4 h-4 mr-2" />
            Laptops ({laptops.length})
          </TabsTrigger>

          <TabsTrigger
            value="desktops"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Desktops ({desktops.length})
          </TabsTrigger>

          <TabsTrigger
            value="printers"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600"
          >
            <Printer className="w-4 h-4 mr-2" />
            Printers ({printers.length})
          </TabsTrigger>

          <TabsTrigger
            value="more"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600"
          >
            <Ellipsis className="w-4 h-4 mr-2" />
            More ({Object.keys(groupedOtherAssets).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AssetTable
            assets={filteredAssets}
            onEdit={handleEdit}
            onDeleted={loadAssets}
          />
        </TabsContent>

        <TabsContent value="laptops" className="mt-4">
          <AssetTable
            assets={laptops}
            onEdit={handleEdit}
            onDeleted={loadAssets}
          />
        </TabsContent>

        <TabsContent value="desktops" className="mt-4">
          <AssetTable
            assets={desktops}
            onEdit={handleEdit}
            onDeleted={loadAssets}
          />
        </TabsContent>

        <TabsContent value="printers" className="mt-4">
          <AssetTable
            assets={printers}
            onEdit={handleEdit}
            onDeleted={loadAssets}
          />
        </TabsContent>

        <TabsContent value="more" className="mt-4 space-y-6">
          {Object.entries(groupedOtherAssets).map(([type, items]) => (
            <div
              key={type}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">{type}</h3>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {items.length}
                </span>
              </div>

              <AssetTable
                assets={items}
                onEdit={handleEdit}
                onDeleted={loadAssets}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}