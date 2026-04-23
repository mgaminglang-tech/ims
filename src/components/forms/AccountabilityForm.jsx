import { Button } from "@/components/ui/button";
import { Printer, RotateCcw } from "lucide-react";

const LineInput = ({
  className = "",
  type = "text",
  value = "",
  readOnly = true,
}) => (
  <input
    type={type}
    value={value ?? ""}
    readOnly={readOnly}
    className={`w-full h-4 border-0 border-b border-black outline-none bg-transparent text-black px-1 text-[10px] ${className}`}
  />
);

const CheckBox = ({ label, checked = false }) => (
  <label className="flex items-center gap-1 text-[9px] leading-none">
    <input
      type="checkbox"
      checked={checked}
      readOnly
      className="w-2.5 h-2.5 accent-black"
    />
    <span>{label}</span>
  </label>
);

const SectionTitle = ({ children }) => (
  <div className="bg-black text-white text-center font-bold uppercase tracking-wide py-[2px] text-[10px] leading-none">
    {children}
  </div>
);

export default function AccountabilityForm({
  asset = {},
  employee = {},
  onReset,
}) {
  const handlePrint = () => window.print();

  const handleReset = () => {
    if (onReset) {
      onReset();
      return;
    }
    window.location.reload();
  };

  const safeSpecs =
    typeof asset.specifications === "string"
      ? (() => {
          try {
            return JSON.parse(asset.specifications);
          } catch {
            return {};
          }
        })()
      : asset.specifications || {};

  const isDesktop = (asset.asset_type || "").toLowerCase() === "desktop";
  const isLaptop = (asset.asset_type || "").toLowerCase() === "laptop";
  const isPrinter = (asset.asset_type || "").toLowerCase() === "printer";

  const formatDate = (date) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("en-US");
    } catch {
      return date;
    }
  };

  const brandValue = asset.brand || safeSpecs.brand || "";
  const modelValue = safeSpecs.model || asset.hostname || "";
  const serialValue = asset.serial_number || safeSpecs.serial_number || "";
  const processorValue = asset.processor || safeSpecs.processor || "";
  const memoryValue = asset.ram || safeSpecs.ram || "";
  const storageValue = asset.storage || safeSpecs.storage || "";

  const hddValue = safeSpecs.hdd || safeSpecs.hard_disk_drive || "";
  const ssdValue = safeSpecs.ssd || safeSpecs.solid_state_drive || "";

  const monitorBrand = safeSpecs.monitor_brand || "";
  const monitorModel = safeSpecs.monitor_model || "";
  const monitorSerial = safeSpecs.monitor_serial || "";
  const monitorAssetTag = safeSpecs.monitor_asset_tag || "";

  const upsBrand = safeSpecs.ups_brand || "";
  const upsModel = safeSpecs.ups_model || "";
  const upsSerial = safeSpecs.ups_serial || asset.ups_info || "";

  const printerBrand = safeSpecs.printer_brand || "";
  const printerModel = safeSpecs.printer_model || "";
  const printerSerial = safeSpecs.printer_serial || "";
  const printerAssetTag = safeSpecs.printer_asset_tag || "";

  const specialApps = safeSpecs.special_apps || safeSpecs.apps || "";

  return (
    <>
      <style>{`
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: A4 portrait;
            margin: 4mm;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 4px !important;
            background: #fff !important;
            color: #000 !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          input,
          textarea {
            color: #000 !important;
            background: transparent !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          table, tr, td, th, .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="w-full flex flex-col items-center space-y-4">
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

        <div
          className="print-area bg-white text-black mx-auto border p-2 w-[760px]"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          <div className="border border-black">
            <div className="bg-black text-white text-center font-bold text-lg py-2 uppercase">
              IT Equipment Accountability Form
            </div>

            <div className="text-center font-semibold uppercase border-b border-black py-1 text-[10px]">
              Note: Please write legibly and complete all the information
            </div>

            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 border-r border-black flex items-center justify-center p-2">
                <div className="text-center">
                  <div className="text-sm font-bold leading-tight">SMC GLOBAL POWER</div>
                  <div className="text-[8px] mt-1">A SUBSIDIARY OF SAN MIGUEL CORPORATION</div>
                </div>
              </div>

              <div className="col-span-5 border-r border-black">
                <div className="border-b border-black p-2">
                  <div className="text-[10px] font-bold uppercase mb-1">
                    Full Name (Last Name, First Name M.I.):
                  </div>
                  <LineInput value={asset.custodian || employee.full_name || ""} />
                </div>
                <div className="border-b border-black p-2">
                  <div className="text-[10px] font-bold uppercase mb-1">Position Title:</div>
                  <LineInput value={employee.position_title || ""} />
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-bold uppercase mb-1">Immediate Superior:</div>
                  <LineInput value={employee.immediate_superior || ""} />
                </div>
              </div>

              <div className="col-span-5">
                <div className="border-b border-black p-2">
                  <div className="text-[10px] font-bold uppercase mb-1">
                    Business Unit / Location / Department:
                  </div>
                  <LineInput
                    value={[asset.business_unit, employee.location, asset.department]
                      .filter(Boolean)
                      .join(" / ")}
                  />
                </div>
                <div className="border-b border-black p-2">
                  <div className="text-[10px] font-bold uppercase mb-1">SMC Email Address:</div>
                  <LineInput value={employee.email || ""} />
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-bold uppercase mb-1">Contact Number:</div>
                  <LineInput value={employee.contact_number || ""} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="border-r border-black">
                <SectionTitle>Computer Information</SectionTitle>

                <div className="p-2 space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <div>
                      <div className="font-semibold mb-1">Machine Type:</div>
                      <div className="space-y-1">
                        <CheckBox label="Desktop" checked={isDesktop} />
                        <CheckBox label="Laptop" checked={isLaptop} />
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">&nbsp;</div>
                      <div className="space-y-1">
                        <CheckBox label="Printer" checked={isPrinter} />
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Shared PC?</div>
                      <div className="space-y-1">
                        <CheckBox
                          label="Yes"
                          checked={safeSpecs.shared_pc === "Yes" || safeSpecs.shared_pc === true}
                        />
                        <CheckBox label="No" checked={safeSpecs.shared_pc === "No"} />
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">With AD / Pool?</div>
                      <div className="space-y-1">
                        <CheckBox
                          label="Yes"
                          checked={
                            safeSpecs.with_ad_pool === "Yes" ||
                            safeSpecs.with_ad_pool === true
                          }
                        />
                        <CheckBox label="No" checked={safeSpecs.with_ad_pool === "No"} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[125px_1fr] gap-2 items-center text-[10px]">
                    <div className="font-semibold">Asset Tag:</div>
                    <LineInput value={asset.record_id || ""} />
                    <div className="font-semibold">LAN MAC Address:</div>
                    <LineInput value={asset.ip_mac_address || ""} />
                    <div className="font-semibold">WLAN MAC Address:</div>
                    <LineInput value={asset.wlan_address || ""} />
                  </div>
                </div>

                <SectionTitle>Specifications</SectionTitle>
                <div className="p-2">
                  <div className="grid grid-cols-[125px_1fr] gap-2 items-center text-[10px]">
                    <div className="font-semibold">Brand:</div>
                    <LineInput value={brandValue} />
                    <div className="font-semibold">Model:</div>
                    <LineInput value={modelValue} />
                    <div className="font-semibold">Serial Number:</div>
                    <LineInput value={serialValue} />
                    <div className="font-semibold">Processor:</div>
                    <LineInput value={processorValue} />
                    <div className="font-semibold">Memory:</div>
                    <LineInput value={memoryValue} />
                    <div className="font-semibold">Hard Disk Drive:</div>
                    <LineInput value={hddValue} />
                    <div className="font-semibold">Solid State Drive:</div>
                    <LineInput value={ssdValue || storageValue} />
                  </div>
                </div>

                <SectionTitle>LCD Monitor</SectionTitle>
                <div className="p-1">
                  <div className="grid grid-cols-[115px_1fr] gap-1 items-center text-[10px]">
                    <div className="font-semibold">Brand:</div>
                    <LineInput value={monitorBrand} />
                    <div className="font-semibold">Model:</div>
                    <LineInput value={monitorModel} />
                    <div className="font-semibold">Serial Number:</div>
                    <LineInput value={monitorSerial || asset.monitor_info || ""} />
                    <div className="font-semibold">Asset Tag:</div>
                    <LineInput value={monitorAssetTag} />
                  </div>
                </div>

                <SectionTitle>UPS</SectionTitle>
                <div className="p-1">
                  <div className="grid grid-cols-[115px_1fr] gap-1 items-center text-[10px]">
                    <div className="font-semibold">Brand:</div>
                    <LineInput value={upsBrand} />
                    <div className="font-semibold">Model:</div>
                    <LineInput value={upsModel} />
                    <div className="font-semibold">Serial Number:</div>
                    <LineInput value={upsSerial} />
                  </div>
                </div>

                <SectionTitle>Printer</SectionTitle>
                <div className="p-1">
                  <div className="grid grid-cols-[115px_1fr] gap-1 items-center text-[10px]">
                    <div className="font-semibold">Brand:</div>
                    <LineInput
                      value={printerBrand || (isPrinter ? asset.brand || "" : "")}
                    />
                    <div className="font-semibold">Model:</div>
                    <LineInput
                      value={printerModel || (isPrinter ? asset.hostname || "" : "")}
                    />
                    <div className="font-semibold">Serial Number:</div>
                    <LineInput
                      value={printerSerial || (isPrinter ? asset.serial_number || "" : "")}
                    />
                    <div className="font-semibold">Asset Tag:</div>
                    <LineInput
                      value={printerAssetTag || (isPrinter ? asset.record_id || "" : "")}
                    />
                  </div>
                </div>

                <SectionTitle>Peripherals</SectionTitle>
                <div className="p-1 space-y-1">
                  <div className="grid grid-cols-[115px_1fr] gap-1 items-center text-[10px]">
                    <div className="font-semibold">External HDD:</div>
                    <LineInput value={safeSpecs.external_hdd || ""} />
                    <div className="font-semibold">Serial Number:</div>
                    <LineInput value={safeSpecs.external_hdd_serial || ""} />
                    <div className="font-semibold">Asset Tag:</div>
                    <LineInput value={safeSpecs.external_hdd_asset_tag || ""} />
                  </div>

                  <div className="flex flex-wrap gap-1 pt-0">
                    <CheckBox label="Kensington Lock" checked={!!safeSpecs.kensington_lock} />
                    <CheckBox label="Bag" checked={!!safeSpecs.bag} />
                    <CheckBox label="Mouse" checked={!!safeSpecs.mouse} />
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle>Licences / Applications Installed</SectionTitle>
                <div className="p-2 space-y-2 text-[10px]">
                  <div className="grid grid-cols-[125px_1fr] gap-2 items-center">
                    <div className="font-semibold">Operating System:</div>
                    <LineInput value={asset.os_version || ""} />
                    <div className="font-semibold italic">Product Key:</div>
                    <LineInput value={safeSpecs.os_product_key || ""} />
                    <div></div>
                    <LineInput value="" />
                  </div>

                  <div className="grid grid-cols-[125px_1fr] gap-2 items-center">
                    <div className="font-semibold">Microsoft Office:</div>
                    <LineInput value={asset.office_version || ""} />
                    <div className="font-semibold italic">Product Key:</div>
                    <LineInput value={asset.office_key || ""} />
                    <div></div>
                    <LineInput value="" />
                  </div>

                  <div className="grid grid-cols-[125px_1fr] gap-2 items-center">
                    <div className="font-semibold">O365 Version:</div>
                    <LineInput value={asset.office_version || ""} />
                  </div>

                  <div className="grid grid-cols-[125px_1fr] gap-2 items-center">
                    <div className="font-semibold">Special Apps:</div>
                    <LineInput value={specialApps} />
                    <div className="font-semibold italic">Product Key:</div>
                    <LineInput value={safeSpecs.special_apps_key || ""} />
                    <div></div>
                    <LineInput value="" />
                  </div>
                </div>

                <SectionTitle>Remarks</SectionTitle>
                <div className="p-1 space-y-1">
                  <LineInput value={asset.status || ""} />
                  <LineInput value={safeSpecs.remarks || ""} />
                </div>

                <SectionTitle>Acknowledgement</SectionTitle>
                <div className="p-1">
                  <div className="grid grid-cols-[110px_1fr] gap-1 items-center text-[10px]">
                    <div className="font-semibold">Signature:</div>
                    <LineInput value="" />
                    <div className="font-semibold">Date:</div>
                    <LineInput value={formatDate(new Date())} />
                    <div className="font-semibold">Date Delivered:</div>
                    <LineInput value={formatDate(asset.created_at)} />
                    <div className="font-semibold">Date Deployed:</div>
                    <LineInput value={formatDate(asset.updated_at || asset.created_at)} />
                    <div className="font-semibold">Evaluated By:</div>
                    <LineInput value={employee.evaluated_by || ""} />
                    <div className="font-semibold">Date:</div>
                    <LineInput value="" />
                  </div>
                </div>

                <div className="p-1 pt-1 space-y-1 text-[9px]">
                  <div className="grid grid-cols-[125px_1fr] gap-1 items-center">
                    <div className="font-semibold">Returned By & Date:</div>
                    <LineInput value="" />
                  </div>

                  <div className="grid grid-cols-[125px_1fr] gap-1 items-center">
                    <div className="font-semibold">Received By:</div>
                    <LineInput value="" />
                  </div>

                  <div
                    className="text-center leading-3 pt-1 text-[8px]"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    <p>
                      This certifies that you agreed with the SMCGPH IST Policy&apos;s terms and
                      conditions.
                    </p>
                    <p>
                      For any loss of IT Equipment/s stated above, the signatory will replace the
                      lost equipment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-black px-2 py-[1px] text-[8px] font-semibold">
              Information System and Technology (IST)
            </div>
          </div>
        </div>
      </div>
    </>
  );
}