import { useState, useEffect } from "react";
import axios from "axios";
import StatsGrid from "../components/dashboard/StatsGrid";
import DashboardCharts from "../components/dashboard/StatsGrid";
import AssetForm from "../components/assets/AssetForm";
import AssetTable from "../components/assets/AssetTable";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

const API_URL = "http://localhost:3001/api";

export default function Dashboard() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/items`);
      setAssets(data);
    } catch (err) {
      console.error("Failed to load assets:", err.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadAssets(); }, []);

  const handleEdit = (asset) => {
    setEditAsset(asset);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditAsset(null);
    loadAssets();
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
      {/* Stats */}
      <StatsGrid assets={assets} />

      {/* Charts */}
      <DashboardCharts assets={assets} />

      {/* Form toggle */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => { setShowForm(!showForm); setEditAsset(null); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Close Form" : "Add New Asset"}
        </Button>
        <Button variant="outline" size="icon" onClick={loadAssets}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Asset Form */}
      {showForm && (
        <AssetForm
          asset={editAsset}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditAsset(null); }}
        />
      )}

      {/* Recent Assets */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">Recent Assets</h2>
        <AssetTable assets={assets.slice(0, 20)} onEdit={handleEdit} onDeleted={loadAssets} />
      </div>
    </div>
  );
}