import { useState } from "react";
import { FileSearch, X } from "lucide-react";
import { getSellerRequestDocument } from "../../api/sellerRequestApi";
import Button from "../../components/common/Button";
import ImageWithFallback from "../../components/common/ImageWithFallback";
import { formatPrice } from "../../utils/formatPrice";
import { AttributeChips, DetailRow, StatusBadge } from "./AdminShared";
import { formatAdminDateTime } from "./adminUtils";

export default function AdminReviewModal({ detail, onClose }) {
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);

  if (!detail) return null;

  const { type, item } = detail;
  const isSellerRequest = type === "seller-request";
  const title = isSellerRequest ? "Seller request details" : "Product details";

  async function openSellerDocument() {
    const previewWindow = window.open("about:blank", "_blank");
    setIsDocumentLoading(true);

    try {
      const documentBlob = await getSellerRequestDocument(item.id);
      const documentUrl = URL.createObjectURL(documentBlob);

      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.location.replace(documentUrl);
      } else {
        const link = window.document.createElement("a");
        link.href = documentUrl;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(documentUrl), 60_000);
    } catch {
      previewWindow?.close();
    } finally {
      setIsDocumentLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <section className="max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[90vh]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-[#4F8A5B]">
              Admin review
            </p>
            <h2 className="break-anywhere text-xl font-bold text-slate-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-5.6rem)] overflow-y-auto overflow-x-hidden p-4 sm:max-h-[calc(90vh-73px)] sm:p-5">
          {isSellerRequest ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-anywhere text-2xl font-bold text-slate-950">
                    {item.fullName}
                  </h3>
                  <p className="break-anywhere mt-1 text-sm text-slate-500">
                    Request #{item.id}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
                <DetailRow label="User" value={item.user?.username} />
                <DetailRow label="Public ID" value={item.user?.public_id} />
                <DetailRow label="Passport ID" value={item.passportId} />
                <DetailRow label="Phone" value={item.phoneNumber} />
                <DetailRow label="Country" value={item.country} />
                <DetailRow label="Created" value={item.createdAt} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Seller message
                </p>
                <p className="break-anywhere mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  {item.message}
                </p>
              </div>

              {item.rejectionReason && (
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Rejection reason
                  </p>
                  <p className="break-anywhere mt-2 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-700">
                    {item.rejectionReason}
                  </p>
                </div>
              )}

              <div className="grid min-w-0 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <FileSearch size={20} className="text-[#4F8A5B]" />
                <div className="min-w-0 flex-1">
                  <p className="break-anywhere text-sm font-bold text-slate-950">
                    {item.documentName || "Seller document"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.documentContentType || "application/pdf"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isDocumentLoading}
                  onClick={openSellerDocument}
                  className="w-full sm:w-auto"
                >
                  <FileSearch size={16} />
                  {isDocumentLoading ? "Opening..." : "Open document"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-anywhere text-2xl font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="break-anywhere mt-1 text-sm text-slate-500">
                    Product #{item.id} - {item.store?.name || "Unknown store"}
                  </p>
                </div>
                <StatusBadge status={item.moderationStatus} />
              </div>

              <ImageWithFallback
                src={item.image}
                alt={item.title}
                className="h-80 max-h-80 w-full rounded-lg object-cover"
                iconSize={42}
              />

              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-3">
                <DetailRow label="Category" value={item.category} />
                <DetailRow label="Price" value={formatPrice(item.price)} />
                <DetailRow
                  label="Discount ends"
                  value={item.discountExpiresAt ? formatAdminDateTime(item.discountExpiresAt) : "No expiry"}
                />
                <DetailRow label="Quantity" value={item.quantity} />
                <DetailRow label="Enabled" value={item.enabled ? "Yes" : "No"} />
                <DetailRow label="Store" value={item.store?.name} />
                <DetailRow label="Created" value={item.raw?.created_at} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Description
                </p>
                <p className="break-anywhere mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  {item.description}
                </p>
              </div>

              <AttributeChips attributes={item.attributes} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
