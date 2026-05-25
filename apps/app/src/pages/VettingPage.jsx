import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "shared/api";
import StepProgress from "../components/StepProgress";
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ImageIcon,
} from "lucide-react";

const STEPS = ["School & Plan", "Credit Vetting", "ISA Education", "Contract"];
const SUB_STEPS = ["ID Verification", "Statement Verification", "Credit Consent"];

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ label, hint, accept, file, onFile, preview }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  const handleChange = (e) => {
    const picked = e.target.files[0];
    if (picked) onFile(picked);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {file ? (
        <div className="relative rounded-xl border-2 border-chaptr-primary bg-green-50 p-4 flex items-center gap-3">
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="text-chaptr-primary" size={24} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-chaptr-dark truncate">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-chaptr-primary flex-shrink-0" size={18} />
            <button
              type="button"
              onClick={() => onFile(null)}
              className="p-1 rounded-full hover:bg-green-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
            dragging
              ? "border-chaptr-primary bg-green-50"
              : "border-gray-200 hover:border-chaptr-hover hover:bg-green-50/50"
          }`}
        >
          {accept?.includes("image") ? (
            <ImageIcon className="text-gray-300" size={28} />
          ) : (
            <Upload className="text-gray-300" size={28} />
          )}
          <p className="text-sm text-gray-500 text-center">
            <span className="font-medium text-chaptr-primary">Click to upload</span>{" "}
            or drag and drop
          </p>
          {hint && <p className="text-xs text-gray-400 text-center">{hint}</p>}
          <p className="text-xs text-gray-300 uppercase tracking-wide">
            {accept === "image/*" ? "JPG, PNG, PDF" : "PDF"}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── Sub-step indicator ───────────────────────────────────────────────────────
function SubStepBar({ current }) {
  return (
    <div className="flex items-center gap-2">
      {SUB_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all ${
                  done
                    ? "bg-chaptr-primary text-white"
                    : active
                    ? "bg-chaptr-primary text-white ring-4 ring-green-100"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 size={12} /> : n}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  active ? "text-chaptr-primary font-medium" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < SUB_STEPS.length - 1 && (
              <div
                className={`h-px w-6 sm:w-10 flex-shrink-0 ${
                  done ? "bg-chaptr-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VettingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subStep, setSubStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Sub-step 1 — ID files
  const [idFront, setIdFront] = useState(null);
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);

  // Sub-step 2 — Statements
  const [mpesaStatement, setMpesaStatement] = useState(null);
  const [bankStatement, setBankStatement] = useState(null);

  // Sub-step 3 — Consent
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentName, setConsentName] = useState("");
  const [consentError, setConsentError] = useState("");

  useEffect(() => {
    api.getApplication(id).then((data) => {
      setApplication(data);
      setLoading(false);
    });
  }, [id]);

  // Generate image preview when file selected
  const handleIdFile = (side, file) => {
    if (side === "front") {
      setIdFront(file);
      setIdFrontPreview(
        file && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null
      );
    } else {
      setIdBack(file);
      setIdBackPreview(
        file && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null
      );
    }
  };

  // ── Sub-step navigation ──
  const canProceedStep1 = idFront && idBack;
  const canProceedStep2 = mpesaStatement && bankStatement;

  const nameMatches =
    consentName.trim().toLowerCase() ===
    (application?.full_name || "").trim().toLowerCase();
  const canProceedStep3 = consentChecked && nameMatches;

  const handleNext = () => {
    if (subStep < 3) {
      setSubStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (subStep > 1) setSubStep((s) => s - 1);
  };

  const handleComplete = async () => {
    if (!nameMatches) {
      setConsentError("Name doesn't match — please type your full name exactly as entered in Step 1.");
      return;
    }
    setSubmitting(true);
    try {
      await api.updateApplication(id, {
        status: "pending_vetting",
        step: 2,
        vetting_completed_at: new Date().toISOString(),
      });
      navigate(`/apply/${id}/education`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] flex items-center justify-center">
        <Loader2 className="animate-spin text-chaptr-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2f9]">
      {/* Main step header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-chaptr-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-chaptr-dark">Chaptr Global</span>
            </div>
          </div>
          <StepProgress current={2} total={4} steps={STEPS} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-chaptr-dark mb-1">
            Credit Vetting
          </h1>
          <p className="text-gray-500 text-sm">
            We need a few documents to verify your identity and assess your application.
          </p>
        </div>

        {/* Sub-step progress */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <SubStepBar current={subStep} />
        </div>

        {/* ── Sub-step 1: ID Verification ── */}
        {subStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-chaptr-dark mb-1">
                  ID Verification
                </h2>
                <p className="text-sm text-gray-500">
                  Upload a clear photo of the front and back of your National ID.
                  Make sure all text is legible and the card is fully visible.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <UploadZone
                  label="ID Front"
                  hint="Front side showing your name and photo"
                  accept="image/*,.pdf"
                  file={idFront}
                  onFile={(f) => handleIdFile("front", f)}
                  preview={idFrontPreview}
                />
                <UploadZone
                  label="ID Back"
                  hint="Back side showing your ID number"
                  accept="image/*,.pdf"
                  file={idBack}
                  onFile={(f) => handleIdFile("back", f)}
                  preview={idBackPreview}
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-2">
                <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={15} />
                <p className="text-xs text-blue-600 leading-relaxed">
                  Accepted formats: JPG, PNG, PDF. Your ID is encrypted and stored
                  securely — it will only be used for identity verification.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedStep1}
                className="inline-flex items-center gap-2 bg-chaptr-primary hover:bg-chaptr-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-green-100"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Sub-step 2: Statement Verification ── */}
        {subStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-7">
              <div>
                <h2 className="text-base font-semibold text-chaptr-dark mb-1">
                  Statement Verification
                </h2>
                <p className="text-sm text-gray-500">
                  Upload your financial statements so we can assess your repayment capacity.
                </p>
              </div>

              {/* M-Pesa */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-chaptr-primary">M</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">M-Pesa Statement</h3>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1 leading-relaxed">
                  <p className="font-medium text-gray-700">How to get your M-Pesa statement:</p>
                  <p>Open M-Pesa app → <span className="font-medium">More</span> → <span className="font-medium">M-Pesa Statement</span> → <span className="font-medium">Request Statement</span></p>
                  <p>Download the PDF and upload it below.</p>
                </div>
                <UploadZone
                  label=""
                  hint="PDF only — last 6 months preferred"
                  accept=".pdf"
                  file={mpesaStatement}
                  onFile={setMpesaStatement}
                  preview={null}
                />
              </div>

              <div className="border-t border-gray-100" />

              {/* Bank Statement */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="text-blue-400" size={14} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Bank Statement</h3>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500 leading-relaxed">
                  Upload your last <span className="font-medium">3 months bank statement</span> PDF
                  from your primary bank account.
                </div>
                <UploadZone
                  label=""
                  hint="PDF only — last 3 months"
                  accept=".pdf"
                  file={bankStatement}
                  onFile={setBankStatement}
                  preview={null}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium px-4 py-3 rounded-xl text-sm transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedStep2}
                className="inline-flex items-center gap-2 bg-chaptr-primary hover:bg-chaptr-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-green-100"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Sub-step 3: Credit Consent ── */}
        {subStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-chaptr-dark mb-1">
                  Credit Bureau Consent
                </h2>
                <p className="text-sm text-gray-500">
                  We need your consent to perform a soft credit check. This will
                  not affect your credit score.
                </p>
              </div>

              {/* Legal text box */}
              <div className="border border-gray-200 rounded-xl bg-gray-50 p-5 max-h-44 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-3">
                <p>
                  I,{" "}
                  <span className="font-semibold text-chaptr-dark">
                    {application?.full_name || "[your name]"}
                  </span>
                  , authorize{" "}
                  <span className="font-semibold text-chaptr-dark">
                    Chaptr Global
                  </span>{" "}
                  to access my credit information from Credit Reference Bureaus
                  (CRBs) in Kenya, including{" "}
                  <span className="font-medium">TransUnion</span> and{" "}
                  <span className="font-medium">Metropol Kenya</span>, for the
                  purpose of evaluating my Income Share Agreement application.
                </p>
                <p>
                  I understand this is a <strong>soft inquiry</strong> and will
                  not affect my credit score. I further understand that this
                  information will be used solely for the purpose of assessing
                  my eligibility for an ISA and will be handled in accordance
                  with Kenya's Data Protection Act, 2019.
                </p>
                <p>
                  I confirm that all documents and information provided in this
                  application are accurate and truthful. I understand that
                  providing false information may result in immediate termination
                  of my ISA and possible legal consequences.
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-chaptr-primary accent-[#3366CC] flex-shrink-0 cursor-pointer"
                />
                <span className="text-sm text-gray-700 leading-snug group-hover:text-chaptr-dark transition-colors">
                  I have read and agree to the credit bureau consent above
                </span>
              </label>

              {/* Typed name confirmation */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Type your full name to confirm
                </label>
                <input
                  type="text"
                  value={consentName}
                  onChange={(e) => {
                    setConsentName(e.target.value);
                    setConsentError("");
                  }}
                  placeholder={application?.full_name || "Your full name"}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm text-chaptr-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-chaptr-primary/30 focus:border-chaptr-primary transition-colors ${
                    consentName && !nameMatches
                      ? "border-red-300 bg-red-50"
                      : consentName && nameMatches
                      ? "border-chaptr-primary bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                />
                {consentName && !nameMatches && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Name doesn't match — type exactly:{" "}
                    <span className="font-medium">{application?.full_name}</span>
                  </p>
                )}
                {consentName && nameMatches && (
                  <p className="text-xs text-chaptr-primary flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Name confirmed
                  </p>
                )}
                {consentError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {consentError}
                  </p>
                )}
              </div>
            </div>

            {/* Summary of what was uploaded */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Documents ready to submit
              </p>
              <div className="space-y-2">
                {[
                  { label: "ID Front", file: idFront },
                  { label: "ID Back", file: idBack },
                  { label: "M-Pesa Statement", file: mpesaStatement },
                  { label: "Bank Statement", file: bankStatement },
                ].map(({ label, file }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <CheckCircle2 className="text-chaptr-primary flex-shrink-0" size={15} />
                    <span className="text-xs text-gray-600 font-medium w-36 flex-shrink-0">
                      {label}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{file?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium px-4 py-3 rounded-xl text-sm transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={!canProceedStep3 || submitting}
                className="inline-flex items-center gap-2 bg-chaptr-primary hover:bg-chaptr-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-green-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Vetting Documents
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}
