import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  FileImage,
  File,
  FileSpreadsheet,
  X,
  Eye,
  ChevronRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL || "https://api.mervinautomation.it.com/api";

const getFileIcon = (fileType) => {
  if (!fileType) return <File className="w-5 h-5 text-slate-400" />;
  if (fileType.startsWith("image/")) return <FileImage className="w-5 h-5 text-purple-500" />;
  if (fileType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) {
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  }
  if (fileType.includes("word") || fileType.includes("document")) {
    return <FileText className="w-5 h-5 text-blue-600" />;
  }
  return <File className="w-5 h-5 text-slate-400" />;
};

const getTypeBadge = (fileType) => {
  if (!fileType) return "bg-slate-100 text-slate-600";
  if (fileType.startsWith("image/")) return "bg-purple-100 text-purple-700";
  if (fileType === "application/pdf") return "bg-red-100 text-red-700";
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) {
    return "bg-green-100 text-green-700";
  }
  if (fileType.includes("word") || fileType.includes("document")) {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-slate-100 text-slate-600";
};

const formatFileSize = (bytes) => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [documentName, setDocumentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);

  const toggleSelectDoc = (id) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const loadDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`);
      setDocuments(res.data.data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      alert("Please choose at least one file first.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      if (documentName.trim()) {
        formData.append("document_name", documentName.trim());
      }

      await axios.post(`${API_URL}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFiles([]);
      setDocumentName("");
      loadDocuments();
      alert("Documents uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      alert(error?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id) => {
    window.open(`${API_URL}/documents/${id}/download`, "_blank");
  };

  const handleDownloadSelected = async () => {
    if (selectedDocs.length === 0) {
      alert("Please select at least one document.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/documents/download-multiple`,
        { ids: selectedDocs },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "documents.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Multiple download error:", error);
      alert(error?.response?.data?.message || "Failed to download selected documents.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await axios.delete(`${API_URL}/documents/${id}`);
      if (previewDoc?.id === id) closePreview();
      setSelectedDocs((prev) => prev.filter((docId) => docId !== id));
      loadDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    }
  };

  const handlePreview = async (doc) => {
    if (previewDoc?.id === doc.id) {
      closePreview();
      return;
    }

    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewLoading(true);

    try {
      const res = await axios.get(`${API_URL}/documents/${doc.id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: doc.file_type });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Preview error:", error);
      alert("Failed to load preview.");
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm">Loading preview...</p>
        </div>
      );
    }

    if (!previewUrl || !previewDoc) return null;
    const type = previewDoc.file_type || "";

    if (type.startsWith("image/")) {
      return (
        <div className="flex justify-center">
          <img
            src={previewUrl}
            alt={previewDoc.document_name}
            className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-sm"
          />
        </div>
      );
    }

    if (type === "application/pdf") {
      return (
        <iframe
          src={previewUrl}
          title={previewDoc.document_name}
          className="w-full h-[70vh] rounded-2xl border border-slate-200 bg-white"
        />
      );
    }

    return (
      <div className="text-center py-14 text-slate-500">
        <File className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium text-slate-700">Preview not available for this file type.</p>
        <p className="text-sm mt-1">Please use download to open this document.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload, organize, preview, and manage stored documents in SQL Server.
        </p>
      </div>

      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <Upload className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add one or more files, assign an optional group name, and save them to your document library.
              </p>
            </div>

            <input
              type="text"
              placeholder="Optional group name / note"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <span className="text-sm font-medium text-slate-700 block mb-3">Choose files</span>

  <div className="flex items-center gap-3">
    <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        className="hidden"
      />
      Choose Files
    </label>

    <span className="text-sm text-slate-500 truncate">
      {files.length > 0
        ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
        : "No files selected"}
    </span>
  </div>

  {files.length > 0 && (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-sm font-medium text-slate-800 mb-2">
        Selected files ({files.length})
      </p>
      <div className="space-y-1 max-h-40 overflow-auto">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="text-sm text-slate-600 truncate"
          >
            {file.name} · {formatFileSize(file.size)}
          </div>
        ))}
      </div>
    </div>
  )}
</div>

            <Button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? "Uploading..." : `Upload ${files.length > 1 ? "Documents" : "Document"}`}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-sky-100 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-sky-100 bg-sky-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Saved Documents{" "}
            <span className="text-sm font-normal text-slate-500">
              ({documents.length} file{documents.length !== 1 ? "s" : ""})
            </span>
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSelected}
            disabled={selectedDocs.length === 0}
            className="rounded-xl border-slate-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Selected
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-14 text-center text-slate-500">
            <File className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors group ${
                  previewDoc?.id === doc.id
                    ? "bg-emerald-50 border-l-4 border-l-emerald-500"
                    : "hover:bg-slate-50 border-l-4 border-l-transparent"
                }`}
                onClick={() => handlePreview(doc)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectDoc(doc.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4"
                  />

                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      previewDoc?.id === doc.id ? "rotate-90 text-emerald-600" : ""
                    }`}
                  />

                  <div className="shrink-0">{getFileIcon(doc.file_type)}</div>

                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{doc.document_name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {doc.file_name} · {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBadge(doc.file_type)}`}
                  >
                    {(doc.file_type?.split("/")[1] || "FILE").toUpperCase()}
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => handlePreview(doc)}
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => handleDownload(doc.id)}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewDoc && (
        <div className="rounded-3xl border border-sky-100 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-sky-50">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{previewDoc.document_name}</h3>
              <p className="text-sm text-slate-500 truncate">
                {previewDoc.file_name} · {formatFileSize(previewDoc.file_size)}
              </p>
            </div>

            <Button variant="ghost" size="icon" onClick={closePreview} className="rounded-xl">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6 bg-slate-50 min-h-[240px]">{renderPreview()}</div>
        </div>
      )}
    </div>
  );
}