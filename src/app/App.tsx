import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  Clock,
  Heart,
  Mail,
  Calendar,
  Check,
  X,
  Plus,
  Trash2,
  TrendingUp,
  Phone,
  ExternalLink,
  User,
  Timer,
  Sun,
  Moon,
  Play,
  Pause,
  RotateCcw,
  FileText,
  LogOut,
  AlertCircle,
  ChevronDown,
  Award,
  Shield,
  LayoutDashboard,
  CheckSquare,
  ChevronRight,
  SkipForward,
  Menu,
  Eye,
  EyeOff,
  ChevronLeft,
  GraduationCap,
  Gamepad2,
  StickyNote,
  Pen,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Bell,
} from "lucide-react";
import logoImg from "../imports/1000186272.png";

// ─── EMAILJS ──────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_fl1smin";
const EMAILJS_TEMPLATE_ID = "template_7kkamrf";
const EMAILJS_PUBLIC_KEY = "3aOtovJY2NW9VWvQu";

declare global {
  interface Window {
    emailjs: any;
  }
}

async function sendEmailJS(
  toEmail: string,
  userName: string,
  status: "APPROVED" | "DENIED" | string,
  subject?: string,
  message?: string,
): Promise<boolean> {
  try {
    if (window.emailjs) {
      await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: toEmail,
          user_name: userName,
          status,
          subject:
            subject ||
            `ScotStudy — Your request has been ${status}`,
          message:
            message ||
            (status === "APPROVED"
              ? `Hi ${userName},\n\nGreat news! Your ScotStudy access request has been approved. You can now log in with your email and the password you set when you registered.\n\nWelcome aboard!\n\nScotStudy Team`
              : `Hi ${userName},\n\nUnfortunately your ScotStudy access request has not been approved at this time. If you think this is a mistake, please contact us.\n\nScotStudy Team`),
        },
      );
      return true;
    }
    const res = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: toEmail,
            user_name: userName,
            status,
            subject,
            message,
          },
        }),
      },
    );
    return res.status === 200;
  } catch {
    return false;
  }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Level = "National 5" | "Higher" | "Advanced Higher";
type View =
  | "dashboard"
  | "papers"
  | "scores"
  | "focus"
  | "tasks"
  | "wellbeing"
  | "exams"
  | "break"
  | "notes"
  | "contact";
type UserStatus = "pending" | "approved" | "denied";
type Screen = "access" | "admin" | "onboarding" | "app";

