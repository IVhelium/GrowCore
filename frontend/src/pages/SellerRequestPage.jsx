import { useEffect, useState } from "react";
import { Building2, FileText, Phone, ShieldCheck } from "lucide-react";
import {
  createSellerRequest,
  getMySellerRequest,
  resubmitSellerRequest,
} from "../api/sellerRequestApi";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import { useAuth } from "../hooks/useAuth";
import { getApiError } from "../utils/getApiError";
import {
  getEmptyFieldMessage,
  getTrimmedFormData,
  hasEmptyRequiredFields,
} from "../utils/formSpaceValidation";
import { showToast } from "../utils/showToast";
import { validateFile } from "../utils/fileValidation";

const benefits = [
  {
    icon: Building2,
    title: "Create your store",
    text: "Publish components, sensors and replacement parts under your own seller profile",
  },
  {
    icon: ShieldCheck,
    title: "Verified seller status",
    text: "After moderation, your products can be listed in the GrowCore catalog",
  },
  {
    icon: FileText,
    title: "Simple moderation",
    text: "Submit your business details and wait for administrator approval",
  },
];

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

function RequestStatus({ request }) {
  if (!request) return null;

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-slate-950">
          Current request
        </span>
        <span
          className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${
            statusStyles[request.status] || "bg-slate-100 text-slate-600"
          }`}
        >
          {request.status}
        </span>
      </div>
      {request.rejectionReason && (
        <p className="mt-3 text-sm leading-6 text-red-600">
          {request.rejectionReason}
        </p>
      )}
    </div>
  );
}

export default function SellerRequestPage() {
  const { isAuthenticated } = useAuth();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadRequest() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const currentRequest = await getMySellerRequest();

        if (isActive) {
          setRequest(currentRequest);
        }
      } catch (error) {
        if (isActive && error?.response?.status !== 404) {
          setErrorMessage(getApiError(error, "Could not load seller request"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadRequest();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      showToast("Please sign in to submit a seller request");
      return;
    }

    const data = getTrimmedFormData(event.currentTarget);
    data.document = selectedDocument || data.document;

    if (
      hasEmptyRequiredFields(data, [
        "fullName",
        "passportId",
        "phoneNumber",
        "country",
        "message",
        "document",
      ])
    ) {
      setErrorMessage(getEmptyFieldMessage());
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const savedRequest = request
        ? await resubmitSellerRequest(data)
        : await createSellerRequest(data);

      setRequest(savedRequest);
      setSelectedDocument(null);
      setDocumentName("");
      showToast("Seller request submitted", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not submit seller request"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const canEdit = !request || request.status === "rejected";

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Seller request"
          title="Become a GrowCore seller"
          text="Apply to sell garden automation parts, sensors, controllers and replacement components"
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-950">
                Seller application
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Fill in the seller details. The administrator will review your
                application
              </p>
            </div>

            {isLoading && (
              <p className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading request...
              </p>
            )}

            <RequestStatus request={request} />

            {errorMessage && (
              <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                {errorMessage}
              </p>
            )}

            <fieldset disabled={!canEdit || isSubmitting} className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Full name"
                name="fullName"
                required
                minLength={2}
                maxLength={100}
                defaultValue={request?.fullName || ""}
                placeholder="Max Green"
              />

              <FormField
                label="Passport ID"
                name="passportId"
                required
                minLength={8}
                maxLength={10}
                pattern="[A-Za-z0-9]{8,10}"
                title="Use 8-10 letters and numbers"
                defaultValue={request?.passportId || ""}
                placeholder="AB123456"
              />

              <FormField
                label="Phone number"
                name="phoneNumber"
                required
                type="tel"
                pattern="\+?[0-9][0-9 ()-]{6,19}"
                title="Enter a valid phone number using digits, spaces, brackets, + or -"
                defaultValue={request?.phoneNumber || ""}
                placeholder="+1 800 800 8080"
              />

              <FormField
                label="Country"
                name="country"
                required
                minLength={2}
                maxLength={100}
                defaultValue={request?.country || ""}
                placeholder="USA"
              />

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Seller message
                </span>
                <textarea
                  name="message"
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={6}
                  defaultValue={request?.message || ""}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                  placeholder="Describe what products you want to sell, your experience and store details..."
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  PDF documents
                </span>
                <span className="flex min-w-0 cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm transition hover:border-[#4F8A5B] sm:flex-row sm:items-center">
                  <span className="inline-flex min-h-11 w-fit shrink-0 items-center rounded-md bg-[#4F8A5B] px-4 py-2 font-semibold text-white transition hover:bg-[#3F7148]">
                    Choose PDF file
                  </span>
                  <span className="block min-w-0 max-w-full truncate text-slate-500" title={documentName || request?.documentName || "No file selected"}>
                    {documentName || request?.documentName || "No file selected"}
                  </span>
                  <input
                    name="document"
                    type="file"
                    accept="application/pdf"
                    required
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      const validationError = validateFile(file, {
                        allowedTypes: ["application/pdf"],
                        maxSizeMb: 10,
                        label: "Document",
                      });
                      if (validationError) {
                        setErrorMessage(validationError);
                        event.target.value = "";
                        return;
                      }

                      setErrorMessage("");
                      setSelectedDocument(file);
                      setDocumentName(file.name);
                    }}
                    className="sr-only"
                  />
                </span>
                {request?.documentName && (
                  <span className="block max-w-full truncate text-xs text-slate-500" title={request.documentName}>
                    Last uploaded: {request.documentName}
                  </span>
                )}
              </label>
            </fieldset>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={!canEdit || isSubmitting} className="w-full sm:w-auto">
                {isSubmitting
                  ? "Submitting..."
                  : request
                    ? "Resubmit application"
                    : "Submit application"}
              </Button>
            </div>
          </form>

          <aside className="grid gap-4">
            {benefits.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.text}
                  </p>
                </article>
              );
            })}

            <article className="rounded-xl border border-[#4F8A5B]/20 bg-[#F2F8F3] p-5">
              <div className="flex items-center gap-3">
                <Phone className="text-[#4F8A5B]" size={20} />
                <h3 className="font-bold text-slate-950">Need help?</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Contact support if you are not sure how to prepare a seller
                request
              </p>
            </article>
          </aside>
        </div>
      </Container>
    </main>
  );
}
