import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export default function BorrowedForm() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [loadingAssets, setLoadingAssets] = useState(false);

  const [form, setForm] = useState({
    asset_id: "",
    asset_hostname: "",
    asset_serial: "",
    borrower_name: "",
    department: "",
    contact_number: "",
    borrow_date: "",
    expected_return_date: "",
    approved_by: "",
    purpose: "",
    remarks: "",
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoadingAssets(true);
      const res = await axios.get(`${API_URL}/assets/borrowable`);
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading borrowable assets:", error);
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toUpperCase();

  const filteredAssets = useMemo(() => {
    const keyword = normalizeText(assetSearch);

    if (!keyword) return assets;

    return assets.filter((asset) => {
      const searchableText = [
        asset.hostname,
        asset.asset_type,
        asset.serial_number,
        asset.brand,
        asset.department,
        asset.record_id,
        asset.id,
        asset.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

      return searchableText.includes(keyword);
    });
  }, [assets, assetSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssetChange = (e) => {
    const value = e.target.value;

    const asset =
      assets.find((item) => String(item.id) === String(value)) || null;

    setSelectedAsset(asset);

    setForm((prev) => ({
      ...prev,
      asset_id: asset?.id ?? "",
      asset_hostname: asset?.hostname || "",
      asset_serial: asset?.serial_number || "",
      department: asset?.department || prev.department || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.asset_id) {
      alert("Please select a borrowable asset.");
      return;
    }

    if (!form.borrower_name.trim()) {
      alert("Borrower name is required.");
      return;
    }

    if (!form.borrow_date || !form.expected_return_date) {
      alert("Please complete the borrow and expected return dates.");
      return;
    }

    if (new Date(form.expected_return_date) < new Date(form.borrow_date)) {
      alert("Expected return date cannot be earlier than borrow date.");
      return;
    }

    const payload = {
      asset_id: Number(form.asset_id),
      asset_hostname: form.asset_hostname,
      asset_serial: form.asset_serial,
      borrower_name: form.borrower_name,
      department: form.department,
      contact_number: form.contact_number,
      borrow_date: form.borrow_date,
      expected_return_date: form.expected_return_date,
      approved_by: form.approved_by,
      actual_return_date: null,
      purpose: form.purpose,
      remarks: form.remarks,
      status: "Borrowed",
    };

    try {
      await axios.post(`${API_URL}/borrow-records`, payload);
      alert("Borrow transaction saved successfully.");

      setForm({
        asset_id: "",
        asset_hostname: "",
        asset_serial: "",
        borrower_name: "",
        department: "",
        contact_number: "",
        borrow_date: "",
        expected_return_date: "",
        approved_by: "",
        purpose: "",
        remarks: "",
      });

      setSelectedAsset(null);
      setAssetSearch("");
      loadAssets();
    } catch (error) {
      console.error("Error saving borrow transaction:", error);
      alert(
        error?.response?.data?.message || "Failed to save borrow transaction."
      );
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Borrowed Form</h2>
        <p className="text-sm text-slate-500 mt-1">
          Create a new borrowing transaction for an IT asset.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-4">
            Borrower Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Borrower Name
              </label>
              <input
                type="text"
                name="borrower_name"
                value={form.borrower_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter borrower name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter department"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                name="contact_number"
                value={form.contact_number}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter contact number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Approved By
              </label>
              <input
                type="text"
                name="approved_by"
                value={form.approved_by}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter approver name"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-4">
            Borrowing Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Asset
              </label>
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search by hostname, serial, type, brand, status..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Asset
              </label>
              <select
                name="asset_id"
                value={form.asset_id}
                onChange={handleAssetChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
                disabled={loadingAssets || filteredAssets.length === 0}
              >
                <option value="">
                  {loadingAssets
                    ? "Loading borrowable assets..."
                    : filteredAssets.length === 0
                    ? "No borrowable assets available"
                    : "Choose asset"}
                </option>

                {filteredAssets.map((asset, index) => (
                  <option key={asset.id ?? index} value={asset.id}>
                    {[asset.hostname, asset.asset_type, asset.status]
                      .filter(Boolean)
                      .join(" • ")}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-500 mt-2">
                {filteredAssets.length} borrowable asset(s) found.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Borrow Date
              </label>
              <input
                type="date"
                name="borrow_date"
                value={form.borrow_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expected Return Date
              </label>
              <input
                type="date"
                name="expected_return_date"
                value={form.expected_return_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Purpose
              </label>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter purpose of borrowing"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Optional remarks"
              />
            </div>
          </div>
        </div>

        {selectedAsset && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-4">
              Asset Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Hostname</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedAsset.hostname || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Equipment Type</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedAsset.asset_type || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Brand</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedAsset.brand || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedAsset.status || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Serial Number</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedAsset.serial_number || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Asset ID</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedAsset.id || "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-base rounded-lg shadow-sm"
          >
            Save Borrow Transaction
          </Button>
        </div>
      </form>
    </div>
  );
}