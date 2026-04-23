import { Button } from "@/components/ui/button";
import { Printer, RotateCcw } from "lucide-react";

export default function AcknowledgedReceipt() {
  const handlePrint = () => window.print();
  const handleReset = () => window.location.reload();

  return (
    <>
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0;
            padding: 0;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          .no-print {
            display: none !important;
          }

          .print-wrapper {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-document {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }

          table, tr, td, th {
            page-break-inside: avoid !important;
          }

          input {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            background: transparent !important;
            color: #000 !important;
            -webkit-appearance: none;
            appearance: none;
          }
        }
      `}</style>

      <div className="space-y-4 print-wrapper">
        <div className="no-print flex gap-3">
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>

          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="print-area print-document bg-white text-black max-w-[850px] mx-auto p-10 border">
          <div
            className="text-center mb-6"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            <div className="mb-2">
              <div className="text-lg font-bold tracking-wide">
                SMC GLOBAL POWER
              </div>
              <div className="text-[11px]">
                A SUBSIDIARY OF SAN MIGUEL CORPORATION
              </div>
            </div>

            <h1 className="text-2xl font-bold mt-6">
              IT Equipment Acknowledge Receipt
            </h1>
            <h2 className="text-xl font-bold">
              Information Systems and Technology (IST)
            </h2>
          </div>

          <table
            className="w-full border-collapse mb-10"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            <thead>
              <tr>
                <th className="border border-black px-2 py-2 text-center w-[70px]">
                  No.
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Item Description
                </th>
                <th className="border border-black px-2 py-2 text-center w-[100px]">
                  Quantity
                </th>
                <th className="border border-black px-2 py-2 text-center w-[160px]">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((num) => (
                <tr key={num}>
                  <td className="border border-black px-2 py-2 text-center align-middle">
                    {num}
                  </td>

                  <td className="border border-black px-1 py-1">
                    <input
                      type="text"
                      className="w-full h-8 bg-transparent text-black px-1 border-0 outline-none"
                    />
                  </td>

                  <td className="border border-black px-1 py-1">
                    <input
                      type="text"
                      className="w-full h-8 bg-transparent text-black text-center px-1 border-0 outline-none"
                    />
                  </td>

                  <td className="border border-black px-1 py-1">
                    <input
                      type="text"
                      className="w-full h-8 bg-transparent text-black px-1 border-0 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="grid grid-cols-2 gap-16 mb-14 text-[16px]"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            <div className="space-y-8">
              <div className="flex items-end gap-3">
                <span className="min-w-[130px]">Released by:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <span className="min-w-[130px]">Department:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-end gap-3">
                <span className="min-w-[110px]">Received by:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <span className="min-w-[110px]">Date:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-16 mb-16 text-[16px]"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            <div className="space-y-8">
              <div className="flex items-end gap-3">
                <span className="min-w-[130px]">Returned by:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <span className="min-w-[130px]">Date:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-end gap-3">
                <span className="min-w-[110px]">Received by:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <span className="min-w-[110px]">Date:</span>
                <div className="border-b border-black flex-1 h-7">
                  <input
                    type="text"
                    className="w-full h-full bg-transparent text-black border-0 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="text-center text-[15px] leading-7 mt-20"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            <p>
              This certifies that you agreed with the SMCGPH IST Policy&apos;s
              terms and conditions
            </p>
            <p>
              For any loss of IT Equipment/s stated above, the signatory will
              replace the lost equipment
            </p>
          </div>
        </div>
      </div>
    </>
  );
}