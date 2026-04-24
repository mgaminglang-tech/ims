import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileCheck,
  Shield,
  Clock,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import AcknowledgedReceipt from "../components/forms/AcknowledgedReceipt";
import AccountabilityForm from "../components/forms/AccountabilityForm";
import BorrowedForm from "../components/forms/BorrowedForm";
import ReturnItemForm from "../components/forms/ReturnItemForm";

const API_URL = import.meta.env.VITE_API_BASE_URL || "https://api.mervinautomation.it.com/api";

function BorrowedItemsTable() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Borrowed");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadBorrowRecords();
  }, []);

  const loadBorrowRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/borrow-records`);
      const data = Array.isArray(res.data) ? res.data : [];
      setRecords(data);
    } catch (error) {
      console.error("❌ Error loading borrow records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const status = String(record.status || "").toLowerCase();
      const borrower = String(record.borrower_name || "").toLowerCase();
      const hostname = String(record.asset_hostname || "").toLowerCase();
      const serial = String(record.asset_serial || "").toLowerCase();
      const department = String(record.department || "").toLowerCase();

      const matchesStatus =
        statusFilter === "All"
          ? true
          : status === statusFilter.toLowerCase();

      const matchesSearch =
        !term ||
        borrower.includes(term) ||
        hostname.includes(term) ||
        serial.includes(term) ||
        department.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [records, statusFilter, searchTerm]);

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Search Borrowed Records
            </label>
            <input
              type="text"
              placeholder="Search borrower, hostname, serial, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Borrowed">Borrowed</option>
              <option value="Returned">Returned</option>
              <option value="All">All</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Borrowed Items</h3>
            <p className="text-sm text-slate-500">
              View all borrowed and returned transaction records.
            </p>
          </div>

          <button
            onClick={loadBorrowRecords}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Borrower</th>
                <th className="px-4 py-3 text-left font-semibold">Hostname</th>
                <th className="px-4 py-3 text-left font-semibold">Serial</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Borrow Date</th>
                <th className="px-4 py-3 text-left font-semibold">Expected Return</th>
                <th className="px-4 py-3 text-left font-semibold">Actual Return</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading borrow records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No borrow records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-4 py-3">{record.borrower_name || "-"}</td>
                    <td className="px-4 py-3">{record.asset_hostname || "-"}</td>
                    <td className="px-4 py-3">{record.asset_serial || "-"}</td>
                    <td className="px-4 py-3">{record.department || "-"}</td>
                    <td className="px-4 py-3">
                      {record.borrow_date
                        ? new Date(record.borrow_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {record.expected_return_date
                        ? new Date(
                            record.expected_return_date
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {record.actual_return_date
                        ? new Date(
                            record.actual_return_date
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          String(record.status || "").toLowerCase() === "borrowed"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {record.status || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Forms() {
  const [activeTab, setActiveTab] = useState("receipt");
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await axios.get(`${API_URL}/assets`);
      const data = Array.isArray(res.data) ? res.data : [];
      setAssets(data);
    } catch (error) {
      console.error("❌ Error loading assets:", error);
      setAssets([]);
    }
  };

  const filteredAssets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return assets;

    return assets.filter((asset) => {
      const hostname = String(asset.hostname || "").toLowerCase();
      const custodian = String(
        asset.custodian || asset.full_name || ""
      ).toLowerCase();
      const assetType = String(asset.asset_type || "").toLowerCase();

      return (
        hostname.includes(term) ||
        custodian.includes(term) ||
        assetType.includes(term)
      );
    });
  }, [assets, searchTerm]);

  const selectedAsset = useMemo(() => {
    return (
      assets.find(
        (item) =>
          String(item.id) === String(selectedAssetId) ||
          String(item.record_id) === String(selectedAssetId)
      ) || {}
    );
  }, [assets, selectedAssetId]);

  const selectedEmployee = useMemo(() => {
    return selectedAsset.employee || {};
  }, [selectedAsset]);

  const selectedAssetLabel = [
    selectedAsset.hostname,
    selectedAsset.custodian || selectedAsset.full_name,
    selectedAsset.asset_type,
  ]
    .filter(Boolean)
    .join(" • ");

  const handleAccountabilityReset = () => {
    setSearchTerm("");
    setSelectedAssetId("");
    setActiveTab("accountability");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Printable Forms
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate, review, and print official IT documents in one place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 h-auto rounded-2xl bg-slate-100 p-1 gap-1">
          <TabsTrigger
            value="receipt"
            className="rounded-xl py-3 gap-2 text-slate-700 transition data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <FileCheck className="w-4 h-4" />
            Acknowledged Receipt
          </TabsTrigger>

          <TabsTrigger
            value="accountability"
            className="rounded-xl py-3 gap-2 text-slate-700 transition data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Shield className="w-4 h-4" />
            Accountability Form
          </TabsTrigger>

          <TabsTrigger
            value="borrow"
            className="rounded-xl py-3 gap-2 text-slate-700 transition data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Clock className="w-4 h-4" />
            Borrowed Form
          </TabsTrigger>

          <TabsTrigger
            value="return"
            className="rounded-xl py-3 gap-2 text-slate-700 transition data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Return Item
          </TabsTrigger>

          <TabsTrigger
            value="borrowed-items"
            className="rounded-xl py-3 gap-2 text-slate-700 transition data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            Borrowed Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipt" className="mt-4">
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm p-8 flex justify-center items-start">
            <AcknowledgedReceipt />
          </div>
        </TabsContent>

        <TabsContent value="accountability" className="mt-4">
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Search Asset
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search hostname, name, or asset type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-4 pr-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Select Asset
                    </label>

                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Choose asset</option>
                      {filteredAssets.map((asset, index) => (
                        <option
                          key={asset.id ?? asset.record_id ?? index}
                          value={asset.id ?? asset.record_id}
                        >
                          {[asset.hostname, asset.custodian || asset.full_name, asset.asset_type]
                            .filter(Boolean)
                            .join(" • ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAssetId && (
                  <div className="mt-4 rounded-xl border border-sky-100 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 mb-1">
                      Selected Asset
                    </p>
                    <p className="text-sm text-slate-700 break-words">
                      {selectedAssetLabel || "No asset selected"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center overflow-x-auto">
                <div className="w-full flex justify-center">
                  <AccountabilityForm
                    asset={selectedAsset}
                    employee={selectedEmployee}
                    onReset={handleAccountabilityReset}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="borrow" className="mt-4">
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm p-8 flex justify-center">
            <BorrowedForm />
          </div>
        </TabsContent>

        <TabsContent value="return" className="mt-4">
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm p-8 flex justify-center">
            <ReturnItemForm />
          </div>
        </TabsContent>

        <TabsContent value="borrowed-items" className="mt-4">
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm p-6 md:p-8">
            <BorrowedItemsTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}