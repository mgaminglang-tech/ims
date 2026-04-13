import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck, Shield, Clock } from "lucide-react";
import AcknowledgedReceipt from "../components/forms/AcknowledgedReceipt";
import AccountabilityForm from "../components/forms/AccountabilityForm";
import BorrowedForm from "../components/ui/Layout";

export default function Forms() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Printable Forms</h1>
        <p className="text-sm text-muted-foreground">Generate and print official IT forms</p>
      </div>

      <Tabs defaultValue="receipt">
        <TabsList className="bg-muted">
          <TabsTrigger value="receipt" className="gap-2"><FileCheck className="w-4 h-4" /> Acknowledged Receipt</TabsTrigger>
          <TabsTrigger value="accountability" className="gap-2"><Shield className="w-4 h-4" /> Accountability Form</TabsTrigger>
          <TabsTrigger value="borrow" className="gap-2"><Clock className="w-4 h-4" /> Borrowed Form</TabsTrigger>
        </TabsList>

        <TabsContent value="receipt" className="mt-4">
          <AcknowledgedReceipt />
        </TabsContent>
        <TabsContent value="accountability" className="mt-4">
          <AccountabilityForm />
        </TabsContent>
        <TabsContent value="borrow" className="mt-4">
          <BorrowedForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}