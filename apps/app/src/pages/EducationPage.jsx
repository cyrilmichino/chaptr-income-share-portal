import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "shared/api";
import StepProgress from "../components/StepProgress";
import {
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  ClipboardList,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

const STEPS = ["School & Plan", "Credit Vetting", "ISA Education", "Contract"];

// Shuffle array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(plan) {
  const pct = plan?.income_share_pct
    ? `${(plan.income_share_pct * 100).toFixed(0)}%`
    : "—";
  const threshold = plan?.income_threshold_kes
    ? `KES ${plan.income_threshold_kes.toLocaleString("en-KE")}`
    : "—";
  const cap = plan?.payment_cap_multiplier ?? "—";
  const capLabel = `${cap}x tuition`;
  const grace = plan?.grace_period_months ?? "—";

  return [
    {
      id: "q1",
      question: "What percentage of your income will you repay under your selected plan?",
      options: shuffle([
        { label: "5%", correct: false },
        { label: pct, correct: true },
        { label: "20%", correct: false },
        { label: "25%", correct: false },
      ]),
    },
    {
      id: "q2",
      question: "What is the minimum monthly income required before repayments begin?",
      options: shuffle([
        { label: threshold, correct: true },
        { label: "KES 10,000", correct: false },
        { label: "KES 100,000", correct: false },
        { label: "KES 50,000", correct: false },
      ]),
    },
    {
      id: "q3",
      question: "What happens if you are unemployed in a given month?",
      options: [
        { label: "You still pay your full share", correct: false },
        { label: "Your payment is waived for that month", correct: true },
        { label: "You pay half your normal amount", correct: false },
        { label: "A penalty fee is charged", correct: false },
      ],
    },
    {
      id: "q4",
      question: "What is the maximum total amount you will ever repay (the payment cap)?",
      options: shuffle([
        { label: "1x tuition", correct: false },
        { label: capLabel, correct: true },
        { label: "No cap — you pay until the term ends", correct: false },
        { label: "3x tuition", correct: false },
      ]),
    },
    {
      id: "q5",
      question: "When does your repayment period begin?",
      options: [
        { label: "Immediately after signing", correct: false },
        {
          label: `After ${grace} months post-graduation (grace period)`,
          correct: true,
        },
        { label: "After 1 year, regardless of graduation", correct: false },
        { label: "When you reach the income threshold", correct: false },
      ],
    },
  ];
}

