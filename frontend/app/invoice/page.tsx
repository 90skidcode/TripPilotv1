"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { invoicesApi, leadsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimit } from "@/hooks/usePlanLimit";
import { useToast } from "@/components/Toast";

interface LineItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

function InvoiceContent() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("bills" as any, "write") || hasPermission("vouchers", "write");
  const { getStatus, hasWriteAccess } = usePlanLimit();
  const billsStatus = getStatus("bills");
  const trialExpired = !hasWriteAccess;

  const [invoices, setInvoices] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [showDrawer, setShowDrawer] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [leadId, setLeadId] = useState<string>("");
  const [agencyName, setAgencyName] = useState("TripPilot Travel Solutions");
  const [agencyAddress, setAgencyAddress] = useState("404 Silicon Tower, Sector 62, Noida, UP, 201301");
  const [agencyGst, setAgencyGst] = useState("09AAACP4040N1ZX");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGst, setCustomerGst] = useState("");
  const [bookingType, setBookingType] = useState("Package Tour");
  const [advancePayment, setAdvancePayment] = useState("0");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Luxury Tour package per Couple", qty: 1, rate: 35000, amount: 35000 }
  ]);

  const itemsSubtotal = lineItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const gstRate = 0.05;
  const computedGst = itemsSubtotal * gstRate;
  const computedGrandTotal = itemsSubtotal + computedGst;
  const dueAmount = computedGrandTotal - parseFloat(advancePayment || "0");

  useEffect(() => {
    leadsApi.list({ limit: 100 })
      .then(data => setLeads(data?.leads || []))
      .catch(err => console.error("Failed to load leads", err));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoicesApi.list({ page, per_page: 10 });
      setInvoices(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When arriving from a lead workspace (?lead_id=…), open the create drawer
  // prefilled with that lead's customer details.
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("lead_id");
  useEffect(() => {
    if (!leadIdParam) return;
    openCreateDrawer();
    setLeadId(leadIdParam);
    leadsApi.get(Number(leadIdParam)).then((lead) => {
      const c = lead?.customer;
      if (c) {
        setCustomerName(c.name || "");
        setCustomerEmail(c.email || "");
        setCustomerPhone(c.phone || "");
      }
      if (lead?.destination) setCustomerAddress(lead.destination);
    }).catch((err) => console.error("Failed to prefill lead:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadIdParam]);

  function handleAddLineItem() {
    setLineItems([...lineItems, { description: "", qty: 1, rate: 0, amount: 0 }]);
  }

  function handleRemoveLineItem(index: number) {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function handleLineItemChange(index: number, field: keyof LineItem, val: string | number) {
    const updated = [...lineItems];
    const item = { ...updated[index] };

    if (field === "qty" || field === "rate") {
      const numVal = parseFloat(val as string) || 0;
      if (field === "qty") item.qty = numVal;
      else item.rate = numVal;
      item.amount = item.qty * item.rate;
    } else if (field === "description") {
      item.description = val as string;
    }
    updated[index] = item;
    setLineItems(updated);
  }

  function handleSelectLead(idStr: string) {
    setLeadId(idStr);
    if (!idStr) return;
    const selected = leads.find(l => l.id.toString() === idStr);
    if (selected) {
      setCustomerName(selected.name || "");
      setCustomerEmail(selected.email || "");
      setCustomerPhone(selected.phone || "");
      setCustomerAddress(selected.destination || "");
    }
  }

  function openCreateDrawer() {
    setEditId(null);
    setLeadId("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerGst("");
    setBookingType("Package Tour");
    setAdvancePayment("0");
    setLineItems([{ description: "Tour Package Booking Summary", qty: 1, rate: 25000, amount: 25000 }]);
    setShowDrawer(true);
  }

  function openEditDrawer(inv: any) {
    setEditId(inv.id);
    setLeadId(inv.lead_id?.toString() || "");
    setAgencyName(inv.agency_name || "");
    setAgencyAddress(inv.agency_address || "");
    setAgencyGst(inv.agency_gst || "");
    setCustomerName(inv.customer_name || "");
    setCustomerEmail(inv.customer_email || "");
    setCustomerPhone(inv.customer_phone || "");
    setCustomerAddress(inv.customer_address || "");
    setCustomerGst(inv.customer_gst || "");
    setBookingType(inv.booking_type || "Package Tour");
    setAdvancePayment(inv.advance_payment || "0");

    if (inv.line_items) {
      try {
        const parsed = typeof inv.line_items === "string" ? JSON.parse(inv.line_items) : inv.line_items;
        setLineItems(parsed || []);
      } catch (e) {
        setLineItems([{ description: "Booking Line Items", qty: 1, rate: parseFloat(inv.subtotal) || 0, amount: parseFloat(inv.subtotal) || 0 }]);
      }
    }
    setShowDrawer(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName) {
      showToast({ type: "error", message: "Customer Name is required." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        lead_id: leadId ? parseInt(leadId) : null,
        agency_name: agencyName,
        agency_address: agencyAddress,
        agency_gst: agencyGst,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_gst: customerGst,
        booking_type: bookingType,
        line_items: lineItems,
        subtotal: itemsSubtotal.toString(),
        advance_payment: advancePayment,
        total_gst: computedGst.toString(),
        grand_total: computedGrandTotal.toString(),
      };

      if (editId) {
        await invoicesApi.update(editId, payload);
        showToast({ type: "success", message: "✓ Invoice updated successfully" });
      } else {
        await invoicesApi.create(payload);
        showToast({ type: "success", message: "✓ Invoice created successfully" });
      }

      setShowDrawer(false);
      loadData();
    } catch (err: any) {
      showToast({ type: "error", message: `✕ Failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Generate Invoice">
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <PageHeader
                title="Billing & Invoices"
                description="Create and manage customer invoices with GST"
              />
              {billsStatus && (
                <p className="text-sm text-muted-foreground mt-1">
                  {billsStatus.used}/{billsStatus.limit} invoices used
                </p>
              )}
            </div>
            {canWrite && (
              <Button
                variant="primary"
                disabled={trialExpired || (billsStatus && !billsStatus.canCreate)}
                title={
                  trialExpired
                    ? "Trial period expired. Please upgrade your plan."
                    : billsStatus && !billsStatus.canCreate
                      ? `You've reached the limit of ${billsStatus.limit} invoices`
                      : ""
                }
                onClick={openCreateDrawer}
              >
                ＋ Create Invoice
              </Button>
            )}
          </div>

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices ({total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground py-8 text-center">Loading invoices...</p>
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center">No invoices yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 font-semibold text-left">Customer</th>
                        <th className="px-4 py-3 font-semibold text-left">Amount</th>
                        <th className="px-4 py-3 font-semibold text-left">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{inv.customer_name}</td>
                          <td className="px-4 py-3">₹{parseFloat(inv.grand_total || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            {canWrite && (
                              <Button variant="outline" size="sm" onClick={() => openEditDrawer(inv)}>
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(pages)} disabled={page === pages}>»</Button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer */}
        {showDrawer && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setShowDrawer(false)}>
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{editId ? "Edit Invoice" : "Create Invoice"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Fill in customer and line item details</p>
                  </div>
                  <button onClick={() => setShowDrawer(false)} className="text-muted-foreground text-xl">✕</button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSave} className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadId">Select Lead</Label>
                    <select
                      id="leadId"
                      value={leadId}
                      onChange={(e) => handleSelectLead(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                    >
                      <option value="">-- Select Lead --</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input id="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                </div>

                <Separator />

                {/* Line Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Line Items</h4>
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                      <Input placeholder="Description" value={item.description} onChange={(e) => handleLineItemChange(idx, "description", e.target.value)} />
                      <Input type="number" placeholder="Qty" value={item.qty} onChange={(e) => handleLineItemChange(idx, "qty", e.target.value)} />
                      <Input type="number" placeholder="Rate" value={item.rate} onChange={(e) => handleLineItemChange(idx, "rate", e.target.value)} />
                      <div className="flex gap-2">
                        <span className="font-semibold">₹{item.amount.toLocaleString()}</span>
                        <button type="button" onClick={() => handleRemoveLineItem(idx)} className="text-destructive text-sm">🗑️</button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                    ＋ Add Item
                  </Button>
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2 bg-muted p-4 rounded-lg">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{itemsSubtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>GST (5%):</span><span>₹{computedGst.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold"><span>Grand Total:</span><span>₹{computedGrandTotal.toLocaleString()}</span></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advancePayment">Advance Payment</Label>
                  <Input id="advancePayment" type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Due: ₹{dueAmount.toLocaleString()}</p>
                </div>
              </form>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-border p-6 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowDrawer(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Invoice"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