interface AppUser {
  id: string;
  name: string;
  email: string;
  school: string;
  passwordHash: string;
  status: UserStatus;
  requestDate: string;
}
interface SelectedSubject {
  subject: string;
  level: Level;
}
interface ScoreEntry {
  id: string;
  subject: string;
  level: Level;
  score: number;
  maxScore: number;
  date: string;
  type: "Practice" | "Prelim" | "Past Paper";
  notes: string;
}
interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  notified: boolean;
}
interface ExamDate {
  id: string;
  subject: string;
  level: Level;
  date: string;
  time?: string;
  isPrelim: boolean;
}
interface DrawStroke {
  tool: "pen" | "eraser" | "line" | "rect" | "circle";
  color: string;
  width: number;
  points: { x: number; y: number }[];
}
interface NoteFile {
  id: string;
  name: string;
  createdAt: string;
  textContent: string;
  drawStrokes: DrawStroke[];
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "ScotStudy@2026";

const SUBJECTS_LIST = [
  "Accounting",
  "Administration & IT",
  "Art & Design",
  "Biology",
  "Business Management",
  "Chemistry",
  "Computing Science",
  "Drama",
  "Economics",
  "Engineering Science",
  "English",
  "French",
  "Geography",
  "German",
  "Graphic Communication",
  "History",
  "Home Economics",
  "Latin",
  "Mathematics",
  "Modern Studies",
  "Music",
  "Philosophy",
  "Physical Education",
  "Physics",
  "Psychology",
  "RMPS",
  "Sociology",
  "Spanish",
];
const LEVELS: Level[] = [
  "National 5",
  "Higher",
  "Advanced Higher",
];
const LEVEL_SHORT: Record<Level, string> = {
  "National 5": "N5",
  Higher: "Higher",
  "Advanced Higher": "Adv H",
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#1a3a6e",
  English: "#0ea5a0",
  Biology: "#16a34a",
  Chemistry: "#9333ea",
  Physics: "#f59e0b",
  History: "#b45309",
  Geography: "#0891b2",
  "Modern Studies": "#6366f1",
  French: "#ec4899",
  Spanish: "#ef4444",
  German: "#f97316",
  "Computing Science": "#06b6d4",
  "Art & Design": "#8b5cf6",
  Music: "#e11d48",
  "Business Management": "#0d9488",
  RMPS: "#7c3aed",
  Drama: "#c2410c",
  Economics: "#15803d",
  Psychology: "#be185d",
  Sociology: "#7e22ce",
  "Physical Education": "#047857",
  Accounting: "#1d4ed8",
  Philosophy: "#4338ca",
  "Home Economics": "#059669",
  Latin: "#92400e",
  "Graphic Communication": "#1e40af",
  "Engineering Science": "#065f46",
  "Administration & IT": "#1e3a8a",
};
function getSubjectColor(s: string): string {
  return SUBJECT_COLORS[s] || "#1a3a6e";
}

const HELPLINES = [
  {
    name: "Childline",
    number: "0800 1111",
    text: null as string | null,
    description:
      "Free, confidential support for young people under 19.",
    hours: "24/7",
  },
  {
    name: "Samaritans",
    number: "116 123",
    text: null as string | null,
    description:
      "Confidential emotional support for anyone in distress.",
    hours: "24/7",
  },
  {
    name: "SAMH",
    number: "0344 800 0550",
    text: null as string | null,
    description: "Scotland's national mental health charity.",
    hours: "Mon–Fri 9am–6pm",
  },
  {
    name: "YoungMinds Crisis",
    number: null as string | null,
    text: "Text YM to 85258",
    description:
      "Free, 24/7 mental health text support for young people.",
    hours: "24/7",
  },
  {
    name: "Breathing Space",
    number: "0800 83 85 87",
    text: null as string | null,
    description:
      "Scottish helpline for anyone experiencing low mood, depression, or anxiety.",
    hours: "Mon–Thu 6pm–2am, Fri–Mon 24/7",
  },
  {
    name: "LGBT Youth Scotland",
    number: "0131 555 3940",
    text: null as string | null,
    description:
      "Support for LGBTQ+ young people across Scotland.",
    hours: "Mon–Fri 9am–5pm",
  },
  {
    name: "Beat (Eating Disorders)",
    number: "0808 801 0432",
    text: null as string | null,
    description:
      "Helpline for young people affected by eating disorders.",
    hours: "Mon–Fri 9am–8pm, Sat–Sun 4pm–8pm",
  },
];

// Block Blast piece definitions
const BOARD_SIZE = 8;
interface BlockPiece {
  shape: number[][];
  color: string;
}
const ALL_PIECES: BlockPiece[] = [
  { shape: [[1, 1], [1, 1]], color: "#ff6b6b" },
  { shape: [[1, 1, 1, 1]], color: "#ffd166" },
  { shape: [[1], [1], [1], [1]], color: "#06d6a0" },
  { shape: [[1, 1, 1], [0, 0, 1]], color: "#118ab2" },
  { shape: [[1, 1, 1], [1, 0, 0]], color: "#ef476f" },
  { shape: [[0, 0, 1], [1, 1, 1]], color: "#a8dadc" },
  { shape: [[1, 0, 0], [1, 1, 1]], color: "#f77f00" },
  { shape: [[1, 1, 1]], color: "#c77dff" },
  { shape: [[1], [1], [1]], color: "#9b5de5" },
  { shape: [[1, 1], [1, 0]], color: "#00b4d8" },
  { shape: [[1, 0], [1, 1]], color: "#4cc9f0" },
  { shape: [[0, 1], [1, 1]], color: "#f15bb5" },
  { shape: [[1, 1, 0], [0, 1, 1]], color: "#fee440" },
  { shape: [[0, 1, 1], [1, 1, 0]], color: "#00f5d4" },
  { shape: [[1]], color: "#e63946" },
  { shape: [[1, 1]], color: "#2ec4b6" },
  { shape: [[1], [1]], color: "#e9c46a" },
  { shape: [[1, 1, 1], [0, 1, 0]], color: "#ff9f1c" },
  { shape: [[0, 1, 0], [1, 1, 1]], color: "#fb5607" },
];

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function generateId(): string {
  return (
    Math.random().toString(36).substr(2, 9) +
    Date.now().toString(36)
  );
}
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
function daysUntil(d: string): number {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.ceil(
    (new Date(d).getTime() - t.getTime()) / 86400000,
  );
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function simpleHash(s: string): string {
  try {
    return btoa(encodeURIComponent(s + "_qs_salt_2026"));
  } catch {
    return s;
  }
}
function verifyPassword(plain: string, hash: string): boolean {
  try {
    return simpleHash(plain) === hash;
  } catch {
    return false;
  }
}

function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setVal((prev) => {
        const next =
          typeof v === "function"
            ? (v as (p: T) => T)(prev)
            : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key],
  );
  return [val, set];
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function AppLogo({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const outer =
    size === "sm"
      ? "w-10 h-10"
      : size === "lg"
        ? "w-20 h-20"
        : "w-12 h-12";
  const inner =
    size === "sm"
      ? "w-7 h-7"
      : size === "lg"
        ? "w-14 h-14"
        : "w-8 h-8";
  return (
    <div
      className={`${outer} rounded-2xl bg-primary flex items-center justify-center shrink-0`}
    >
      <img
        src={logoImg}
        alt="ScotStudy"
        className={`${inner} object-contain`}
      />
    </div>
  );
}

// ─── MONTHLY CALENDAR ─────────────────────────────────────────────────────────
function MonthlyCalendar({
  examDates,
}: {
  examDates: ExamDate[];
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const today = todayStr();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells =
    Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const examDaySet = new Set(examDates.map((e) => e.date));
  const examsByDate: Record<string, ExamDate[]> = {};
  for (const e of examDates) {
    if (!examsByDate[e.date]) examsByDate[e.date] = [];
    examsByDate[e.date].push(e);
  }

  function prevMonth() {
    setViewDate(
      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
    );
  }
  function nextMonth() {
    setViewDate(
      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
    );
  }

  const cells: (number | null)[] = Array.from(
    { length: totalCells },
    (_, i) => {
      const day = i - startOffset + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    },
  );

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Exam Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold min-w-[130px] text-center">
            {monthName}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
          (d) => (
            <div
              key={d}
              className="text-center text-xs text-muted-foreground font-semibold py-1"
            >
              {d}
            </div>
          ),
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today;
          const hasExam = examDaySet.has(dateStr);
          const examsOnDay = examsByDate[dateStr] || [];
          return (
            <div
              key={i}
              title={
                hasExam
                  ? examsOnDay
                      .map((e) => `${e.subject}${e.time ? " at " + e.time : ""}`)
                      .join(", ")
                  : dateStr
              }
              className={`h-8 w-full rounded-lg flex items-center justify-center text-xs font-medium transition-colors relative
                ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                ${hasExam ? "bg-red-500 text-white font-bold" : "bg-muted text-muted-foreground"}`}
            >
              {day}
              {hasExam && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" />{" "}
          Exam day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-muted inline-block" />{" "}
          No exam
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded ring-2 ring-primary inline-block" />{" "}
          Today
        </span>
      </div>
    </div>
  );
}

// ─── ACCESS GATE ──────────────────────────────────────────────────────────────
function AccessGate({
  onApproved,
  onAdmin,
  users,
  setUsers,
}: {
  onApproved: (u: AppUser) => void;
  onAdmin: () => void;
  users: AppUser[];
  setUsers: (u: AppUser[]) => void;
}) {
  const [tab, setTab] = useState<"login" | "request" | "admin">(
    "login",
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqSchool, setReqSchool] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [reqConfirm, setReqConfirm] = useState("");
  const [showReqPw, setShowReqPw] = useState(false);
  const [showReqConfirm, setShowReqConfirm] = useState(false);
  const [reqDone, setReqDone] = useState(false);
  const [reqError, setReqError] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");

  function switchTab(t: "login" | "request" | "admin") {
    setTab(t);
    setLoginError("");
    setAdminError("");
    setReqError("");
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      setLoginError("Please enter your email address.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      return;
    }
    const u = users.find(
      (x) => x.email.toLowerCase() === email,
    );
    if (!u) {
      setLoginError(
        "No account found with that email. Please request access first.",
      );
      return;
    }
    if (u.status === "pending") {
      setLoginError(
        "Your request is still pending approval. Please check back soon.",
      );
      return;
    }
    if (u.status === "denied") {
      setLoginError(
        "Your access request was not approved. Contact us for more information.",
      );
      return;
    }
    if (!verifyPassword(loginPassword, u.passwordHash)) {
      setLoginError("Incorrect password. Please try again.");
      return;
    }
    setLoginError("");
    onApproved(u);
  }

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    const email = reqEmail.trim().toLowerCase();
    if (users.find((x) => x.email.toLowerCase() === email)) {
      setReqError(
        "An account with this email already exists. Try logging in instead.",
      );
      return;
    }
    if (reqPassword.length < 6) {
      setReqError("Password must be at least 6 characters.");
      return;
    }
    if (reqPassword !== reqConfirm) {
      setReqError("Passwords do not match.");
      return;
    }
    const newUser: AppUser = {
      id: generateId(),
      name: reqName.trim(),
      email: reqEmail.trim(),
      school: reqSchool.trim(),
      passwordHash: simpleHash(reqPassword),
      status: "pending",
      requestDate: todayStr(),
    };
    setUsers([...users, newUser]);
    setReqDone(true);
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setAdminError("");
      onAdmin();
    } else {
      setAdminError("Incorrect password. Please try again.");
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1e38] via-[#1a3a6e] to-[#0ea5a0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            ScotStudy
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            Scottish QS Study Companion
          </p>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-border">
            {(["login", "request", "admin"] as const).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  {t === "login"
                    ? "Log In"
                    : t === "request"
                      ? "Request Access"
                      : "Admin"}
                </button>
              ),
            )}
          </div>

          <div className="p-6">
            {tab === "login" && (
              <form
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Email Address
                  </label>
                  <input
                    value={loginEmail}
                    onChange={(e) =>
                      setLoginEmail(e.target.value)
                    }
                    type="email"
                    required
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      value={loginPassword}
                      onChange={(e) =>
                        setLoginPassword(e.target.value)
                      }
                      type={showLoginPw ? "text" : "password"}
                      required
                      placeholder="Your password"
                      className={inputCls + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLoginPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <p className="text-destructive text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {loginError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Log In
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Don&apos;t have access?{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("request")}
                    className="text-accent font-semibold hover:underline"
                  >
                    Request Access
                  </button>
                </p>
              </form>
            )}

            {tab === "request" && !reqDone && (
              <form
                onSubmit={handleRequest}
                className="space-y-4"
              >
                <p className="text-xs text-muted-foreground">
                  Fill in your details and your request will be
                  reviewed by the admin before you can access
                  the app.
                </p>
                {reqError && (
                  <p className="text-destructive text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {reqError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Full Name
                  </label>
                  <input
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    type="text"
                    required
                    placeholder="Your full name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Email Address
                  </label>
                  <input
                    value={reqEmail}
                    onChange={(e) =>
                      setReqEmail(e.target.value)
                    }
                    type="email"
                    required
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    School / College
                  </label>
                  <input
                    value={reqSchool}
                    onChange={(e) =>
                      setReqSchool(e.target.value)
                    }
                    type="text"
                    required
                    placeholder="e.g. Inverurie Academy"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      value={reqPassword}
                      onChange={(e) =>
                        setReqPassword(e.target.value)
                      }
                      type={showReqPw ? "text" : "password"}
                      required
                      placeholder="Min. 6 characters"
                      className={inputCls + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowReqPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showReqPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      value={reqConfirm}
                      onChange={(e) =>
                        setReqConfirm(e.target.value)
                      }
                      type={
                        showReqConfirm ? "text" : "password"
                      }
                      required
                      placeholder="Repeat password"
                      className={inputCls + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowReqConfirm((v) => !v)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showReqConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                  Once your request is accepted, you will log in
                  with your email and the password you set here.
                </p>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Submit Request
                </button>
              </form>
            )}

            {tab === "request" && reqDone && (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-foreground">
                  Request Submitted!
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your request has been sent for approval. Once
                  approved, you can log in with your email and
                  the password you just set.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReqDone(false);
                    switchTab("login");
                  }}
                  className="text-xs text-accent font-semibold hover:underline"
                >
                  Back to Log In
                </button>
              </div>
            )}

            {tab === "admin" && (
              <form
                onSubmit={handleAdminLogin}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Shield className="w-4 h-4" /> Admin access
                  only
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Admin Password
                  </label>
                  <input
                    value={adminPass}
                    onChange={(e) =>
                      setAdminPass(e.target.value)
                    }
                    type="password"
                    required
                    placeholder="Enter admin password"
                    className={inputCls}
                  />
                </div>
                {adminError && (
                  <p className="text-destructive text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {adminError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Admin Login
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Scottish QS Study Hub · Built for Scottish students
        </p>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({
  users,
  setUsers,
  onBack,
}: {
  users: AppUser[];
  setUsers: (u: AppUser[]) => void;
  onBack: () => void;
}) {
  const [toast, setToast] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const denied = users.filter((u) => u.status === "denied");

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function updateStatus(id: string, status: UserStatus) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setUsers(
      users.map((x) => (x.id === id ? { ...x, status } : x)),
    );
    setSending(id);
    const emailStatus =
      status === "approved" ? "APPROVED" : "DENIED";
    const ok = await sendEmailJS(u.email, u.name, emailStatus);
    setSending(null);
    if (ok) {
      showToast(
        `✓ Email sent to ${u.name} — status: ${emailStatus}`,
        true,
      );
    } else {
      showToast(
        `Status updated. Email delivery failed — check EmailJS credentials.`,
        false,
      );
    }
  }

  function deleteUser(id: string) {
    setUsers(users.filter((u) => u.id !== id));
  }

  const statusBadge = (s: UserStatus) => {
    const cfg =
      s === "approved"
        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
        : s === "denied"
          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${cfg}`}
      >
        {s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1e38] via-[#1a3a6e] to-[#0ea5a0] p-4">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 transition-all ${toast.ok ? "bg-green-600 text-white" : "bg-amber-500 text-white"}`}
        >
          {toast.ok ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-semibold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Login
          </button>
          <div className="flex items-center gap-2 ml-2">
            <Shield className="w-5 h-5 text-white" />
            <h1 className="text-xl font-bold text-white">
              Admin Panel
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Pending",
              count: pending.length,
              color: "text-amber-300",
            },
            {
              label: "Approved",
              count: approved.length,
              color: "text-green-300",
            },
            {
              label: "Denied",
              count: denied.length,
              color: "text-red-300",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 backdrop-blur rounded-xl p-4 text-center"
            >
              <div className={`text-3xl font-black ${s.color}`}>
                {s.count}
              </div>
              <div className="text-white/70 text-xs mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/95 dark:bg-card rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-foreground">
                User Access Requests
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                All records are stored in localStorage and
                persist across sessions.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {users.length} total record
              {users.length !== 1 ? "s" : ""}
            </span>
          </div>

          {users.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">
                No access requests yet.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                New requests will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      School
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      Requested
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">
                        {u.email}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs hidden sm:table-cell">
                        {u.school}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                        {formatDate(u.requestDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        {statusBadge(u.status)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          {u.status !== "approved" && (
                            <button
                              type="button"
                              disabled={sending === u.id}
                              onClick={() =>
                                updateStatus(u.id, "approved")
                              }
                              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-1"
                            >
                              {sending === u.id ? (
                                <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Approve
                            </button>
                          )}
                          {u.status !== "denied" && (
                            <button
                              type="button"
                              disabled={sending === u.id}
                              onClick={() =>
                                updateStatus(u.id, "denied")
                              }
                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-1"
                            >
                              {sending === u.id ? (
                                <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              Deny
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteUser(u.id)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 bg-white/10 rounded-xl px-5 py-4 flex items-start gap-3">
          <Mail className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
          <div>
            <p className="text-white/80 text-xs font-semibold">
              Email notifications are sent automatically via
              EmailJS
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              Approving or denying a user triggers an immediate
              email to their registered address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingModal({
  onDone,
}: {
  onDone: (subjects: SelectedSubject[]) => void;
}) {
  const [selected, setSelected] = useState<SelectedSubject[]>(
    [],
  );
  const [search, setSearch] = useState("");

  function toggle(subject: string, level: Level) {
    setSelected((prev) => {
      const exists = prev.find(
        (s) => s.subject === subject && s.level === level,
      );
      return exists
        ? prev.filter(
            (s) =>
              !(s.subject === subject && s.level === level),
          )
        : [...prev, { subject, level }];
    });
  }

  const filtered = SUBJECTS_LIST.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0d1e38] via-[#1a3a6e] to-[#0ea5a0] flex items-center justify-center z-50 p-4">
      <div
        className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <AppLogo size="sm" />
            <h2 className="text-lg font-bold">
              Choose Your Subjects
            </h2>
          </div>
          <p className="text-muted-foreground text-xs">
            Select each subject you take and tick the level(s).
            You can change this any time.
          </p>
        </div>

        <div className="px-5 py-3 border-b border-border">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3">
          <div className="grid gap-2">
            {filtered.map((subject) => (
              <div
                key={subject}
                className="border border-border rounded-xl p-3 bg-background/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: getSubjectColor(subject),
                    }}
                  />
                  <span className="font-semibold text-sm">
                    {subject}
                  </span>
                </div>
                <div className="flex gap-2">
                  {LEVELS.map((level) => {
                    const active = selected.some(
                      (s) =>
                        s.subject === subject &&
                        s.level === level,
                    );
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => toggle(subject, level)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary hover:text-foreground"}`}
                      >
                        {active && "✓ "}
                        {LEVEL_SHORT[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-border flex items-center justify-between bg-muted/30">
          <span className="text-sm text-muted-foreground font-semibold">
            {selected.length} selected
          </span>
          <button
            type="button"
            onClick={() => onDone(selected)}
            disabled={selected.length === 0}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to App →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS: {
  id: View;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  { id: "papers", label: "Past Papers", icon: FileText },
  { id: "scores", label: "Score Tracker", icon: TrendingUp },
  { id: "focus", label: "Focus Timer", icon: Timer },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "exams", label: "Exams", icon: GraduationCap },
  { id: "wellbeing", label: "Wellbeing", icon: Heart },
  { id: "break", label: "Break", icon: Gamepad2 },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "contact", label: "Contact Us", icon: Mail },
];

function Sidebar({
  view,
  setView,
  user,
  onLogout,
  darkMode,
  toggleDark,
  onClose,
}: {
  view: View;
  setView: (v: View) => void;
  user: AppUser;
  onLogout: () => void;
  darkMode: boolean;
  toggleDark: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="w-60 h-full bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" />
          <div>
            <p className="font-bold text-sm text-white leading-none">
              ScotStudy
            </p>
            <p className="text-xs text-white/50 leading-none mt-0.5">
              QS Companion
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setView(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left relative ${active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
              {active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 px-1 mb-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-white/40 truncate">
              {user.school}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleDark}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors text-xs font-medium"
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
            {darkMode ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({
  user,
  selectedSubjects,
  examDates,
  scores,
  tasks,
  setView,
}: {
  user: AppUser;
  selectedSubjects: SelectedSubject[];
  examDates: ExamDate[];
  scores: ScoreEntry[];
  tasks: Task[];
  setView: (v: View) => void;
}) {
  const upcoming = examDates
    .map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);
  const pendingTasks = tasks
    .filter((t) => !t.completed)
    .slice(0, 4);
  const recentScores = scores.slice(-5).reverse();
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {user.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <MonthlyCalendar examDates={examDates} />

      {recentScores.length > 0 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">
                Recent Scores
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setView("scores")}
              className="text-xs text-accent hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {recentScores.map((s) => {
              const pct = Math.round(
                (s.score / s.maxScore) * 100,
              );
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.subject}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({s.level})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.type} · {formatDate(s.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">
                Upcoming Exams
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setView("exams")}
              className="text-xs text-accent hover:underline"
            >
              Manage →
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-xs py-4 text-center">
              No exam dates added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted"
                >
                  <div>
                    <p className="font-semibold text-sm">
                      {e.subject}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({e.level})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.isPrelim ? "Prelim" : "QS Exam"} ·{" "}
                      {formatDate(e.date)}
                      {e.time && ` at ${e.time}`}
                    </p>
                  </div>
                  <div
                    className={`text-center px-3 py-1.5 rounded-lg ${e.days <= 7 ? "bg-red-100 dark:bg-red-900/30 text-red-600" : e.days <= 30 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}
                  >
                    <p className="text-lg font-black leading-none">
                      {e.days}
                    </p>
                    <p className="text-xs">days</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">
                Upcoming Tasks
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setView("tasks")}
              className="text-xs text-accent hover:underline"
            >
              View All →
            </button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-muted-foreground text-xs py-4 text-center">
              You&apos;re all caught up! 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${t.priority === "high" ? "bg-red-500" : t.priority === "medium" ? "bg-amber-500" : "bg-green-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {t.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.subject}
                      {t.dueDate &&
                        ` · Due ${formatDate(t.dueDate)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Subjects",
            value: selectedSubjects.length,
            icon: BookOpen,
            color: "text-primary",
          },
          {
            label: "Scores Logged",
            value: scores.length,
            icon: TrendingUp,
            color: "text-accent",
          },
          {
            label: "Tasks Done",
            value: tasks.filter((t) => t.completed).length,
            icon: Award,
            color: "text-green-600",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card rounded-2xl p-4 border border-border text-center"
            >
              <Icon
                className={`w-5 h-5 mx-auto mb-2 ${s.color}`}
              />
              <p className="text-2xl font-black text-foreground">
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAST PAPERS ──────────────────────────────────────────────────────────────
function getQSLink(subject: string, level: string): string {
  let normalizedLevel = level;
  if (level === "N5") normalizedLevel = "National 5";
  if (level === "Adv H" || level === "Adv Higher")
    normalizedLevel = "Advanced Higher";

  const sqaSubjectUrls: Record<string, string> = {
    Accounting:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Accounting",
    "Administration & IT":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Administration+and+IT",
    "Art & Design":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Art+and+Design",
    Biology:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Biology",
    "Business Management":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Business+Management",
    Chemistry:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Chemistry",
    "Computing Science":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Computing+Science",
    Drama:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Drama",
    Economics:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Economics",
    "Engineering Science":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Engineering+Science",
    English:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=English",
    French:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=French",
    Geography:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Geography",
    German:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=German",
    "Graphic Communication":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Graphic+Communication",
    History:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=History",
    "Home Economics":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Health+and+Food+Technology",
    Latin:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Latin",
    Mathematics:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Mathematics",
    "Modern Studies":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Modern+Studies",
    Music:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Music",
    Philosophy:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Philosophy",
    "Physical Education":
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Physical+Education",
    Physics:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Physics",
    Psychology:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Psychology",
    RMPS: "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Religious%2C+Moral+and+Philosophical+Studies",
    Sociology:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Sociology",
    Spanish:
      "https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=Spanish",
  };

  const base = sqaSubjectUrls[subject];
  if (base) return base;
  const l =
    normalizedLevel === "National 5"
      ? "National+5"
      : normalizedLevel === "Advanced Higher"
        ? "Advanced+Higher"
        : "Higher";
  return `https://www.sqa.org.uk/pastpapers/search.htm?qualification=NQ&level=${l}&subject=${encodeURIComponent(subject)}`;
}

function PastPapers({
  selectedSubjects,
}: {
  selectedSubjects: SelectedSubject[];
}) {
  const [levelFilter, setLevelFilter] = useState<Level | "All">(
    "All",
  );
  const [search, setSearch] = useState("");

  const filtered = selectedSubjects.filter(
    (s) =>
      (levelFilter === "All" || s.level === levelFilter) &&
      s.subject.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = LEVELS.reduce(
    (acc, level) => {
      const items = filtered.filter((s) => s.level === level);
      if (items.length) acc[level] = items;
      return acc;
    },
    {} as Record<string, SelectedSubject[]>,
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Past Papers</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Direct links to your subjects on the official QS past
          papers website.
        </p>
      </div>

      {selectedSubjects.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">
            No Subjects Selected
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Use "My Subjects" in the top bar to add your
            subjects.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="flex-1 min-w-36 px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {(["All", ...LEVELS] as (Level | "All")[]).map(
              (l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevelFilter(l)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${levelFilter === l ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {l === "All" ? "All Levels" : l}
                </button>
              ),
            )}
          </div>

          {Object.entries(grouped).map(([level, subjects]) => (
            <div key={level}>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {level}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjects.map((s) => (
                  <a
                    key={`${s.subject}-${s.level}`}
                    href={getQSLink(s.subject, s.level)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-card hover:bg-accent/50 transition-colors rounded-xl border shadow-sm group"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor:
                          getSubjectColor(s.subject) + "22",
                        borderColor:
                          getSubjectColor(s.subject) + "55",
                        border: "1px solid",
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getSubjectColor(
                            s.subject,
                          ),
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {s.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.level} — SQA Past Papers
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── SCORE TRACKER ────────────────────────────────────────────────────────────
function ScoreTracker({
  scores,
  setScores,
  selectedSubjects,
}: {
  scores: ScoreEntry[];
  setScores: (s: ScoreEntry[]) => void;
  selectedSubjects: SelectedSubject[];
}) {
  const [addingScore, setAddingScore] = useState(false);
  const [filterSubject, setFilterSubject] = useState("All");
  const [form, setForm] = useState({
    subject: selectedSubjects[0]?.subject || "",
    level: (selectedSubjects[0]?.level || "Higher") as Level,
    score: "",
    maxScore: "100",
    date: todayStr(),
    type: "Practice" as ScoreEntry["type"],
    notes: "",
  });

  function addScore(e: React.FormEvent) {
    e.preventDefault();
    setScores([
      ...scores,
      {
        id: generateId(),
        subject: form.subject,
        level: form.level,
        score: Number(form.score),
        maxScore: Number(form.maxScore),
        date: form.date,
        type: form.type,
        notes: form.notes,
      },
    ]);
    setForm((f) => ({ ...f, score: "", notes: "" }));
    setAddingScore(false);
  }

  const allSubjectNames = Array.from(
    new Set(scores.map((s) => s.subject)),
  );
  const filteredScores =
    filterSubject === "All"
      ? scores
      : scores.filter((s) => s.subject === filterSubject);

  const CHART_PALETTE = [
    "#1a3a6e", "#0ea5a0", "#f59e0b", "#8b5cf6", "#ef4444",
    "#16a34a", "#ec4899", "#f97316", "#06b6d4", "#6366f1",
    "#e11d48", "#0891b2", "#7c3aed", "#15803d", "#b45309",
  ];
  const subjectColor = (sub: string) => {
    const idx = allSubjectNames.indexOf(sub);
    return CHART_PALETTE[idx % CHART_PALETTE.length];
  };

  // When filtered to a subject: each entry is a separate point (sequential)
  // When "All": date-indexed, one line per subject
  const chartSubjects =
    filterSubject === "All" ? allSubjectNames : [filterSubject];

  let chartData: Record<string, string | number>[];
  if (filterSubject === "All") {
    const allDates = Array.from(
      new Set(scores.map((s) => s.date)),
    ).sort();
    chartData = allDates
      .map((date) => {
        const point: Record<string, string | number> = {
          date: formatDate(date).slice(0, 6),
        };
        chartSubjects.forEach((sub) => {
          const entry = scores
            .filter((s) => s.subject === sub && s.date === date)
            .at(-1);
          if (entry)
            point[sub] = Math.round(
              (entry.score / entry.maxScore) * 100,
            );
        });
        return point;
      })
      .filter((pt) =>
        chartSubjects.some((sub) => pt[sub] !== undefined),
      );
  } else {
    const subScores = scores
      .filter((s) => s.subject === filterSubject)
      .sort((a, b) => a.date.localeCompare(b.date));
    chartData = subScores.map((s, i) => ({
      date: `#${i + 1} ${s.type.slice(0, 4)}`,
      [filterSubject]: Math.round(
        (s.score / s.maxScore) * 100,
      ),
    }));
  }

  function getAnalysis(): string {
    if (filteredScores.length < 2)
      return "Log at least 2 scores to see trend analysis.";
    const sorted = [...filteredScores].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const first = Math.round(
      (sorted[0].score / sorted[0].maxScore) * 100,
    );
    const last = Math.round(
      (sorted[sorted.length - 1].score /
        sorted[sorted.length - 1].maxScore) *
        100,
    );
    const avg = Math.round(
      filteredScores.reduce(
        (a, s) => a + (s.score / s.maxScore) * 100,
        0,
      ) / filteredScores.length,
    );
    const diff = last - first;
    const trend =
      diff > 5
        ? `improved by ${diff}%`
        : diff < -5
          ? `decreased by ${Math.abs(diff)}%`
          : "stayed consistent";
    return `Average: ${avg}%. Performance has ${trend} from first to latest entry. ${avg >= 70 ? "Strong performance — keep it up!" : avg >= 50 ? "Making progress — consistent practice will help." : "There is room to grow — consider reviewing weak areas or seeking extra support."}`;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Score Tracker</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Log scores and track your progress over time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddingScore(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Log Score
        </button>
      </div>

      {scores.length >= 2 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {["All", ...allSubjectNames].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterSubject(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterSubject === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                style={
                  filterSubject !== s && s !== "All"
                    ? {
                        borderLeft: `3px solid ${subjectColor(s)}`,
                      }
                    : {}
                }
              >
                {s}
              </button>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-1">
              Score Trend (%)
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
              {chartSubjects.map((sub) => (
                <div
                  key={sub}
                  className="flex items-center gap-1.5"
                >
                  <span
                    className="w-6 h-0.5 rounded-full inline-block"
                    style={{ backgroundColor: subjectColor(sub) }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {sub}
                  </span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `${v}%`,
                    name,
                  ]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                  }}
                />
                {chartSubjects.map((sub) => (
                  <Line
                    key={sub}
                    type="monotone"
                    dataKey={sub}
                    stroke={subjectColor(sub)}
                    strokeWidth={2}
                    dot={{ r: 4, fill: subjectColor(sub) }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {getAnalysis()}
            </p>
          </div>
        </>
      )}

      {filteredScores.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No scores logged yet.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {[...filteredScores].reverse().map((s) => {
            const pct = Math.round(
              (s.score / s.maxScore) * 100,
            );
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-1 h-10 rounded-full shrink-0"
                  style={{
                    backgroundColor: subjectColor(s.subject),
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {s.subject}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({s.level})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.type} · {formatDate(s.date)}
                    {s.notes && ` · ${s.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold w-10 text-right ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {pct}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setScores(
                      scores.filter((x) => x.id !== s.id),
                    )
                  }
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {addingScore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={addScore}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Log a Score</h3>
              <button
                type="button"
                onClick={() => setAddingScore(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Subject
              </label>
              <select
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    subject: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {selectedSubjects.map((s) => (
                  <option
                    key={`${s.subject}-${s.level}`}
                    value={s.subject}
                  >
                    {s.subject} ({s.level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as ScoreEntry["type"],
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {["Practice", "Prelim", "Past Paper"].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Score
              </label>
              <div className="flex gap-2 items-center">
                <input
                  value={form.score}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      score: e.target.value,
                    }))
                  }
                  type="number"
                  min="0"
                  required
                  placeholder="Score"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-muted-foreground text-sm">
                  /
                </span>
                <input
                  value={form.maxScore}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxScore: e.target.value,
                    }))
                  }
                  type="number"
                  min="1"
                  required
                  placeholder="Max"
                  className="w-20 px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Date
              </label>
              <input
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    date: e.target.value,
                  }))
                }
                type="date"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Notes (optional)
              </label>
              <input
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    notes: e.target.value,
                  }))
                }
                placeholder="e.g. Paper 1, timed"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAddingScore(false)}
                className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── FOCUS TIMER ──────────────────────────────────────────────────────────────
function FocusTimer() {
  const [mode, setMode] = useState<"focus" | "short" | "long">(
    "focus",
  );
  const durations = { focus: 25, short: 5, long: 15 };
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [customMin, setCustomMin] = useState("");
  const intervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false);
            if (mode === "focus") setSessions((n) => n + 1);
            return durations[mode] * 60;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current)
        clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current)
        clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  function switchMode(m: typeof mode) {
    setMode(m);
    setRunning(false);
    setSeconds(durations[m] * 60);
  }
  function reset() {
    setRunning(false);
    setSeconds(durations[mode] * 60);
  }
  function applyCustom() {
    const m = parseInt(customMin);
    if (m > 0 && m <= 120) {
      setRunning(false);
      setSeconds(m * 60);
      setCustomMin("");
    }
  }

  const mins = Math.floor(seconds / 60),
    secs = seconds % 60;
  const radius = 80,
    circ = 2 * Math.PI * radius;
  const progress = 1 - seconds / (durations[mode] * 60);

  return (
    <div className="p-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold">Focus Timer</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Stay focused with timed study sessions.
        </p>
      </div>
      <div className="flex gap-2">
        {(["focus", "short", "long"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {m === "focus"
              ? "🎯 Focus"
              : m === "short"
                ? "☕ Short Break"
                : "🛌 Long Break"}
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">
        <div className="relative w-48 h-48">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 180 180"
          >
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="8"
            />
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={
                mode === "focus"
                  ? "var(--color-primary)"
                  : "var(--color-accent)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              style={{
                transition: "stroke-dashoffset 1s linear",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-black tabular-nums"
              style={{ fontFamily: "DM Mono, monospace" }}
            >
              {String(mins).padStart(2, "0")}:
              {String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {mode === "focus"
                ? "Focus Time"
                : mode === "short"
                  ? "Short Break"
                  : "Long Break"}{" "}
              · {durations[mode]} min
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${running ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90"}`}
          >
            {running ? (
              <Pause className="w-6 h-6 text-white fill-white" />
            ) : (
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              switchMode(mode === "focus" ? "short" : "focus")
            }
            className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <SkipForward className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">
            {sessions}
          </p>
          <p className="text-xs text-muted-foreground">
            Sessions Completed
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-accent">
            {sessions * 25}
          </p>
          <p className="text-xs text-muted-foreground">
            Minutes Focused
          </p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold mb-2">
          Custom Duration
        </p>
        <div className="flex gap-2">
          <input
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            type="number"
            min="1"
            max="120"
            placeholder="Minutes (1–120)"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={applyCustom}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function Tasks({
  tasks,
  setTasks,
  selectedSubjects,
}: {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  selectedSubjects: SelectedSubject[];
}) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "done"
  >("all");
  const [form, setForm] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "medium" as Task["priority"],
  });

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    setTasks([
      ...tasks,
      {
        id: generateId(),
        ...form,
        completed: false,
        notified: false,
      },
    ]);
    setForm({
      title: "",
      subject: "",
      dueDate: "",
      priority: "medium",
    });
    setAdding(false);
  }

  function toggle(id: string) {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    );
  }

  const filtered = tasks
    .filter((t) =>
      filter === "all"
        ? true
        : filter === "pending"
          ? !t.completed
          : t.completed,
    )
    .sort((a, b) => {
      if (a.completed !== b.completed)
        return a.completed ? 1 : -1;
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });

  const priorityColors = {
    high: "text-red-600 bg-red-100 dark:bg-red-900/30",
    medium: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    low: "text-green-600 bg-green-100 dark:bg-green-900/30",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-xs mt-1">
            {tasks.filter((t) => !t.completed).length}{" "}
            remaining.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>
      <div className="flex gap-2">
        {(["all", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f} (
            {f === "all"
              ? tasks.length
              : f === "pending"
                ? tasks.filter((t) => !t.completed).length
                : tasks.filter((t) => t.completed).length}
            )
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {filter === "done"
              ? "No completed tasks yet."
              : "All caught up! 🎉"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 bg-card border border-border rounded-xl transition-opacity ${t.completed ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${t.completed ? "bg-green-500 border-green-500" : "border-border hover:border-primary"}`}
              >
                {t.completed && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm ${t.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {t.subject && (
                    <span className="text-xs text-muted-foreground">
                      {t.subject}
                    </span>
                  )}
                  {t.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(t.dueDate)}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${priorityColors[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTasks(tasks.filter((x) => x.id !== t.id))
                }
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={addTask}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Add Task</h3>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Task Title
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                  }))
                }
                required
                placeholder="e.g. Revise Chapter 4 Biology"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Subject (optional)
              </label>
              <select
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    subject: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— None —</option>
                {selectedSubjects.map((s) => (
                  <option
                    key={`${s.subject}-${s.level}`}
                    value={s.subject}
                  >
                    {s.subject}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Due Date (optional)
              </label>
              <input
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dueDate: e.target.value,
                  }))
                }
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priority: e.target
                      .value as Task["priority"],
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── WELLBEING ────────────────────────────────────────────────────────────────
function Wellbeing() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Wellbeing 💙</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Your mental health matters. You are not alone.
        </p>
      </div>
      <div>
        <h2 className="font-bold text-base mb-3">
          📞 If you need to talk to someone
        </h2>
        <div className="grid gap-3">
          {HELPLINES.map((h) => (
            <div
              key={h.name}
              className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">
                    {h.name}
                  </span>
                  {h.number && (
                    <a
                      href={`tel:${h.number.replace(/\s/g, "")}`}
                      className="font-bold text-primary hover:underline text-sm"
                    >
                      {h.number}
                    </a>
                  )}
                  {h.text && (
                    <span className="font-bold text-accent text-sm">
                      {h.text}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                    {h.hours}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {h.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EXAMS PANEL ──────────────────────────────────────────────────────────────
function ExamsPanel({
  examDates,
  setExamDates,
  selectedSubjects,
}: {
  examDates: ExamDate[];
  setExamDates: (e: ExamDate[]) => void;
  selectedSubjects: SelectedSubject[];
}) {
  const [adding, setAdding] = useState(false);
  const [examForm, setExamForm] = useState({
    subject: selectedSubjects[0]?.subject || "",
    level: (selectedSubjects[0]?.level || "Higher") as Level,
    date: "",
    time: "",
    isPrelim: false,
  });

  function addExam(e: React.FormEvent) {
    e.preventDefault();
    setExamDates([
      ...examDates,
      {
        id: generateId(),
        subject: examForm.subject,
        level: examForm.level,
        date: examForm.date,
        time: examForm.time || undefined,
        isPrelim: examForm.isPrelim,
      },
    ]);
    setExamForm((f) => ({ ...f, date: "", time: "" }));
    setAdding(false);
  }

  const sorted = [...examDates].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const upcoming = sorted.filter((e) => daysUntil(e.date) >= 0);
  const past = sorted.filter((e) => daysUntil(e.date) < 0);

  const selCls =
    "w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Exams</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Track your exam and prelim dates with countdowns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Add Exam
        </button>
      </div>

      {examDates.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">
            No exams added yet
          </h3>
          <p className="text-muted-foreground text-sm">
            Add your exam and prelim dates to see countdowns.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.map((e) => {
                const days = daysUntil(e.date);
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl"
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-md ${days <= 7 ? "bg-red-500" : days <= 30 ? "bg-amber-500" : "bg-primary"}`}
                    >
                      <span className="text-xl font-black leading-none">
                        {days}
                      </span>
                      <span className="text-xs opacity-80">
                        days
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base">
                        {e.subject}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {e.isPrelim ? "Prelim" : "QS Exam"} ·{" "}
                        {LEVEL_SHORT[e.level]} ·{" "}
                        {formatDate(e.date)}
                        {e.time && (
                          <span className="font-semibold text-foreground">
                            {" "}
                            at {e.time}
                          </span>
                        )}
                      </p>
                      {days <= 7 && (
                        <p className="text-xs text-red-500 font-semibold mt-0.5">
                          ⚡ Coming up very soon!
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExamDates(
                          examDates.filter(
                            (x) => x.id !== e.id,
                          ),
                        )
                      }
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Past ({past.length})
              </h2>
              {[...past].reverse().map((e) => {
                const days = Math.abs(daysUntil(e.date));
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl opacity-60"
                  >
                    <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0 bg-gray-400">
                      <span className="text-xl font-black leading-none">
                        {days}
                      </span>
                      <span className="text-xs opacity-80">
                        ago
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base">
                        {e.subject}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {e.isPrelim ? "Prelim" : "QS Exam"} ·{" "}
                        {LEVEL_SHORT[e.level]} ·{" "}
                        {formatDate(e.date)}
                        {e.time && ` at ${e.time}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExamDates(
                          examDates.filter(
                            (x) => x.id !== e.id,
                          ),
                        )
                      }
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {adding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={addExam}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Add Exam / Prelim Date</h3>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Subject
              </label>
              <select
                value={examForm.subject}
                onChange={(e) =>
                  setExamForm((f) => ({
                    ...f,
                    subject: e.target.value,
                  }))
                }
                required
                className={selCls}
              >
                {selectedSubjects.length === 0 ? (
                  <option value="">— Select a subject —</option>
                ) : (
                  selectedSubjects.map((s) => (
                    <option
                      key={`${s.subject}-${s.level}`}
                      value={s.subject}
                    >
                      {s.subject} ({s.level})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Level
              </label>
              <select
                value={examForm.level}
                onChange={(e) =>
                  setExamForm((f) => ({
                    ...f,
                    level: e.target.value as Level,
                  }))
                }
                className={selCls}
              >
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Date
                </label>
                <input
                  value={examForm.date}
                  onChange={(e) =>
                    setExamForm((f) => ({
                      ...f,
                      date: e.target.value,
                    }))
                  }
                  type="date"
                  required
                  className={selCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Time (optional)
                </label>
                <input
                  value={examForm.time}
                  onChange={(e) =>
                    setExamForm((f) => ({
                      ...f,
                      time: e.target.value,
                    }))
                  }
                  type="time"
                  className={selCls}
                  placeholder="e.g. 09:00"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={examForm.isPrelim}
                onChange={(e) =>
                  setExamForm((f) => ({
                    ...f,
                    isPrelim: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">
                This is a Prelim (not QS exam)
              </span>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Add Exam
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── BREAK GAME (BlockBlast) ──────────────────────────────────────────────────
function getRandomPieces(count: number): BlockPiece[] {
  const result: BlockPiece[] = [];
  for (let i = 0; i < count; i++) {
    result.push(
      ALL_PIECES[Math.floor(Math.random() * ALL_PIECES.length)],
    );
  }
  return result;
}

function BreakGame() {
  const emptyBoard = () =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null) as (string | null)[]);

  const [board, setBoard] = useState<(string | null)[][]>(
    emptyBoard,
  );
  const [pieces, setPieces] = useState<BlockPiece[]>(() =>
    getRandomPieces(3),
  );
  const [used, setUsed] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<{
    r: number;
    c: number;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useLocalStorage<number>(
    "qs_break_high",
    0,
  );
  const [gameOver, setGameOver] = useState(false);

  function canPlaceAt(
    piece: BlockPiece,
    row: number,
    col: number,
    b: (string | null)[][],
  ): boolean {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const gr = row + r;
          const gc = col + c;
          if (
            gr < 0 ||
            gr >= BOARD_SIZE ||
            gc < 0 ||
            gc >= BOARD_SIZE
          )
            return false;
          if (b[gr][gc] !== null) return false;
        }
      }
    }
    return true;
  }

  function clearLines(b: (string | null)[][]): {
    next: (string | null)[][];
    count: number;
  } {
    const rowsToClear = new Set<number>();
    const colsToClear = new Set<number>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (b[r].every((c) => c !== null)) rowsToClear.add(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (b.every((row) => row[c] !== null)) colsToClear.add(c);
    }
    if (rowsToClear.size === 0 && colsToClear.size === 0)
      return { next: b, count: 0 };
    const next = b.map((row, r) =>
      row.map((cell, c) =>
        rowsToClear.has(r) || colsToClear.has(c) ? null : cell,
      ),
    );
    return { next, count: rowsToClear.size + colsToClear.size };
  }

  function checkGameOver(
    b: (string | null)[][],
    ps: BlockPiece[],
    usedArr: boolean[],
  ): boolean {
    const activePieces = ps.filter((_, i) => !usedArr[i]);
    if (activePieces.length === 0) return false;
    return !activePieces.some((piece) => {
      for (
        let r = 0;
        r <= BOARD_SIZE - piece.shape.length;
        r++
      ) {
        for (
          let c = 0;
          c <= BOARD_SIZE - (piece.shape[0]?.length || 0);
          c++
        ) {
          if (canPlaceAt(piece, r, c, b)) return true;
        }
      }
      return false;
    });
  }

  function placePiece(row: number, col: number) {
    if (selected === null || used[selected] || gameOver) return;
    const piece = pieces[selected];
    if (!canPlaceAt(piece, row, col, board)) return;

    const newBoard = board.map((r) => [...r]);
    let cellsPlaced = 0;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          newBoard[row + r][col + c] = piece.color;
          cellsPlaced++;
        }
      }
    }

    const { next: clearedBoard, count: linesCleared } =
      clearLines(newBoard);
    const newScore =
      score + cellsPlaced + linesCleared * 50;
    const newUsed = [...used];
    newUsed[selected] = true;
    setBoard(clearedBoard);
    setScore(newScore);
    if (newScore > highScore) setHighScore(newScore);
    setSelected(null);
    setHover(null);

    const allUsed = newUsed.every(Boolean);
    let finalPieces = pieces;
    let finalUsed = newUsed;
    if (allUsed) {
      finalPieces = getRandomPieces(3);
      finalUsed = [false, false, false];
      setPieces(finalPieces);
      setUsed(finalUsed);
    } else {
      setUsed(newUsed);
    }

    if (checkGameOver(clearedBoard, finalPieces, finalUsed)) {
      setGameOver(true);
    }
  }

  function newGame() {
    setBoard(emptyBoard());
    setPieces(getRandomPieces(3));
    setUsed([false, false, false]);
    setSelected(null);
    setHover(null);
    setScore(0);
    setGameOver(false);
  }

  const selectedPiece =
    selected !== null && !used[selected] ? pieces[selected] : null;

  function getPreviewCells(): Set<string> {
    if (!selectedPiece || !hover) return new Set();
    const cells = new Set<string>();
    for (let r = 0; r < selectedPiece.shape.length; r++) {
      for (
        let c = 0;
        c < selectedPiece.shape[r].length;
        c++
      ) {
        if (selectedPiece.shape[r][c]) {
          const gr = hover.r + r;
          const gc = hover.c + c;
          if (
            gr >= 0 &&
            gr < BOARD_SIZE &&
            gc >= 0 &&
            gc < BOARD_SIZE
          ) {
            cells.add(`${gr},${gc}`);
          }
        }
      }
    }
    return cells;
  }

  const previewCells = getPreviewCells();
  const isValidHover =
    selectedPiece && hover
      ? canPlaceAt(selectedPiece, hover.r, hover.c, board)
      : false;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Break</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Place blocks to fill rows and columns. Take a mental break!
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-card border border-border rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-black text-primary">
              {score}
            </p>
            <p className="text-xs text-muted-foreground">
              Score
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-black text-accent">
              {highScore}
            </p>
            <p className="text-xs text-muted-foreground">Best</p>
          </div>
        </div>
        <button
          type="button"
          onClick={newGame}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Game
        </button>
      </div>

      {gameOver && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">😅</p>
          <h3 className="font-bold text-red-700 dark:text-red-300 text-lg">
            Game Over!
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            Final score: {score}
          </p>
          <button
            type="button"
            onClick={newGame}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="shrink-0">
          <div
            className="grid gap-0.5 bg-muted p-1.5 rounded-2xl"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              width: "min(380px, 100%)",
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const isPreview = previewCells.has(key);
                const isHoverCell =
                  hover?.r === r && hover?.c === c;
                return (
                  <div
                    key={key}
                    onClick={() => placePiece(r, c)}
                    onMouseEnter={() =>
                      setHover({ r, c })
                    }
                    onMouseLeave={() => setHover(null)}
                    className="aspect-square rounded-sm cursor-pointer transition-all"
                    style={{
                      backgroundColor: cell
                        ? cell
                        : isPreview
                          ? isValidHover
                            ? selectedPiece!.color + "99"
                            : "#ef444455"
                          : "var(--background)",
                      border: isPreview
                        ? `1px solid ${isValidHover ? selectedPiece!.color : "#ef4444"}`
                        : "1px solid var(--border)",
                      boxShadow: cell
                        ? `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)`
                        : "none",
                    }}
                  />
                );
              }),
            )}
          </div>
          {selected !== null && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Click any valid cell on the grid to place the block
            </p>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">
            Choose a piece:
          </p>
          <div className="grid grid-cols-3 gap-3">
            {pieces.map((piece, idx) => {
              const isSelected = selected === idx;
              const isUsed = used[idx];
              const rows = piece.shape.length;
              const cols = Math.max(
                ...piece.shape.map((r) => r.length),
              );
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    !isUsed &&
                    setSelected(isSelected ? null : idx)
                  }
                  disabled={isUsed || gameOver}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${isUsed ? "opacity-30 cursor-not-allowed border-border" : isSelected ? "border-primary bg-primary/10 shadow-lg scale-105" : "border-border hover:border-primary/50 hover:bg-muted cursor-pointer"}`}
                  style={{ minHeight: 90 }}
                >
                  <div
                    className="grid gap-0.5"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    }}
                  >
                    {piece.shape.map((row, r) =>
                      row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          className="w-5 h-5 rounded-sm"
                          style={{
                            backgroundColor: cell
                              ? piece.color
                              : "transparent",
                            boxShadow: cell
                              ? `inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.2)`
                              : "none",
                          }}
                        />
                      )),
                    )}
                  </div>
                  {isUsed && (
                    <span className="text-xs text-muted-foreground">
                      Used
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              How to play
            </p>
            <p className="text-xs text-muted-foreground">
              1. Select a piece below
            </p>
            <p className="text-xs text-muted-foreground">
              2. Hover over the grid to preview placement
            </p>
            <p className="text-xs text-muted-foreground">
              3. Click to place it
            </p>
            <p className="text-xs text-muted-foreground">
              4. Fill a full row or column to clear it (+50 pts)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NOTES PANEL ──────────────────────────────────────────────────────────────
function DrawingCanvas({
  strokes,
  onStrokesChange,
}: {
  strokes: DrawStroke[];
  onStrokesChange: (s: DrawStroke[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawStroke["tool"]>("pen");
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const drawing = useRef(false);
  const currentStroke = useRef<DrawStroke | null>(null);
  const strokesRef = useRef(strokes);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  function getPos(
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function drawStrokeOnCtx(
    ctx: CanvasRenderingContext2D,
    stroke: DrawStroke,
  ) {
    if (stroke.points.length === 0) return;
    ctx.strokeStyle =
      stroke.tool === "eraser" ? "#111111" : stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (
      stroke.tool === "pen" ||
      stroke.tool === "eraser"
    ) {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    } else if (
      stroke.tool === "line" &&
      stroke.points.length >= 2
    ) {
      const last = stroke.points[stroke.points.length - 1];
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    } else if (
      stroke.tool === "rect" &&
      stroke.points.length >= 2
    ) {
      const last = stroke.points[stroke.points.length - 1];
      const x = Math.min(stroke.points[0].x, last.x);
      const y = Math.min(stroke.points[0].y, last.y);
      const w = Math.abs(last.x - stroke.points[0].x);
      const h = Math.abs(last.y - stroke.points[0].y);
      ctx.strokeRect(x, y, w, h);
    } else if (
      stroke.tool === "circle" &&
      stroke.points.length >= 2
    ) {
      const last = stroke.points[stroke.points.length - 1];
      const dx = last.x - stroke.points[0].x;
      const dy = last.y - stroke.points[0].y;
      const r = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(stroke.points[0].x, stroke.points[0].y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const s of strokesRef.current) drawStrokeOnCtx(ctx, s);
    if (currentStroke.current) drawStrokeOnCtx(ctx, currentStroke.current);
  }

  useEffect(() => {
    redraw();
  }, [strokes]);

  function onPointerDown(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e);
    currentStroke.current = {
      tool,
      color,
      width: tool === "eraser" ? brushSize * 3 : brushSize,
      points: [pos],
    };
    redraw();
  }

  function onPointerMove(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    e.preventDefault();
    if (!drawing.current || !currentStroke.current) return;
    const pos = getPos(e);
    if (tool === "pen" || tool === "eraser") {
      currentStroke.current.points.push(pos);
    } else {
      currentStroke.current.points = [
        currentStroke.current.points[0],
        pos,
      ];
    }
    redraw();
  }

  function onPointerUp(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!drawing.current || !currentStroke.current) return;
    drawing.current = false;
    if (currentStroke.current.points.length > 0) {
      onStrokesChange([...strokesRef.current, currentStroke.current]);
    }
    currentStroke.current = null;
  }

  const COLORS = [
    "#ffffff", "#ff6b6b", "#ffd166", "#06d6a0",
    "#118ab2", "#c77dff", "#f15bb5", "#f77f00",
    "#2ec4b6", "#e63946", "#a8dadc", "#4cc9f0",
  ];

  const toolButtons: { id: DrawStroke["tool"]; icon: React.ReactNode; label: string }[] = [
    { id: "pen", icon: <Pen className="w-3.5 h-3.5" />, label: "Pen" },
    { id: "eraser", icon: <Eraser className="w-3.5 h-3.5" />, label: "Erase" },
    { id: "line", icon: <Minus className="w-3.5 h-3.5" />, label: "Line" },
    { id: "rect", icon: <Square className="w-3.5 h-3.5" />, label: "Rect" },
    { id: "circle", icon: <Circle className="w-3.5 h-3.5" />, label: "Circle" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {toolButtons.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`p-2 rounded-lg text-xs font-semibold transition-colors ${tool === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor:
                  color === c ? "var(--primary)" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20"
          />
          <span>{brushSize}px</span>
        </div>
        <button
          type="button"
          onClick={() => onStrokesChange([])}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full rounded-xl cursor-crosshair touch-none"
        style={{ background: "#111111" }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      />
    </div>
  );
}

function NotesPanel({
  notes,
  setNotes,
}: {
  notes: NoteFile[];
  setNotes: (n: NoteFile[]) => void;
}) {
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [noteMode, setNoteMode] = useState<"text" | "draw">("text");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const openNote = notes.find((n) => n.id === openNoteId) || null;

  function createNote(e: React.FormEvent) {
    e.preventDefault();
    const note: NoteFile = {
      id: generateId(),
      name: newName.trim() || "Untitled Note",
      createdAt: todayStr(),
      textContent: "",
      drawStrokes: [],
    };
    setNotes([...notes, note]);
    setNewName("");
    setCreating(false);
    setOpenNoteId(note.id);
    setNoteMode("text");
  }

  function updateNote(id: string, changes: Partial<NoteFile>) {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, ...changes } : n)),
    );
  }

  function deleteNote(id: string) {
    setNotes(notes.filter((n) => n.id !== id));
    if (openNoteId === id) setOpenNoteId(null);
  }

  if (openNote) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-5 pb-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenNoteId(null)}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> All Notes
            </button>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-sm font-semibold truncate max-w-[200px]">
              {openNote.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                type="button"
                onClick={() => setNoteMode("text")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${noteMode === "text" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                <Type className="w-3 h-3" /> Text
              </button>
              <button
                type="button"
                onClick={() => setNoteMode("draw")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${noteMode === "draw" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                <Pen className="w-3 h-3" /> Draw
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {noteMode === "text" ? (
            <textarea
              value={openNote.textContent}
              onChange={(e) =>
                updateNote(openNote.id, {
                  textContent: e.target.value,
                })
              }
              placeholder="Start writing your notes here..."
              className="w-full h-full min-h-[60vh] resize-none rounded-xl p-5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
              style={{
                background: "#111111",
                color: "#f8f9fa",
                fontFamily: "inherit",
                caretColor: "#0ea5a0",
              }}
            />
          ) : (
            <DrawingCanvas
              strokes={openNote.drawStrokes}
              onStrokesChange={(strokes) =>
                updateNote(openNote.id, { drawStrokes: strokes })
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Notes</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Create notes with text or drawings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> New Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">
            No notes yet
          </h3>
          <p className="text-muted-foreground text-sm">
            Create a note to start writing or drawing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...notes].reverse().map((note) => (
            <div
              key={note.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
            >
              <button
                type="button"
                onClick={() => {
                  setOpenNoteId(note.id);
                  setNoteMode("text");
                }}
                className="w-full text-left p-4"
              >
                <div
                  className="h-20 rounded-lg mb-3 flex items-center justify-center text-xs text-gray-400 overflow-hidden"
                  style={{ background: "#111111" }}
                >
                  {note.textContent ? (
                    <span className="px-3 text-gray-300 line-clamp-3 text-left">
                      {note.textContent.slice(0, 120)}
                    </span>
                  ) : note.drawStrokes.length > 0 ? (
                    <span>✏️ Drawing</span>
                  ) : (
                    <span>Empty note</span>
                  )}
                </div>
                <p className="font-semibold text-sm truncate">
                  {note.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(note.createdAt)}
                  {note.drawStrokes.length > 0 && " · Has drawing"}
                </p>
              </button>
              <div className="px-4 pb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenNoteId(note.id);
                    setNoteMode("draw");
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  <Pen className="w-3 h-3" /> Draw
                </button>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={createNote}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">New Note</h3>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Note Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Biology Chapter 3"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "suggestion",
    message: "",
  });
  const [sent, setSent] = useState(false);
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setForm({
      name: "",
      email: "",
      type: "suggestion",
      message: "",
    });
  }
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Have a suggestion, found a bug, or want to request a
          new feature?
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: "💡",
            title: "Suggestions",
            desc: "Ideas to improve ScotStudy",
          },
          {
            icon: "🐛",
            title: "Bug Reports",
            desc: "Something not working?",
          },
          {
            icon: "📚",
            title: "Content Requests",
            desc: "New subjects or features",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="bg-card border border-border rounded-xl p-4 text-center"
          >
            <span className="text-2xl">{c.icon}</span>
            <p className="font-semibold text-sm mt-1">
              {c.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {c.desc}
            </p>
          </div>
        ))}
      </div>
      {sent ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold text-green-800 dark:text-green-300">
            Message Sent!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
            Thanks for getting in touch. We&apos;ll look into
            your message soon.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Your Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                  }))
                }
                required
                placeholder="First name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Email (optional)
              </label>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    email: e.target.value,
                  }))
                }
                type="email"
                placeholder="For a reply"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="content">Content Request</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  message: e.target.value,
                }))
              }
              required
              rows={4}
              placeholder="Tell us what you think..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" /> Send Message
          </button>
        </form>
      )}
    </div>
  );
}

// ─── SUBJECT MANAGER ──────────────────────────────────────────────────────────
function SubjectManager({
  selectedSubjects,
  setSelectedSubjects,
}: {
  selectedSubjects: SelectedSubject[];
  setSelectedSubjects: (s: SelectedSubject[]) => void;
}) {
  const [search, setSearch] = useState("");
  function toggle(subject: string, level: Level) {
    const exists = selectedSubjects.find(
      (s) => s.subject === subject && s.level === level,
    );
    setSelectedSubjects(
      exists
        ? selectedSubjects.filter(
            (s) =>
              !(s.subject === subject && s.level === level),
          )
        : [...selectedSubjects, { subject, level }],
    );
  }
  const filtered = SUBJECTS_LIST.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">My Subjects</h1>
        <p className="text-muted-foreground text-xs">
          Toggle subjects and levels — changes apply
          immediately.
        </p>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search subjects..."
        className="w-full px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid gap-2">
        {filtered.map((subject) => (
          <div
            key={subject}
            className="border border-border rounded-xl p-3 bg-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: getSubjectColor(subject),
                }}
              />
              <span className="font-semibold text-sm">
                {subject}
              </span>
            </div>
            <div className="flex gap-2">
              {LEVELS.map((level) => {
                const active = selectedSubjects.some(
                  (s) =>
                    s.subject === subject && s.level === level,
                );
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggle(subject, level)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"}`}
                  >
                    {active && "✓ "}
                    {LEVEL_SHORT[level]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("access");
  const [currentUser, setCurrentUser] =
    useState<AppUser | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [showSubjectManager, setShowSubjectManager] =
    useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    "qs_dark",
    false,
  );
  const [users, setUsersRaw] = useLocalStorage<AppUser[]>(
    "qs_users",
    [],
  );
  const [selectedSubjects, setSelectedSubjectsRaw] =
    useLocalStorage<SelectedSubject[]>("qs_subjects", []);
  const [scores, setScoresRaw] = useLocalStorage<ScoreEntry[]>(
    "qs_scores",
    [],
  );
  const [tasks, setTasksRaw] = useLocalStorage<Task[]>(
    "qs_tasks",
    [],
  );
  const [examDates, setExamDatesRaw] = useLocalStorage<
    ExamDate[]
  >("qs_exams", []);
  const [notes, setNotesRaw] = useLocalStorage<NoteFile[]>(
    "qs_notes",
    [],
  );
  const [sessionUserId, setSessionUserId] =
    useLocalStorage<string>("qs_session_uid", "");

  const setUsers = (u: AppUser[]) => setUsersRaw(u);
  const setSelectedSubjects = (s: SelectedSubject[]) =>
    setSelectedSubjectsRaw(s);
  const setScores = (s: ScoreEntry[]) => setScoresRaw(s);
  const setTasks = (t: Task[]) => setTasksRaw(t);
  const setExamDates = (e: ExamDate[]) => setExamDatesRaw(e);
  const setNotes = (n: NoteFile[]) => setNotesRaw(n);

  useEffect(() => {
    if (!document.getElementById("emailjs-sdk")) {
      const s = document.createElement("script");
      s.id = "emailjs-sdk";
      s.src =
        "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      s.onload = () => {
        if (window.emailjs)
          window.emailjs.init(EMAILJS_PUBLIC_KEY);
      };
      document.head.appendChild(s);
    } else if (window.emailjs) {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (sessionUserId) {
      const u = users.find(
        (x) =>
          x.id === sessionUserId && x.status === "approved",
      );
      if (u) {
        setCurrentUser(u);
        setScreen(
          selectedSubjects.length === 0 ? "onboarding" : "app",
        );
      }
    }
  }, []);

  // Task notification checker (every 60s)
  useEffect(() => {
    if (screen !== "app" || !currentUser) return;
    function check() {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (timeStr === "08:00") {
        setTasksRaw((prev) => {
          let changed = false;
          const next = prev.map((t) => {
            if (
              !t.completed &&
              !t.notified &&
              t.dueDate === dateStr
            ) {
              changed = true;
              sendEmailJS(
                currentUser!.email,
                currentUser!.name,
                "TASK_DUE",
                `ScotStudy Task Due Today: ${t.title}`,
                `Hi ${currentUser!.name},\n\nJust a reminder that your task is due today:\n\n"${t.title}"${t.subject ? ` (${t.subject})` : ""}\n\nDue: ${formatDate(t.dueDate)}\n\nGood luck!\n\nScotStudy`,
              );
              return { ...t, notified: true };
            }
            return t;
          });
          return changed ? next : prev;
        });
      }
    }
    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [screen, currentUser]);

  function handleApproved(u: AppUser) {
    setCurrentUser(u);
    setSessionUserId(u.id);
    setScreen(
      selectedSubjects.length === 0 ? "onboarding" : "app",
    );
  }

  function handleOnboardingDone(subjects: SelectedSubject[]) {
    setSelectedSubjects(subjects);
    setScreen("app");
  }

  function handleLogout() {
    setCurrentUser(null);
    setSessionUserId("");
    setSidebarOpen(false);
    setScreen("access");
  }

  function navigateTo(v: View) {
    setView(v);
    setShowSubjectManager(false);
    setSidebarOpen(false);
  }

  if (screen === "access") {
    return (
      <AccessGate
        onApproved={handleApproved}
        onAdmin={() => setScreen("admin")}
        users={users}
        setUsers={setUsers}
      />
    );
  }

  if (screen === "admin") {
    return (
      <AdminPanel
        users={users}
        setUsers={setUsers}
        onBack={() => setScreen("access")}
      />
    );
  }

  if (screen === "onboarding") {
    return <OnboardingModal onDone={handleOnboardingDone} />;
  }

  if (!currentUser) {
    return (
      <AccessGate
        onApproved={handleApproved}
        onAdmin={() => setScreen("admin")}
        users={users}
        setUsers={setUsers}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar
          view={view}
          setView={navigateTo}
          user={currentUser}
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDark={() => setDarkMode((d: boolean) => !d)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-foreground shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none">
                ScotStudy
              </p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                Scottish QS Study Companion
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowSubjectManager((v) => !v);
                setSidebarOpen(false);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Subjects (
              {selectedSubjects.length})
            </button>
            <button
              type="button"
              onClick={() => navigateTo("tasks")}
              className="relative p-2 rounded-xl hover:bg-muted transition-colors"
              title="Tasks"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((d: boolean) => !d)}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showSubjectManager ? (
            <div>
              <div className="px-6 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubjectManager(false)}
                  className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" />{" "}
                  Back to {view}
                </button>
              </div>
              <SubjectManager
                selectedSubjects={selectedSubjects}
                setSelectedSubjects={setSelectedSubjects}
              />
            </div>
          ) : (
            <>
              {view === "dashboard" && (
                <Dashboard
                  user={currentUser}
                  selectedSubjects={selectedSubjects}
                  examDates={examDates}
                  scores={scores}
                  tasks={tasks}
                  setView={navigateTo}
                />
              )}
              {view === "papers" && (
                <PastPapers
                  selectedSubjects={selectedSubjects}
                />
              )}
              {view === "scores" && (
                <ScoreTracker
                  scores={scores}
                  setScores={setScores}
                  selectedSubjects={selectedSubjects}
                />
              )}
              {view === "focus" && <FocusTimer />}
              {view === "tasks" && (
                <Tasks
                  tasks={tasks}
                  setTasks={setTasks}
                  selectedSubjects={selectedSubjects}
                />
              )}
              {view === "exams" && (
                <ExamsPanel
                  examDates={examDates}
                  setExamDates={setExamDates}
                  selectedSubjects={selectedSubjects}
                />
              )}
              {view === "wellbeing" && <Wellbeing />}
              {view === "break" && <BreakGame />}
              {view === "notes" && (
                <NotesPanel
                  notes={notes}
                  setNotes={setNotes}
                />
              )}
              {view === "contact" && <ContactUs />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
