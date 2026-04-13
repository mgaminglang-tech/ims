import { useState, useEffect } from "react";
import AssetTable from "../components/assets/AssetTable";
import AssetForm from "../components/assets/AssetForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Laptop, Monitor, Printer, Package } from "lucide-react";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editAsset, setEditAsset] = useState(null);

  const loadAssets = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/assets");
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

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

  const laptops = assets.filter((a) => a.asset_type === "Laptop");
  const desktops = assets.filter((a) => a.asset_type === "Desktop");
  const printers = assets.filter((a) => a.asset_type === "Printer");

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

      <Tabs defaultValue="all">
        <TabsList className="bg-muted">
          <TabsTrigger value="all" className="gap-2">
            <Package className="w-4 h-4" /> All ({assets.length})
          </TabsTrigger>
          <TabsTrigger value="laptops" className="gap-2">
            <Laptop className="w-4 h-4" /> Laptops ({laptops.length})
          </TabsTrigger>
          <TabsTrigger value="desktops" className="gap-2">
            <Monitor className="w-4 h-4" /> Desktops ({desktops.length})
          </TabsTrigger>
          <TabsTrigger value="printers" className="gap-2">
            <Printer className="w-4 h-4" /> Printers ({printers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AssetTable assets={assets} onEdit={handleEdit} onDeleted={loadAssets} />
        </TabsContent>
        <TabsContent value="laptops" className="mt-4">
          <AssetTable assets={laptops} onEdit={handleEdit} onDeleted={loadAssets} />
        </TabsContent>
        <TabsContent value="desktops" className="mt-4">
          <AssetTable assets={desktops} onEdit={handleEdit} onDeleted={loadAssets} />
        </TabsContent>
        <TabsContent value="printers" className="mt-4">
          <AssetTable assets={printers} onEdit={handleEdit} onDeleted={loadAssets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}