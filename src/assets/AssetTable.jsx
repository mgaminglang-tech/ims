import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function AssetTable({ assets = [], onEdit, onDeleted }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(assets.length / PAGE_SIZE);
  const pagedAssets = assets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = async (id) => {
    if (!id) return;

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Failed to delete asset");
      }

      toast.success("Asset deleted successfully");
      onDeleted?.();
    } catch (error) {
      console.error("Delete asset error:", error);
      toast.error(error.message || "Failed to delete asset");
    }
  };

  const statusBadge = (status) => {
    const colors = {
      WORKING: "bg-emerald-100 text-emerald-800",
      "NOT WORKING": "bg-red-100 text-red-800",
      DEFECTIVE: "bg-red-100 text-red-800",
      "FOR RE-DEPLOYMENT": "bg-amber-100 text-amber-800",
      "FOR DISPOSAL": "bg-slate-200 text-slate-700",
    };

    return (
      <span
        className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full ${
          colors[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/80 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold">Hostname</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold hidden sm:table-cell">
                Serial
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold hidden md:table-cell">
                Custodian
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold hidden lg:table-cell">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold hidden lg:table-cell">
                Brand
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pagedAssets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  No assets found
                </td>
              </tr>
            ) : (
              pagedAssets.map((asset, index) => (
                <tr
                  key={asset.id || asset.record_id}
                  className={`border-b border-border hover:bg-muted/50 transition-colors ${
                    index % 2 === 1 ? "bg-muted/30" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{asset.hostname}</td>
                  <td className="px-4 py-3">{asset.asset_type}</td>
                  <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs">
                    {asset.serial_number}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{asset.custodian}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{asset.department}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{asset.brand}</td>
                  <td className="px-4 py-3">{statusBadge(asset.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit?.(asset)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>"{asset.hostname}"</strong>? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDelete(asset.id || asset.record_id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          <span className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, assets.length)} of {assets.length}
          </span>

          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}