// ─── Video Panel ──────────────────────────────────────────────────────────────
function VideoPanel({ progress, videoComplete }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* YouTube embed */}
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/rHFI0rQhctk?rel=0&modestbranding=1"
            title="Understanding Income Share Agreements"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Progress bar */}
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              {videoComplete ? (
                <span className="text-chaptr-primary flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Video complete
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500">
                  <PlayCircle size={13} />
                  Watch progress
                </span>
              )}
            </span>
            <span
              className={`text-xs font-semibold ${
                videoComplete ? "text-chaptr-primary" : "text-gray-500"
              }`}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-chaptr-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!videoComplete && (
            <p className="text-xs text-gray-400">
              The quiz unlocks when you finish watching.
            </p>
          )}
        </div>
      </div>

      {/* Video info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          What you're learning
        </p>
        <h3 className="text-sm font-semibold text-chaptr-dark mb-2">
          Understanding Income Share Agreements
        </h3>
        <ul className="text-xs text-gray-500 space-y-1.5">
          {[
            "How ISA repayments are calculated",
            "Income thresholds and payment caps",
            "What happens during unemployment",
            "Your rights and obligations as a student",
          ].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="text-chaptr-primary flex-shrink-0" size={11} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Quiz Panel ───────────────────────────────────────────────────────────────
function QuizPanel({ plan, videoComplete, onPass, applicationId }) {
  const [questions, setQuestions] = useState(() => buildQuestions(plan));
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const PASS_SCORE = 4;

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const passed = submitted && score >= PASS_SCORE;
  const failed = submitted && score < PASS_SCORE;

  const handleSelect = (qId, optLabel) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optLabel }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q) => {
      const chosen = q.options.find((o) => o.label === answers[q.id]);
      if (chosen?.correct) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    if (correct >= PASS_SCORE) {
      onPass(correct);
    }
  };

  const handleRetry = () => {
    setQuestions(shuffle(buildQuestions(plan)));
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (!videoComplete) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
          <Lock className="text-gray-400" size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Quiz is locked</p>
          <p className="text-xs text-gray-400 mt-1">
            Finish watching the video to unlock the quiz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Quiz header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-chaptr-primary" size={17} />
          <span className="text-sm font-semibold text-chaptr-dark">ISA Knowledge Check</span>
        </div>
        {!submitted && (
          <span className="text-xs text-gray-400">
            {Object.keys(answers).length}/{questions.length} answered
          </span>
        )}
        {submitted && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              passed
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {score}/{questions.length}
          </span>
        )}
      </div>

      <div className="px-5 py-5 space-y-6">
        {questions.map((q, qi) => {
          const selectedLabel = answers[q.id];
          const correctOption = q.options.find((o) => o.correct);

          return (
            <div key={q.id} className="space-y-2.5">
              <p className="text-sm font-medium text-gray-800 leading-snug">
                <span className="text-chaptr-primary font-semibold mr-1">
                  {qi + 1}.
                </span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = selectedLabel === opt.label;
                  let optStyle =
                    "border-gray-200 bg-gray-50 hover:border-chaptr-hover hover:bg-green-50/40 cursor-pointer";

                  if (submitted) {
                    if (opt.correct) {
                      optStyle = "border-chaptr-primary bg-green-50 cursor-default";
                    } else if (isSelected && !opt.correct) {
                      optStyle = "border-red-300 bg-red-50 cursor-default";
                    } else {
                      optStyle = "border-gray-100 bg-gray-50 opacity-60 cursor-default";
                    }
                  } else if (isSelected) {
                    optStyle = "border-chaptr-primary bg-green-50 cursor-pointer";
                  }

                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelect(q.id, opt.label)}
                      className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border-2 text-sm transition-all duration-150 ${optStyle}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          submitted && opt.correct
                            ? "border-chaptr-primary bg-chaptr-primary"
                            : submitted && isSelected && !opt.correct
                            ? "border-red-400 bg-red-400"
                            : isSelected
                            ? "border-chaptr-primary bg-chaptr-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {(isSelected || (submitted && opt.correct)) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="leading-snug">{opt.label}</span>
                      {submitted && opt.correct && (
                        <CheckCircle2
                          className="text-chaptr-primary ml-auto flex-shrink-0"
                          size={14}
                        />
                      )}
                      {submitted && isSelected && !opt.correct && (
                        <XCircle
                          className="text-red-400 ml-auto flex-shrink-0"
                          size={14}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {submitted && selectedLabel !== correctOption?.label && (
                <p className="text-xs text-chaptr-primary flex items-center gap-1 pl-1">
                  <CheckCircle2 size={11} />
                  Correct answer: <span className="font-medium">{correctOption?.label}</span>
                </p>
              )}
            </div>
          );
        })}

        {/* Actions */}
        {!submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full bg-chaptr-primary hover:bg-chaptr-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-green-100 flex items-center justify-center gap-2"
          >
            Submit Answers
            <ChevronRight size={16} />
          </button>
        )}

        {failed && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-semibold text-red-700 mb-0.5">
                {score}/{questions.length} — Not quite!
              </p>
              <p className="text-xs text-red-500">
                You need at least {PASS_SCORE}/5 to pass. Review the answers above and try again.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="w-full border-2 border-gray-200 hover:border-chaptr-hover bg-white hover:bg-green-50/40 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {passed && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="text-chaptr-primary flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {score}/{questions.length} — Great job!
              </p>
              <p className="text-xs text-green-600">
                You passed the knowledge check.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EducationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated video progress: reaches 100% in ~15 seconds
  const [videoProgress, setVideoProgress] = useState(0);
  const videoComplete = videoProgress >= 100;
  const intervalRef = useRef(null);

  // Quiz state hoisted to detect pass
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getApplication(id).then((data) => {
      setApplication(data);
      setLoading(false);
    });
  }, [id]);

  // Start simulated video progress once app loads
  useEffect(() => {
    if (!loading) {
      // increment by ~6.67% every 1s → 100% in 15s
      intervalRef.current = setInterval(() => {
        setVideoProgress((prev) => {
          const next = prev + 100 / 15;
          if (next >= 100) {
            clearInterval(intervalRef.current);
            return 100;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  const handleQuizPass = async (score) => {
    setQuizPassed(true);
    setQuizScore(score);
    setSaving(true);
    try {
      await api.updateApplication(id, {
        status: "vetting_complete",
        step: 3,
        quiz_passed: true,
        quiz_score: score,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] flex items-center justify-center">
        <Loader2 className="animate-spin text-chaptr-primary" size={32} />
      </div>
    );
  }

  const plan = application?.plan_details;

  return (
    <div className="min-h-screen bg-[#f4f2f9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-chaptr-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-chaptr-dark">Chaptr Global</span>
            </div>
          </div>
          <StepProgress current={3} total={4} steps={STEPS} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-chaptr-dark mb-1">
            ISA Education Module
          </h1>
          <p className="text-gray-500 text-sm">
            Watch the video to understand how your ISA works, then pass the
            knowledge check to proceed.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <VideoPanel
            progress={videoProgress}
            videoComplete={videoComplete}
          />
          <QuizPanel
            plan={plan}
            videoComplete={videoComplete}
            onPass={handleQuizPass}
            applicationId={id}
          />
        </div>

        {/* Waiting banner — shows after quiz passed */}
        {quizPassed && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardList className="text-blue-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-chaptr-dark">
                Your application is under review
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Our team typically responds within 3–5 business days. You'll
                receive an update by email or on your contract page.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Application ID:{" "}
                <span className="font-mono font-medium text-gray-600">{id}</span>
              </p>
            </div>
            {saving ? (
              <Loader2 className="animate-spin text-gray-400 flex-shrink-0" size={18} />
            ) : saved ? (
              <button
                type="button"
                onClick={() => navigate(`/apply/${id}/contract`)}
                className="flex-shrink-0 inline-flex items-center gap-2 bg-chaptr-primary hover:bg-chaptr-hover text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-green-100"
              >
                Check Decision
                <ChevronRight size={15} />
              </button>
            ) : null}
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}
