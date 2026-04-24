import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

const API_URL = "https://api.mervinautomation.it.com/api";

export default function ReturnItemForm() {
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [form, setForm] = useState({
    actual_return_date: "",
    returned_by: "",
    return_condition: "GOOD",
    remarks: "",
  });

  useEffect(() => {
    loadBorrowRecords();
  }, []);

  const loadBorrowRecords = async () => {
    try {
      const res = await axios.get(`${API_URL}/borrow-records`);
      const data = Array.isArray(res.data) ? res.data : [];

      const activeBorrowed = data.filter(
        (item) => String(item.status || "").trim().toLowerCase() === "borrowed"
      );

      setBorrowRecords(activeBorrowed);
    } catch (error) {
      console.error("Error loading borrow records:", error);
      setBorrowRecords([]);
    }
  };

  const handleSelect = (e) => {
    const value = e.target.value;
    setSelectedId(value);

    const record =
      borrowRecords.find((item) => String(item.id) === String(value)) || null;

    setSelectedRecord(record);

    if (record) {
      setForm((prev) => ({
        ...prev,
        actual_return_date: new Date().toISOString().split("T")[0],
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReturn = async () => {
    try {
      if (!selectedRecord) {
        alert("Please select a borrowed record.");
        return;
      }

      if (!form.actual_return_date) {
        alert("Please select actual return date.");
        return;
      }

      if (!form.returned_by.trim()) {
        alert("Please enter returned by.");
        return;
      }

      await axios.put(`${API_URL}/borrow-records/${selectedRecord.id}/return`, {
        actual_return_date: form.actual_return_date,
        returned_by: form.returned_by,
        return_condition: form.return_condition,
        remarks: form.remarks,
      });

      alert("Item marked as returned.");

      setSelectedId("");
      setSelectedRecord(null);
      setForm({
        actual_return_date: "",
        returned_by: "",
        return_condition: "GOOD",
        remarks: "",
      });

      loadBorrowRecords();
    } catch (error) {
      console.error("Error returning item:", error);
      alert(
        error?.response?.data?.message || "Failed to return item."
      );
    }
  };

  return (
    <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-bold text-slate-900">Return Item</h2>
      <p className="mt-2 text-sm text-slate-500">
        Close an active borrowing transaction.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Borrowed Item
          </label>
          <select
            value={selectedId}
            onChange={handleSelect}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Choose borrowed record</option>
            {borrowRecords.map((record) => (
              <option key={record.id} value={record.id}>
                {record.asset_hostname || "No Hostname"} •{" "}
                {record.borrower_name || "No Borrower"} •{" "}
                {record.asset_serial || "No Serial"}
              </option>
            ))}
          </select>
        </div>

        {selectedRecord && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Borrower Name</p>
                <p className="font-medium">{selectedRecord.borrower_name || "-"}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Department</p>
                <p className="font-medium">{selectedRecord.department || "-"}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Asset Hostname</p>
                <p className="font-medium">{selectedRecord.asset_hostname || "-"}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Serial Number</p>
                <p className="font-medium">{selectedRecord.asset_serial || "-"}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Borrow Date</p>
                <p className="font-medium">
                  {selectedRecord.borrow_date
                    ? new Date(selectedRecord.borrow_date).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Expected Return Date</p>
                <p className="font-medium">
                  {selectedRecord.expected_return_date
                    ? new Date(selectedRecord.expected_return_date).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Actual Return Date
                </label>
                <input
                  type="date"
                  name="actual_return_date"
                  value={form.actual_return_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Returned By
                </label>
                <input
                  type="text"
                  name="returned_by"
                  value={form.returned_by}
                  onChange={handleChange}
                  placeholder="Enter name of person returning item"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Return Condition
              </label>
              <select
                name="return_condition"
                value={form.return_condition}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="GOOD">GOOD</option>
                <option value="DAMAGED">DAMAGED</option>
                <option value="NOT WORKING">NOT WORKING</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={4}
                placeholder="Optional remarks"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <Button
              type="button"
              onClick={handleReturn}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-base rounded-lg shadow-sm"
            >
              Mark as Returned
            </Button>
          </>
        )}
      </div>
    </div>
  );
}