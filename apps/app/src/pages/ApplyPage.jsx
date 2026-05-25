import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "shared/api";
import {
  KENYA_COUNTIES,
  EMPLOYMENT_STATUS,
  EDUCATION_LEVELS,
  GENDER_OPTIONS,
} from "shared/mock-data";
import StepProgress from "../components/StepProgress";
import SchoolCard from "../components/SchoolCard";
import PlanCard from "../components/PlanCard";
import { ChevronDown, AlertCircle, Loader2 } from "lucide-react";

const STEPS = ["School & Plan", "Credit Vetting", "ISA Education", "Contract"];

function FormField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-chaptr-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-chaptr-primary/30 focus:border-chaptr-primary transition-colors ${className}`}
      {...props}
    />
  );
}

function Select({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-chaptr-dark focus:outline-none focus:ring-2 focus:ring-chaptr-primary/30 focus:border-chaptr-primary appearance-none transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        size={16}
      />
    </div>
  );
}

function isOver18(dob) {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
}

const INITIAL_FORM = {
  full_name: "",
  date_of_birth: "",
  gender: "",
  national_id: "",
  phone: "",
  email: "",
  county: "",
  town: "",
  employment_status: "",
  education_level: "",
};

export default function ApplyPage() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [planVisible, setPlanVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    api.getSchools().then((data) => {
      setSchools(data);
      setLoadingSchools(false);
    });
  }, []);

  const handleSelectSchool = (school) => {
    setSelectedSchool(school);
    setSelectedPlan(null);
    setPlans([]);
    setPlanVisible(false);
    setFormVisible(false);
    setLoadingPlans(true);

    api.getPlansBySchool(school.id).then((data) => {
      setPlans(data);
      setLoadingPlans(false);
      setTimeout(() => setPlanVisible(true), 50);
    });
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setTimeout(() => setFormVisible(true), 50);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.date_of_birth) e.date_of_birth = "Date of birth is required";
    else if (!isOver18(form.date_of_birth))
      e.date_of_birth = "You must be at least 18 years old";
    if (!form.gender) e.gender = "Please select a gender";
    if (!form.national_id.trim()) e.national_id = "National ID is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^0[17]\d{8}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid Kenyan phone number (e.g. 0712345678)";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.county) e.county = "Please select a county";
    if (!form.town.trim()) e.town = "Town is required";
    if (!form.employment_status)
      e.employment_status = "Please select employment status";
    if (!form.education_level)
      e.education_level = "Please select education level";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return;
    if (!selectedPlan) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorKey = Object.keys(validationErrors)[0];
      const el = document.querySelector(`[name="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const app = await api.createApplication({
        school_id: selectedSchool.id,
        school_name: selectedSchool.name,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.plan_name,
        plan_type: selectedPlan.type,
        plan_details: selectedPlan,
        ...form,
        status: "draft",
        step: 1,
      });
      navigate(`/apply/${app.id}/vetting`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);
  const maxDobStr = maxDob.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[#f4f2f9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-chaptr-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-chaptr-dark">Chaptr Global</span>
            </div>
            <span className="text-xs text-gray-400 hidden sm:block">
              ISA Application Portal
            </span>
          </div>
          <StepProgress current={1} total={4} steps={STEPS} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-chaptr-dark mb-2">
            Start your ISA application
          </h1>
          <p className="text-gray-500 text-sm">
            Select your school, choose a financing plan, and fill in your
            details to get started.
          </p>
        </div>

        {/* Section A — School Selector */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-chaptr-dark">
              1. Choose your school
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Select the school you're applying to finance
            </p>
          </div>

          {loadingSchools ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-chaptr-primary" size={28} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {schools.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  selected={selectedSchool?.id === school.id}
                  onClick={() => handleSelectSchool(school)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section B — Plan Selector */}
        <div
          className={`transition-all duration-500 ${
            planVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {selectedSchool && (
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-chaptr-dark">
                  2. Choose your financing plan
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Available plans for {selectedSchool.name}
                </p>
              </div>

              {loadingPlans ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    className="animate-spin text-chaptr-primary"
                    size={24}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedPlan?.id === plan.id}
                      onClick={() => handleSelectPlan(plan)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Section C — Personal Info */}
        <div
          className={`transition-all duration-500 ${
            formVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {selectedPlan && (
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-chaptr-dark">
                  3. Personal information
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tell us about yourself — all fields are required
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Full name" error={errors.full_name}>
                      <Input
                        name="full_name"
                        placeholder="e.g. Amina Wanjiku"
                        value={form.full_name}
                        onChange={handleFormChange}
                        className={errors.full_name ? "border-red-300" : ""}
                      />
                    </FormField>

                    <FormField
                      label="Date of birth"
                      error={errors.date_of_birth}
                    >
                      <Input
                        type="date"
                        name="date_of_birth"
                        max={maxDobStr}
                        value={form.date_of_birth}
                        onChange={handleFormChange}
                        className={
                          errors.date_of_birth ? "border-red-300" : ""
                        }
                      />
                    </FormField>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Gender" error={errors.gender}>
                      <Select
                        name="gender"
                        value={form.gender}
                        onChange={handleFormChange}
                        className={errors.gender ? "border-red-300" : ""}
                      >
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField
                      label="National ID number"
                      error={errors.national_id}
                    >
                      <Input
                        name="national_id"
                        placeholder="e.g. 12345678"
                        value={form.national_id}
                        onChange={handleFormChange}
                        className={errors.national_id ? "border-red-300" : ""}
                      />
                    </FormField>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Phone number" error={errors.phone}>
                      <Input
                        name="phone"
                        placeholder="07XX XXX XXX"
                        value={form.phone}
                        onChange={handleFormChange}
                        className={errors.phone ? "border-red-300" : ""}
                      />
                    </FormField>

                    <FormField label="Email address" error={errors.email}>
                      <Input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleFormChange}
                        className={errors.email ? "border-red-300" : ""}
                      />
                    </FormField>
                  </div>

                  {/* Row 4 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="County" error={errors.county}>
                      <Select
                        name="county"
                        value={form.county}
                        onChange={handleFormChange}
                        className={errors.county ? "border-red-300" : ""}
                      >
                        <option value="">Select county</option>
                        {KENYA_COUNTIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Town" error={errors.town}>
                      <Input
                        name="town"
                        placeholder="e.g. Westlands"
                        value={form.town}
                        onChange={handleFormChange}
                        className={errors.town ? "border-red-300" : ""}
                      />
                    </FormField>
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      label="Employment status"
                      error={errors.employment_status}
                    >
                      <Select
                        name="employment_status"
                        value={form.employment_status}
                        onChange={handleFormChange}
                        className={
                          errors.employment_status ? "border-red-300" : ""
                        }
                      >
                        <option value="">Select status</option>
                        {EMPLOYMENT_STATUS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField
                      label="Highest education level"
                      error={errors.education_level}
                    >
                      <Select
                        name="education_level"
                        value={form.education_level}
                        onChange={handleFormChange}
                        className={
                          errors.education_level ? "border-red-300" : ""
                        }
                      >
                        <option value="">Select level</option>
                        {EDUCATION_LEVELS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                </div>

                {/* Selected plan summary */}
                <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
                      Selected Plan
                    </p>
                    <p className="text-sm font-semibold text-chaptr-dark mt-0.5">
                      {selectedSchool?.name} — {selectedPlan?.plan_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      KES {selectedPlan?.tuition_amount?.toLocaleString("en-KE")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan(null);
                      setFormVisible(false);
                    }}
                    className="text-xs text-chaptr-primary underline underline-offset-2 hover:text-chaptr-hover text-left sm:text-right"
                  >
                    Change plan
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full bg-chaptr-primary hover:bg-chaptr-hover disabled:opacity-70 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-200 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Footer space */}
        <div className="h-8" />
      </main>
    </div>
  );
}
