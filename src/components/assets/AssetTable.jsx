import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 10;
const API_BASE = "http://localhost:3001/api/assets";

const normalize = (value) => String(value || "").trim().toUpperCase();

const formatCustodian = (value) => {
  const raw = String(value || "").trim();
  const normalized = raw.toUpperCase();

  if (!raw || ["-", "UNASSIGNED", "N/A", "NONE", "NULL"].includes(normalized)) {
    return "Unassigned";
  }

  return raw;
};

export default function AssetTable({ assets = [], onEdit, onDeleted }) {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAssets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return assets;

    return assets.filter((asset) => {
      const searchableFields = [
        asset.record_id,
        asset.hostname,
        asset.asset_type,
        asset.serial_number,
        asset.custodian,
        asset.department,
        asset.brand,
        asset.status,
        asset.source,
      ];

      return searchableFields.some((value) =>
        String(value || "").toLowerCase().includes(term)
      );
    });
  }, [assets, searchTerm]);

  const totalPages = Math.ceil(filteredAssets.length / PAGE_SIZE);
  const pagedAssets = filteredAssets.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  useEffect(() => {
    setPage(0);
  }, [searchTerm, assets]);

  const handleDelete = async (asset) => {
    const id = asset?.id || asset?.record_id;
    if (!id) return;

    try {
      const source = asset?.source || (normalize(asset?.asset_type) === "PRINTER" ? "Printer" : "Asset");

      const response = await fetch(
        `${API_BASE}/${id}?source=${encodeURIComponent(source)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Failed to delete asset");
      }

      toast.success(
        normalize(source) === "PRINTER"
          ? "Printer deleted successfully"
          : "Asset deleted successfully"
      );
      onDeleted?.();
    } catch (error) {
      console.error("Delete asset error:", error);
      toast.error(error.message || "Failed to delete asset");
    }
  };

  const statusBadge = (status) => {
    const normalizedStatus = normalize(status);

    const colors = {
      WORKING: "bg-emerald-100 text-emerald-700",
      "NOT WORKING": "bg-rose-100 text-rose-700",
      DEFECTIVE: "bg-rose-100 text-rose-700",
      "UNDER REPAIR": "bg-orange-100 text-orange-700",
      "FOR RE-DEPLOYMENT": "bg-amber-100 text-amber-700",
      "FOR REDEPLOYMENT": "bg-amber-100 text-amber-700",
      INACTIVE: "bg-slate-100 text-slate-700",
      "FOR DISPOSAL": "bg-slate-200 text-slate-700",
      RETIRED: "bg-slate-200 text-slate-700",
    };

    return (
      <span
        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
          colors[normalizedStatus] || "bg-slate-100 text-slate-600"
        }`}
      >
        {status || "-"}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm">
      <div className="px-6 pt-6 pb-4 border-b border-sky-100 bg-sky-50/60">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search in this category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-blue-300 bg-blue-300">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Hostname
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                Serial Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                Custodian
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                Brand
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {pagedAssets.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-16 text-slate-400 text-sm"
                >
                  {searchTerm ? "No matching assets found" : "No assets found"}
                </td>
              </tr>
            ) : (
              pagedAssets.map((asset) => (
                <tr
                  key={`${asset.source || "Asset"}-${asset.id || asset.record_id}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {asset.hostname || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {asset.asset_type || "-"}
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell font-mono text-xs text-slate-500">
                    {asset.serial_number || "-"}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-slate-600">
                    {formatCustodian(asset.custodian)}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-600">
                    {asset.department || "-"}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-600">
                    {asset.brand || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(asset.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={() => onEdit?.(asset)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>"{asset.hostname || asset.record_id || "this item"}"</strong>? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 rounded-xl"
                              onClick={() => handleDelete(asset)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-sky-100 bg-sky-50">
        <span className="text-xs text-slate-500 font-medium">
          {filteredAssets.length > 0
            ? `Showing ${page * PAGE_SIZE + 1}–${Math.min(
                (page + 1) * PAGE_SIZE,
                filteredAssets.length
              )} of ${filteredAssets.length} assets`
            : `Showing 0 of ${filteredAssets.length} assets`}
        </span>

        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 border-slate-200 hover:bg-white"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 border-slate-200 hover:bg-white"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}