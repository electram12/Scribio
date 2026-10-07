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
  Calculator,
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
  Camera,
  Upload,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Loader2,
  ScanSearch,
} from "lucide-react";
import logoImg from "../imports/1000186272.png";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  firebaseConfigured,
  firebaseAuth,
  loadStudyData,
  loadUserProfile,
  saveStudyData,
  fetchUserProfiles,
  signInWithPassword,
  signUpWithPassword,
  upsertProfile,
} from "../lib/firebase";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Level = "National 5" | "Higher" | "Advanced Higher";
type View =
  | "dashboard"
  | "papers"
  | "scores"
  | "focus"
  | "examTimer"
  | "examMarker"
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
  type: "Practice" | "Test" | "Prelim" | "Past Paper" | "Exam";
  notes: string;
}
interface Recommendation {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  date: string;
}
interface AccessibilitySettings {
  fontScale: number;
  fontFamily: "default" | "serif" | "mono";
  colour: "default" | "warm" | "cool";
  highContrast: boolean;
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
const ADMIN_PASSWORD = "Scribio@2026";

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

function getSubjectColor(_subject: string): string {
  return "#3b82f6";
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

function userStorageKey(prefix: string, userId?: string) {
  return userId ? `${prefix}_${userId}` : `${prefix}_guest`;
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
      className={`${outer} rounded-2xl flex items-center justify-center shrink-0`}
      style={{ backgroundColor: "var(--logo-background)" }}
    >
      <img
        src={logoImg}
        alt="Scribio"
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
function ThemeToggle({ darkMode, onToggle }: { darkMode: boolean; onToggle: () => void }) {
  return <button type="button" onClick={onToggle} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} title={darkMode ? "Switch to light mode" : "Switch to dark mode"} className="fixed right-4 top-4 z-[60] inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-md">
    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    {darkMode ? "Light mode" : "Dark mode"}
  </button>;
}

function AccessGate({
  onApproved,
  onAdmin,
  users,
  setUsers,
  darkMode,
  toggleDark,
}: {
  onApproved: (u: AppUser) => void;
  onAdmin: () => void;
  users: AppUser[];
  setUsers: (u: AppUser[]) => void;
  darkMode: boolean;
  toggleDark: () => void;
}) {
  const [tab, setTab] = useState<"login" | "request" | "admin">(
    "login",
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetForm, setResetForm] = useState({
    name: "",
    email: "",
    school: "",
    password: "",
    confirm: "",
  });
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
    setResetMode(false);
    setResetDone(false);
    setResetError("");
  }

  async function handleLogin(e: React.FormEvent) {
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

    if (firebaseConfigured && firebaseAuth) {
      try {
        const userCredential = await signInWithPassword(email, loginPassword);
        const user = userCredential.user;
        const profile = await loadUserProfile(user.uid);

        const approvedUser: AppUser = {
          id: user.uid,
          name: profile?.name ?? user.email?.split("@")[0] ?? "Student",
          email: user.email ?? email,
          school: profile?.school ?? "",
          passwordHash: simpleHash(loginPassword),
          status: (profile?.status as UserStatus | undefined) ?? "approved",
          requestDate: profile?.requestDate ?? todayStr(),
        };

        setUsers(
          users.some((userItem) => userItem.id === approvedUser.id)
            ? users.map((userItem) =>
                userItem.id === approvedUser.id ? approvedUser : userItem,
              )
            : [...users, approvedUser],
        );
        setLoginError("");
        onApproved(approvedUser);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to sign in.";
        setLoginError(
          message.includes("password") || message.includes("credential")
            ? "Incorrect email or password. Please try again."
            : "Unable to sign in right now. Please try again.",
        );
        return;
      }
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

  function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetForm.password.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (resetForm.password !== resetForm.confirm) {
      setResetError("Passwords do not match.");
      return;
    }

    const email = resetForm.email.trim().toLowerCase();
    const name = resetForm.name.trim().toLowerCase();
    const school = resetForm.school.trim().toLowerCase();
    const account = users.find(
      (user) =>
        user.status === "approved" &&
        user.email.trim().toLowerCase() === email &&
        user.name.trim().toLowerCase() === name &&
        user.school.trim().toLowerCase() === school,
    );

    if (!account) {
      setResetError("We couldn’t verify those details. Check them or contact your administrator.");
      return;
    }

    setUsers(
      users.map((user) =>
        user.id === account.id
          ? { ...user, passwordHash: simpleHash(resetForm.password) }
          : user,
      ),
    );
    setLoginEmail(account.email);
    setLoginPassword("");
    setResetError("");
    setResetDone(true);
  }

  async function handleRequest(e: React.FormEvent) {
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

    if (firebaseConfigured && firebaseAuth) {
      try {
        const userCredential = await signUpWithPassword(email, reqPassword);
        const user = userCredential.user;
        const newUser: AppUser = {
          id: user.uid,
          name: reqName.trim(),
          email,
          school: reqSchool.trim(),
          passwordHash: simpleHash(reqPassword),
          status: "pending",
          requestDate: todayStr(),
        };

        await upsertProfile(user.uid, {
          name: newUser.name,
          email: newUser.email,
          school: newUser.school,
          passwordHash: newUser.passwordHash,
          status: newUser.status,
          requestDate: newUser.requestDate,
        });

        setUsers([...users, newUser]);
        setReqDone(true);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create your access request right now.";
        setReqError(message || "Unable to create your access request right now.");
        return;
      }
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
    <div className="access-gate min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <ThemeToggle darkMode={darkMode} onToggle={toggleDark} />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Scribio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
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
            {tab === "login" && !resetMode && (
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
                <p className="text-right text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setResetForm((form) => ({ ...form, email: loginEmail }));
                      setResetError("");
                      setResetMode(true);
                    }}
                    className="text-accent font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </p>
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

            {tab === "login" && resetMode && !resetDone && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Reset your password</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confirm your account details to reset the password saved on this device. No email will be sent.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="reset-name">Full Name</label>
                  <input
                    id="reset-name"
                    value={resetForm.name}
                    onChange={(event) => setResetForm({ ...resetForm, name: event.target.value })}
                    required
                    autoComplete="name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="reset-email">Email Address</label>
                  <input
                    id="reset-email"
                    value={resetForm.email}
                    onChange={(event) => setResetForm({ ...resetForm, email: event.target.value })}
                    type="email"
                    required
                    autoComplete="email"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="reset-school">School</label>
                  <input
                    id="reset-school"
                    value={resetForm.school}
                    onChange={(event) => setResetForm({ ...resetForm, school: event.target.value })}
                    required
                    autoComplete="organization"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="reset-password">New Password</label>
                  <input
                    id="reset-password"
                    value={resetForm.password}
                    onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })}
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="reset-confirm">Confirm New Password</label>
                  <input
                    id="reset-confirm"
                    value={resetForm.confirm}
                    onChange={(event) => setResetForm({ ...resetForm, confirm: event.target.value })}
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </div>
                {resetError && (
                  <p className="text-destructive text-xs" role="alert">{resetError}</p>
                )}
                <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Reset Password
                </button>
                <button type="button" onClick={() => setResetMode(false)} className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground">
                  Back to Log In
                </button>
              </form>
            )}

            {tab === "login" && resetDone && (
              <div className="space-y-4 py-2 text-center">
                <Check className="mx-auto h-10 w-10 text-green-600" />
                <div>
                  <h2 className="font-bold text-foreground">Password reset</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Your new password is saved on this device. You can now log in.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetDone(false);
                    setResetForm({ name: "", email: "", school: "", password: "", confirm: "" });
                  }}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Back to Log In
                </button>
              </div>
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
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-sm font-semibold text-foreground">
                  <Shield className="w-4 h-4 shrink-0 text-primary" />
                  Admin access only
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-foreground">
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

        <p className="text-center text-muted-foreground text-xs mt-6">
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
  recommendations,
  onBack,
  darkMode,
  toggleDark,
}: {
  users: AppUser[];
  setUsers: (u: AppUser[]) => void;
  recommendations: Recommendation[];
  onBack: () => void;
  darkMode: boolean;
  toggleDark: () => void;
}) {
  const [toast, setToast] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [emailFailures, setEmailFailures] = useState<Record<string, UserStatus>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [emailJsConfig, setEmailJsConfig] = useLocalStorage("scribio_emailjs_config", {
    serviceId: "",
    templateId: "",
    publicKey: "",
  });
  const [emailJsDraft, setEmailJsDraft] = useState(emailJsConfig);
  const emailJsConfigured = Boolean(
    emailJsConfig.serviceId && emailJsConfig.templateId && emailJsConfig.publicKey,
  );

  useEffect(() => {
    if (!firebaseConfigured) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const freshProfiles = await fetchUserProfiles();
        if (!isMounted) return;

        const mapped = freshProfiles.map((profile) => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          school: profile.school,
          passwordHash: profile.passwordHash ?? simpleHash(""),
          status: profile.status,
          requestDate: profile.requestDate || todayStr(),
        }));

        if (mapped.length !== users.length || mapped.some((item) => !users.some((existing) => existing.id === item.id && existing.status === item.status))) {
          setUsers(mapped);
        }
      } catch (error) {
        console.warn("Failed to refresh admin user list:", error);
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [firebaseConfigured, users, setUsers]);

  const pending = [...users]
    .filter((u) => u.status === "pending")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  const approved = [...users]
    .filter((u) => u.status === "approved")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  const denied = [...users]
    .filter((u) => u.status === "denied")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  function saveEmailJsSettings(event: React.FormEvent) {
    event.preventDefault();
    const config = {
      serviceId: emailJsDraft.serviceId.trim(),
      templateId: emailJsDraft.templateId.trim(),
      publicKey: emailJsDraft.publicKey.trim(),
    };
    if (!config.serviceId || !config.templateId || !config.publicKey) {
      showToast("Enter the EmailJS service ID, template ID, and public key.", false);
      return;
    }
    setEmailJsConfig(config);
    setEmailJsDraft(config);
    showToast("EmailJS settings saved in this browser.", true);
  }

  async function sendDecisionEmail(user: AppUser, status: UserStatus) {
    if (!emailJsConfigured) {
      throw new Error("EmailJS is not configured. Add the service ID, template ID, and public key in Admin Panel settings.");
    }

    const decisionMessage = status === "approved"
      ? "Your access request has been approved. You can now sign in."
      : "Your access request was not approved. Please contact the administrator if you have questions.";
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: emailJsConfig.serviceId,
        template_id: emailJsConfig.templateId,
        user_id: emailJsConfig.publicKey,
        template_params: {
          to_email: user.email,
          to_name: user.name,
          user_email: user.email,
          user_name: user.name,
          name: user.name,
          school: user.school,
          status,
          decision: status,
          message: decisionMessage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`EmailJS returned ${response.status}. Check the service and template settings.`);
    }
  }

  async function retryDecisionEmail(user: AppUser) {
    const status = emailFailures[user.id];
    if (!status || status === "pending") return;
    setSending(user.id);
    try {
      await sendDecisionEmail(user, status);
      setEmailFailures((previous) => {
        const next = { ...previous };
        delete next[user.id];
        return next;
      });
      showToast(`Notification email sent to ${user.email}.`, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error.";
      showToast(`Email to ${user.email} failed: ${message}`, false);
    } finally {
      setSending(null);
    }
  }

  async function updateStatus(id: string, status: UserStatus) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setUsers(
      users.map((x) => (x.id === id ? { ...x, status } : x)),
    );
    setSending(id);
    try {
      if (firebaseConfigured) {
        await upsertProfile(id, {
          name: u.name,
          email: u.email,
          school: u.school,
          passwordHash: u.passwordHash,
          status,
          requestDate: u.requestDate,
        });
      }
      await sendDecisionEmail(u, status);
      setEmailFailures((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      showToast(`${u.name} was ${status} and notified by email.`, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error.";
      setEmailFailures((previous) => ({ ...previous, [id]: status }));
      showToast(`Status updated, but email to ${u.email} failed: ${message}`, false);
    } finally {
      setSending(null);
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
    <div className="min-h-screen bg-background text-foreground p-4">
      <ThemeToggle darkMode={darkMode} onToggle={toggleDark} />
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
            className="flex items-center gap-1.5 border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-semibold px-3 py-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Login
          </button>
          <div className="flex items-center gap-2 ml-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">
              Admin Panel
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Pending",
              count: pending.length,
              color: "text-amber-700 dark:text-amber-300",
            },
            {
              label: "Approved",
              count: approved.length,
              color: "text-green-700 dark:text-green-300",
            },
            {
              label: "Denied",
              count: denied.length,
              color: "text-red-700 dark:text-red-300",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-4 text-center shadow-sm"
            >
              <div className={`text-3xl font-black ${s.color}`}>
                {s.count}
              </div>
              <div className="text-muted-foreground text-xs mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={saveEmailJsSettings} className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-foreground">EmailJS settings</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect approval and denial notifications for this browser.
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${emailJsConfigured ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}`}>
              {emailJsConfigured ? "Configured" : "Not configured"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-xs font-semibold text-foreground" htmlFor="emailjs-service-id">
              Service ID
              <input
                id="emailjs-service-id"
                value={emailJsDraft.serviceId}
                onChange={(event) => setEmailJsDraft({ ...emailJsDraft, serviceId: event.target.value })}
                autoComplete="off"
                required
                className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-foreground" htmlFor="emailjs-template-id">
              Template ID
              <input
                id="emailjs-template-id"
                value={emailJsDraft.templateId}
                onChange={(event) => setEmailJsDraft({ ...emailJsDraft, templateId: event.target.value })}
                autoComplete="off"
                required
                className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-foreground" htmlFor="emailjs-public-key">
              Public Key
              <input
                id="emailjs-public-key"
                value={emailJsDraft.publicKey}
                onChange={(event) => setEmailJsDraft({ ...emailJsDraft, publicKey: event.target.value })}
                autoComplete="off"
                required
                className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-xs text-muted-foreground">
              Use the EmailJS Public Key only. Do not enter your private key. The template recipient must be set to{" "}
              <code className="font-semibold">{"{{to_email}}"}</code>.
            </p>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Save EmailJS settings
            </button>
          </div>
        </form>

        <div className="bg-card rounded-2xl overflow-hidden shadow-xl">
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
                          {emailFailures[u.id] && (
                            <button
                              type="button"
                              disabled={sending === u.id}
                              onClick={() => retryDecisionEmail(u)}
                              title={`Retry ${emailFailures[u.id]} notification email`}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-300"
                            >
                              <Mail className="h-3 w-3" /> Retry email
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

        <div className="mt-4 bg-card rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-foreground">Recommendations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Feedback submitted from Contact Us.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {recommendations.length} record{recommendations.length !== 1 ? "s" : ""}
            </span>
          </div>
          {recommendations.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No recommendations yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {[...recommendations].reverse().map((recommendation) => (
                <div key={recommendation.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {recommendation.type} from {recommendation.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recommendation.email || "No reply email provided"} · {formatDate(recommendation.date)}
                      </p>
                    </div>
                    <span className="text-xs uppercase font-bold text-accent">{recommendation.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                    {recommendation.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 bg-card border border-border rounded-xl px-5 py-4 flex items-start gap-3">
          <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground text-xs font-semibold">
              Account decisions are stored locally
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
  darkMode,
  toggleDark,
}: {
  onDone: (subjects: SelectedSubject[]) => void;
  darkMode: boolean;
  toggleDark: () => void;
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
    <div className="fixed inset-0 bg-background text-foreground flex items-center justify-center z-50 p-4">
      <ThemeToggle darkMode={darkMode} onToggle={toggleDark} />
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
  { id: "examMarker", label: "Exam Marker", icon: ScanSearch },
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
  const [timerOpen, setTimerOpen] = useState(
    view === "focus" || view === "examTimer",
  );

  useEffect(() => {
    if (view === "focus" || view === "examTimer") setTimerOpen(true);
  }, [view]);

  return (
    <aside className="w-60 h-full bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" />
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-none">
              Scribio
            </p>
            <p className="text-xs text-sidebar-foreground/70 leading-none mt-0.5">
              QS Companion
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setView(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left relative ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-sidebar-primary" />
                )}
              </button>
              {item.id === "scores" && (
                <div>
                  <button
                    type="button"
                    onClick={() => setTimerOpen((open) => !open)}
                    aria-expanded={timerOpen}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left ${view === "focus" || view === "examTimer" ? "text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}
                  >
                    <Timer className="w-4 h-4 shrink-0" />
                    <span className="flex-1">Timer</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${timerOpen ? "rotate-180" : ""}`} />
                  </button>
                  {timerOpen && (
                    <div className="pb-1">
                      {([
                        { id: "focus", label: "Focus Timer", icon: Timer },
                        { id: "examTimer", label: "Exam Timer", icon: Clock },
                      ] as const).map((timer) => {
                        const TimerIcon = timer.icon;
                        const timerActive = view === timer.id;
                        return (
                          <button
                            key={timer.id}
                            type="button"
                            onClick={() => {
                              setView(timer.id);
                              onClose();
                            }}
                            className={`w-full flex items-center gap-3 pl-11 pr-4 py-2 text-sm font-medium transition-all text-left ${timerActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}
                          >
                            <TimerIcon className="w-4 h-4 shrink-0" />
                            {timer.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 px-1 mb-2">
          <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-sidebar-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {user.school}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleDark}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground transition-colors text-xs font-medium"
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
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground transition-colors text-xs font-medium"
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
          Browse your selected subjects on the official QS past papers website.
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
                  <article
                    key={`${s.subject}-${s.level}`}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                        style={{
                          backgroundColor: `${getSubjectColor(s.subject)}22`,
                          borderColor: `${getSubjectColor(s.subject)}55`,
                        }}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getSubjectColor(s.subject) }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{s.subject}</h3>
                        <p className="text-xs text-muted-foreground">{s.level} · QS Past Papers</p>
                      </div>
                    </div>
                    <a
                      href={getQSPastPaperLink(s.subject, s.level)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Open QS Past Papers <ExternalLink className="h-4 w-4" />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function getQSPastPaperLink(subject: string, level: Level): string {
  const officialNames: Record<string, string> = {
    "Administration & IT": "Administration and IT",
    "Art & Design": "Art and Design",
    "Home Economics": "Health and Food Technology",
    RMPS: "Religious, Moral and Philosophical Studies",
  };
  const name = officialNames[subject] || subject;
  const levelCode = level === "National 5" ? "N5" : level === "Advanced Higher" ? "NAH" : "NH";
  return `https://www.sqa.org.uk/pastpapers/findpastpaper.htm?subject=${encodeURIComponent(name)}&qualification=NQ&level=${levelCode}`;
}

interface ExaminerResult {
  estimatedMark: number;
  maxMarks: number;
  feedbackAndFixes: string[];
  overview: string;
  questionPlainEnglish?: string;
  fullCalculationAndWorking?: string;
  markAllocationBreakdown: string[];
  questionOverview?: string;
  calculationAndSolutionBreakdown?: string[];
  markingSchemeAlignment?: string[];
  questionSpecificFeedback?: string;
  markerRoute?: string[];
  answerOverview?: string;
  marksAwarded?: { awarded: number; available: number; explanation: string };
  guidance: string[];
  stepByStep: string[];
  qsKeywords: string[];
  zeroMarkTraps: string[];
  practiceChallenge: { question: string; answer: string };
}

type ExaminerDocumentType = "question" | "answer" | "markingScheme";
interface ExamMarkerImage {
  id: string;
  file: File;
  preview: string;
  type: ExaminerDocumentType;
}
interface ExamMarkerResult {
  questionExplanation: string[];
  markingSchemeExplanation: string[];
  score: number | null;
  maxMarks: number | null;
  markBreakdown: { criterion: string; available: number; awarded: number | null; rationale: string }[];
  answerFeedback: string[];
  improvements: string[];
  confidenceNote: string;
}
interface ExaminerPhoto {
  file: File;
  preview: string;
  type: ExaminerDocumentType;
  ocrText: string;
  ocrStatus: "reading" | "complete" | "failed";
  crop?: Crop;
  cropPreview?: string;
}

type PhysicsCategory = "mass" | "acceleration" | "speed" | "distance" | "time" | "current" | "voltage" | "resistance" | "force" | "angle";
interface PhysicsVariable {
  symbol: string;
  name: string;
  category: PhysicsCategory;
  unit: string;
}
interface PhysicsRule {
  topic: string;
  concept: string;
  formula: string;
  rearrangement: string;
  variables: PhysicsVariable[];
  unit: string;
  unitPattern: RegExp;
  formulaPattern: RegExp;
  calculate: (values: number[]) => number;
  sampleValues: number[];
}

interface Measurement {
  value: number;
  category: PhysicsCategory;
  unit: string;
}

function extractMeasurements(text: string): Measurement[] {
  const pattern = /(-?\d+(?:\.\d+)?)\s*(km\/h|m\/s(?:\^?2|²)?|kg|g|km|m|s|sec(?:onds?)?|min(?:utes?)?|hours?|h|amps?|a|volts?|v|ohms?|Ω|watts?|w|joules?|j|coulombs?|c|degrees?|deg|°)(?![a-z])/gi;
  const measurements: Measurement[] = [];
  for (const match of text.matchAll(pattern)) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase().replaceAll(" ", "");
    let category: PhysicsCategory | null = null;
    let convertedValue = value;
    if (unit === "kg" || unit === "g") {
      category = "mass";
      if (unit === "g") convertedValue /= 1000;
    } else if (unit.startsWith("m/s")) {
      category = unit.includes("2") || unit.includes("²") ? "acceleration" : "speed";
    } else if (unit === "km/h") {
      category = "speed";
      convertedValue *= 1000 / 3600;
    } else if (unit === "km" || unit === "m") {
      category = "distance";
      if (unit === "km") convertedValue *= 1000;
    } else if (["s", "sec", "second", "seconds", "min", "minute", "minutes", "h", "hour", "hours"].includes(unit)) {
      category = "time";
      if (unit.startsWith("min")) convertedValue *= 60;
      if (unit === "h" || unit.startsWith("hour")) convertedValue *= 3600;
    } else if (["a", "amp", "amps"].includes(unit)) category = "current";
    else if (["v", "volt", "volts"].includes(unit)) category = "voltage";
    else if (["ohm", "ohms", "ω"].includes(unit)) category = "resistance";
    else if (["n", "newton", "newtons"].includes(unit)) category = "force";
    else if (["degree", "degrees", "deg", "°"].includes(unit)) category = "angle";
    if (category) measurements.push({ value: convertedValue, category, unit: match[2] });
  }
  return measurements;
}

function getPhysicsRule(text: string): PhysicsRule {
  const lower = text.toLowerCase();
  if (/voltage|resistance|ohm|current|electrical/.test(lower) && /power|watt/.test(lower)) {
    return {
      topic: "Electrical power", concept: "Electrical power is the rate of energy transfer in a circuit.", formula: "P = V I", rearrangement: "P is already the subject.",
      variables: [{ symbol: "V", name: "potential difference", category: "voltage", unit: "V" }, { symbol: "I", name: "current", category: "current", unit: "A" }],
      unit: "W", unitPattern: /\b(?:W|watts?)\b/i, formulaPattern: /\bp\s*=\s*v\s*[×*]?\s*i\b|power\s*=\s*(?:potential difference|voltage)\s*(?:×|times|\*)\s*current/i, calculate: ([voltage, current]) => voltage * current, sampleValues: [12, 2],
    };
  }
  if (/voltage|resistance|ohm|current|electrical/.test(lower)) {
    return {
      topic: "Electricity and Ohm's law", concept: "Ohm's law links potential difference, current and resistance in a circuit.", formula: "V = I R", rearrangement: "V is already the subject.",
      variables: [{ symbol: "I", name: "current", category: "current", unit: "A" }, { symbol: "R", name: "resistance", category: "resistance", unit: "Ω" }],
      unit: "V", unitPattern: /\b(?:V|volts?)\b/i, formulaPattern: /\bv\s*=\s*i\s*[×*]?\s*r\b|ohm'?s law/i, calculate: ([current, resistance]) => current * resistance, sampleValues: [2, 6],
    };
  }
  if (/acceleration|initial velocity|final velocity|speeding up|slowing down/.test(lower)
    && !/(?:calculate|find|determine|work out|what is)\s+(?:the\s+)?(?:resultant\s+)?force/.test(lower)) {
    return {
      topic: "Dynamics: acceleration", concept: "Acceleration measures the change in velocity per unit time.", formula: "a = (v - u) / t", rearrangement: "Acceleration is the change in velocity divided by elapsed time.",
      variables: [{ symbol: "u", name: "initial velocity", category: "speed", unit: "m/s" }, { symbol: "v", name: "final velocity", category: "speed", unit: "m/s" }, { symbol: "t", name: "time", category: "time", unit: "s" }],
      unit: "m/s²", unitPattern: /\bm\s*\/\s*s(?:\^?2|²)\b/i, formulaPattern: /\ba\s*=\s*\(?\s*v\s*-\s*u\s*\)?\s*\/\s*t\b|change in velocity.{0,30}(?:time|second)/i, calculate: ([initial, final, time]) => (final - initial) / time, sampleValues: [0, 20, 4],
    };
  }
  if (/speed|velocity|distance|displacement/.test(lower) && /time|second|hour/.test(lower)) {
    return {
      topic: "Dynamics: speed", concept: "Average speed is the distance travelled divided by the time taken.", formula: "v = d / t", rearrangement: "Speed is already the subject.",
      variables: [{ symbol: "d", name: "distance", category: "distance", unit: "m" }, { symbol: "t", name: "time", category: "time", unit: "s" }],
      unit: "m/s", unitPattern: /\bm\s*\/\s*s\b/i, formulaPattern: /\bv\s*=\s*d\s*\/\s*t\b|distance.{0,30}(?:divided by|over).{0,10}time/i, calculate: ([distance, time]) => distance / time, sampleValues: [100, 20],
    };
  }
  return {
    topic: "Dynamics: resultant force", concept: "Newton's second law states that the resultant force equals mass multiplied by acceleration.", formula: "F = m a", rearrangement: "Force is already the subject.",
    variables: [{ symbol: "m", name: "mass", category: "mass", unit: "kg" }, { symbol: "a", name: "acceleration", category: "acceleration", unit: "m/s²" }],
    unit: "N", unitPattern: /\b(?:N|newtons?)\b/i, formulaPattern: /\bf\s*=\s*m\s*[×*]?\s*a\b|newton'?s second law|force\s*=\s*mass.{0,20}acceleration/i, calculate: ([mass, acceleration]) => mass * acceleration, sampleValues: [2, 3],
  };
}

function getSubjectFamily(subject: string): "science" | "maths" | "humanities" | "english" | "computing" {
  const normalized = subject.toLowerCase();
  if (/physics|chemistry|biology/.test(normalized)) return "science";
  if (/mathematics|maths/.test(normalized)) return "maths";
  if (/history|modern studies|geography|rmps/.test(normalized)) return "humanities";
  if (/english|french|german|spanish|latin/.test(normalized)) return "english";
  if (/computing/.test(normalized)) return "computing";
  return "humanities";
}

function evaluateTextSubject(
  level: Level,
  subject: string,
  questionText: string,
  studentAnswerText: string,
  markingSchemeText: string,
  hasImages: boolean,
  imageTextFound: boolean,
): ExaminerResult {
  const answer = studentAnswerText.trim();
  const lowerAnswer = answer.toLowerCase();
  const lowerQuestion = questionText.toLowerCase();
  const lowerScheme = markingSchemeText.toLowerCase();
  const family = getSubjectFamily(subject);
  const criteria: { label: string; awarded: boolean; detail: string }[] = [];
  let topic = `${subject} at ${level}`;
  let explanation = "Identify what the question asks, select relevant subject knowledge, and support each step with evidence or reasoning.";
  let workedExample = "Read the command word, make one precise point, support it with relevant evidence, and explain how that evidence answers the question.";
  let traps: string[] = [];
  let keywords: string[] = [];
  let sampleQuestion = `How would you explain a key idea in ${subject}?`;
  let sampleAnswer = "Use a precise point, relevant evidence, and a clear explanation linked to the question.";

  if (family === "science") {
    const chemistry = subject.toLowerCase() === "chemistry";
    const biology = subject.toLowerCase() === "biology";
    topic = chemistry ? "Chemistry: scientific relationships and equations" : biology ? "Biology: scientific relationships and evidence" : getPhysicsRule(questionText || markingSchemeText).topic;
    explanation = chemistry
      ? "Identify the chemical process, state a balanced equation or relationship, then show how the evidence supports the calculated or explained result."
      : biology
        ? "Connect the biological process to its cause and effect, use accurate terminology, and support any calculation with the correct relationship and units."
        : `${getPhysicsRule(questionText || markingSchemeText).concept} At ${level}, show the relationship, substitution, calculation, and unit rather than giving only a final number.`;
    const hasEquation = /(?:\b[A-Z][a-z]?(?:\d+)?\s*(?:\+|→|->|⇌|=)\s*[A-Z][a-z]?(?:\d+)?|\b[a-z]\s*=\s*[^\n]+)/.test(answer);
    const relationship = /\b(?:because|therefore|so that|causes?|results? in|leads? to|increases?|decreases?)\b/i.test(answer);
    const numericalQuestion = /calculate|determine|find|work out|how much|how many|speed|force|voltage|current|resistance|concentration|mass|moles|rate|magnification/i.test(questionText);
    const questionMeasurements = extractMeasurements(`${questionText}\n${markingSchemeText}`);
    const answerNumbers = [...answer.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    const answerHasOperation = /[×*÷/]|\b(?:times|multiplied|divided|over)\b/i.test(answer);
    const unitPresent = /\b(?:m|cm|kg|g|s|ms|m\/s|m\/s²|m\/s\^2|N|V|A|Ω|ohm|mol|mol\/l|mol\/dm³|g\/l|g\/dm³|%|°C|K|J|W|Hz|Pa)\b/i.test(answer);
    const schemeTerms = (markingSchemeText.match(/[A-Za-z]{5,}/g) || []).map((term) => term.toLowerCase()).filter((term) => !/^(award|marks?|allow|accept|reject|answer|method|correct|credit|student)$/.test(term));
    const scienceKeywords = (chemistry ? ["reactant", "product", "balanced", "concentration", "moles"] : biology ? ["organism", "process", "increase", "decrease", "because"] : ["relationship", "substitution", "resultant", "acceleration", "velocity"]);
    const termMatch = [...schemeTerms, ...scienceKeywords].some((term) => lowerAnswer.includes(term));
    const formulaCorrect = chemistry ? hasEquation && (schemeTerms.length === 0 || schemeTerms.some((term) => lowerAnswer.includes(term))) : hasEquation || relationship;
    const substitutionCorrect = !numericalQuestion || (questionMeasurements.length > 0 && answerHasOperation && answerNumbers.length >= 2);
    const answerHasFinalValue = answerNumbers.length > 0 && (!numericalQuestion || unitPresent);
    criteria.push(
      { label: "Relationship / scientific method", awarded: formulaCorrect || termMatch, detail: chemistry ? "State a scientifically correct relationship or chemical equation using appropriate formulae." : "State the scientific relationship or clearly explain the cause-and-effect link." },
      { label: "Evidence / substitution", awarded: substitutionCorrect && (numericalQuestion || termMatch || answer.length > 25), detail: numericalQuestion ? "Substitute the given values and show the calculation." : "Use relevant scientific evidence and accurate subject vocabulary." },
      { label: "Result / conclusion", awarded: answerHasFinalValue && (numericalQuestion ? unitPresent : /\btherefore\b|\bso\b|\bthis means\b|\bwhich results?\b/i.test(answer)), detail: numericalQuestion ? "Give the final value with a correct unit and suitable precision." : "State the outcome and connect it back to the question." },
    );
    traps = ["Missing or incorrect units can lose the final accuracy mark on calculations.", "A magic triangle alone does not show the physics relationship or method.", "Check chemical symbols, subscripts, and balancing; a plausible-looking formula may represent a different substance.", "Definitions need precise scientific meaning, not vague everyday wording."];
    keywords = [...scienceKeywords, ...schemeTerms.slice(0, 5)];
    workedExample = numericalQuestion
      ? "1. Write the relationship.\n2. List each quantity with its symbol and SI unit.\n3. Substitute values and show the arithmetic.\n4. Round appropriately and state the final value with its unit."
      : `1. Name the relevant ${subject.toLowerCase()} process or principle.\n2. Explain the mechanism using accurate terms.\n3. Link cause to effect and finish with a conclusion that answers the question.`;
    sampleQuestion = chemistry ? "How would you connect a chemical equation to the quantities in a reaction?" : biology ? "How would you explain a biological process using cause and effect?" : "How would you apply the relevant relationship to the given quantities?";
    sampleAnswer = chemistry ? "Write and balance the equation, identify the known quantities, show substitutions, and report a correctly rounded answer with units." : biology ? "Name the process, describe what changes and why, then connect the effect to the evidence and answer." : "State the formula, substitute the measured values, calculate, and give the result with a unit.";
  } else if (family === "maths") {
    topic = "Mathematics: method, accuracy and final form";
    explanation = `At ${level}, mathematical credit commonly rewards a valid method as well as the answer. The key is to show each equality or transformation clearly, preserve accuracy during working, and simplify the final result.`;
    const numbers = [...questionText.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    let expected: number | null = null;
    if (numbers.length >= 2) {
      if (/\b(?:difference|subtract|less than|decrease)\b/i.test(questionText)) expected = numbers[0] - numbers[1];
      else if (/\b(?:product|multiply|times|area)\b/i.test(questionText)) expected = numbers[0] * numbers[1];
      else if (/\b(?:quotient|divide|per|average)\b/i.test(questionText) && numbers[1] !== 0) expected = numbers[0] / numbers[1];
      else if (/\b(?:sum|total|add|altogether)\b/i.test(questionText)) expected = numbers[0] + numbers[1];
    }
    const hasAlgebraicWorking = /(?:=|≤|≥|\+|−|\*|×|÷|\/|\^|\b(?:therefore|so|hence)\b)/.test(answer);
    const answerNumbers = [...answer.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    const accurate = expected !== null
      ? answerNumbers.some((value) => Math.abs(value - expected!) < Math.max(0.005, Math.abs(expected!) * 0.005))
      : answerNumbers.length > 0 && /\b(?:=|therefore|so|hence)\b/.test(answer);
    const simplified = /\b(?:simplif(?:y|ied)|therefore|hence|=)\b/i.test(answer) && !/\d+\s*\/\s*\d+/.test(answer.replace(/\d+\s*\/\s*\d+\s*=\s*\d+(?:\.\d+)?/g, ""));
    criteria.push(
      { label: "Method / process", awarded: hasAlgebraicWorking, detail: "Show a valid algebraic method with clear equality signs and enough intermediate steps." },
      { label: "Accuracy", awarded: accurate, detail: "Carry out the arithmetic accurately and avoid premature rounding." },
      { label: "Final form", awarded: simplified, detail: "Give a clearly identified, simplified final answer in the requested form." },
    );
    traps = ["Premature rounding in intermediate steps can change the final answer.", "Missing equals signs make it difficult to follow whether each line is equivalent.", "An arithmetic error may lose accuracy marks even when the method is sound.", "Check that fractions, surds, expressions, and units are in the requested final form."];
    keywords = ["method", "working", "accuracy", "simplification"];
    workedExample = `1. Translate the question into a mathematical relationship.\n2. Show each algebraic operation on a new line, using = only between equivalent expressions.\n3. Keep full precision through intermediate steps.\n4. Check the result by substitution or an estimate, then state the simplified answer.`;
    sampleQuestion = "How do you show a complete mathematical method and verify its result?";
    sampleAnswer = "Write an equivalent equation at every step, keep unrounded values during working, verify the result, and clearly mark the simplified answer.";
  } else if (family === "computing") {
    topic = "Computing Science: computational thinking and implementation";
    explanation = `At ${level}, a strong ${subject} response makes the logic explicit: identify inputs and outputs, trace or explain the algorithm, and use precise technical vocabulary to justify the result.`;
    const terms = ["variable", "condition", "iteration", "loop", "array", "list", "function", "parameter", "validation", "test", "algorithm", "selection", "sequence"];
    const schemeTerms = (markingSchemeText.match(/[A-Za-z]{5,}/g) || []).map((term) => term.toLowerCase()).filter((term) => !/^(award|marks?|allow|accept|reject|answer|method|correct|credit|student)$/.test(term));
    const hasTerms = [...terms, ...schemeTerms].some((term) => lowerAnswer.includes(term));
    const showsSteps = /\b(?:if|else|then|repeat|while|for|return|input|output|set|store|because|therefore)\b|(?:=|->|←)/i.test(answer);
    const hasTest = /\b(?:test|testing|expected|actual|boundary|valid|invalid|trace|output)\b/i.test(answer);
    criteria.push(
      { label: "Technical knowledge", awarded: hasTerms, detail: "Use accurate computational terminology and identify relevant data structures or constructs." },
      { label: "Algorithm / process", awarded: showsSteps, detail: "Describe or trace the sequence, selection, iteration, or data-processing steps in order." },
      { label: "Testing / evaluation", awarded: hasTest, detail: "Show a suitable test or trace and explain the expected result or validation." },
    );
    traps = ["Naming a construct without explaining how it works may not earn explanation marks.", "A trace with skipped state changes can produce the wrong output.", "Do not confuse validation of input with verification that a program works correctly."];
    keywords = terms.slice(0, 6);
    workedExample = "1. Identify the input, processing, and expected output.\n2. Trace each statement in order, updating variables and data structures.\n3. Explain any selection or loop condition and how it changes the path.\n4. Test a normal case and a boundary or invalid case; compare actual with expected output.";
    sampleQuestion = "How would you explain and test a short algorithm?";
    sampleAnswer = "State the input and output, trace each statement and variable update, explain branch conditions, then compare actual output with expected output for normal and boundary tests.";
  } else if (family === "humanities") {
    topic = `${subject}: knowledge, analysis and conclusion`;
    explanation = `At ${level}, build a response from precise Knowledge and Understanding (K&U), then analyse why the evidence matters. For source questions, interpret the source in your own words and evaluate its value or limitation before reaching a supported conclusion.`;
    const specificEvidence = /\b(?:19\d{2}|20\d{2}|18\d{2})\b|\b(?:because|for example|such as|according to|the source|the author|the government|the policy|the event)\b/i.test(answer) || (answer.match(/\b[A-Z][a-z]{3,}\b/g) || []).length > 0;
    const ownWordsAnalysis = /\b(?:this shows|this means|because|therefore|which suggests|as a result|however|this is significant|this is valuable|this is limited)\b/i.test(answer);
    const synthesis = /\b(?:overall|in conclusion|on balance|therefore|ultimately|to conclude)\b/i.test(answer);
    criteria.push(
      { label: "Knowledge & Understanding (K&U)", awarded: specificEvidence, detail: "Use accurate, specific facts, concepts, examples, or source details relevant to the question." },
      { label: "Analysis / source evaluation (A)", awarded: ownWordsAnalysis, detail: "Explain how the evidence supports the point; evaluate source origin, purpose, context, value, or limitation where relevant." },
      { label: "Conclusion / synthesis", awarded: synthesis, detail: "Reach a supported judgement that weighs the main evidence and answers the question directly." },
    );
    traps = ["Dropping specific dates, names, policies, or place details weakens Knowledge and Understanding.", "Copying a source without explaining it in your own words does not demonstrate analysis.", "A conclusion should follow from the evidence and answer the exact question, not introduce a new unsupported claim."];
    keywords = ["K&U", "specific evidence", "analysis", "source evaluation", "synthesis"];
    workedExample = "Point: [make one clear claim that answers the question].\nEvidence: [give a precise fact, example, or source detail].\nAnalysis: Explain in your own words why this evidence supports the point and how it affects the issue.\nLink: Tie the explanation back to the question.\nConclusion: Weigh the strongest evidence and give a justified overall judgement.";
    sampleQuestion = `How would you build and support a ${subject} judgement using evidence?`;
    sampleAnswer = "Make a precise point, provide a specific fact or source detail, explain in your own words why it matters, and finish with a judgement supported by the evidence.";
  } else {
    topic = `${subject}: evidence, technique and effect`;
    explanation = `At ${level}, a strong ${subject} response identifies precise evidence or language, names the relevant technique when appropriate, and explains the effect in context. For a language task, accuracy, suitable vocabulary, and grammatical control matter alongside meaning.`;
    const quote = /[“"']([^”"']{2,})[”"']/.test(answer);
    const technique = /\b(?:metaphor|simile|personification|imagery|alliteration|word choice|repetition|tone|contrast| sentence structure|sentence|rhetorical|connotation|register|tense|adjective|verb|noun)\b/i.test(answer);
    const explainsEffect = /\b(?:suggests|implies|conveys|emphasises|creates|highlights|makes the reader|positions the reader|because|this shows|effect)\b/i.test(answer);
    const languageAccuracy = answer.length > 20 && /[.!?]/.test(answer) && !/\b(?:makes the reader want to read on|it is good|it is nice)\b/i.test(answer);
    criteria.push(
      { label: "Evidence / quotation", awarded: quote || answer.length > 35, detail: "Select a short, precise quotation or relevant detail and identify the feature being discussed." },
      { label: "Technique / vocabulary", awarded: technique || /\b(?:word|phrase|technique|vocabulary|tense|verb|adjective)\b/i.test(answer), detail: "Name a specific technique or use accurate, varied vocabulary and grammar for the task." },
      { label: "Analysis / accuracy", awarded: explainsEffect && languageAccuracy, detail: "Explain the effect of the evidence in context, or communicate the intended meaning accurately." },
    );
    traps = ["A quotation without an explanation of its effect is incomplete analysis.", "Avoid generic comments such as 'makes the reader want to read on'; explain a precise effect in context.", "Check vocabulary, spelling, tense, and sentence structure for accuracy."];
    keywords = ["evidence", "technique", "quotation", "effect", "context"];
    workedExample = "Evidence: Quote a short, relevant word or phrase.\nTechnique: Identify the method or language feature accurately.\nAnalysis: Explore connotations and explain the effect in this context.\nLink: Connect the effect to the writer's purpose and the question.\nFor language writing: check tense, agreement, vocabulary choice, and sentence accuracy.";
    sampleQuestion = `How can you analyse a language feature or improve accuracy in ${subject}?`;
    sampleAnswer = "Select a short quotation, name the technique, analyse its connotations and precise effect in context, then link it to the question or writer's purpose.";
  }

  const schemeMarks = [...markingSchemeText.matchAll(/\[(\d+)\]|\b(\d+)\s*marks?\b/gi)].map((match) => Number(match[1] || match[2]));
  const maxMarks = Math.max(criteria.length, ...schemeMarks);
  const estimatedMark = answer ? Math.min(maxMarks, criteria.filter((criterion) => criterion.awarded).length) : 0;
  const fallbackUsed = !questionText.trim() && !markingSchemeText.trim();
  const questionPlainEnglish = `${topic}. ${explanation}${questionText.trim() ? ` The supplied question asks: ${questionText.trim()}` : ` No question text was supplied; use the sample task below as a local practice prompt.`}${fallbackUsed && hasImages ? ` ${imageTextFound ? "Some image text was extracted, but there was not enough readable prompt text to identify the exact task." : "No browser OCR text was available, so this is a clearly labelled sample response rather than an assessment of the image."}` : ""}`;
  const markAllocationBreakdown = criteria.map((criterion, index) => `Mark ${index + 1}: ${criterion.awarded ? "Awarded" : "Not awarded"} — ${criterion.detail}`);
  const feedbackAndFixes = !answer
    ? ["No typed or OCR-extracted student answer was available to assess. Add a response to receive hypothetical feedback."]
    : criteria.filter((criterion) => !criterion.awarded).map((criterion) => `To improve ${criterion.label.toLowerCase()}: ${criterion.detail}`);
  if (answer && criteria.every((criterion) => criterion.awarded)) feedbackAndFixes.push("All core criteria in this local hypothetical rubric are present. Check the official question-specific marking instructions for final credit.");
  feedbackAndFixes.push("This is an automated practice estimate using general SQA-style principles, not an official SQA mark or a substitute for the question-specific marking instructions.");
  const stepByStep = workedExample.split("\n");
  return {
    estimatedMark,
    maxMarks,
    feedbackAndFixes,
    overview: questionPlainEnglish,
    questionPlainEnglish,
    fullCalculationAndWorking: workedExample,
    markAllocationBreakdown,
    questionSpecificFeedback: feedbackAndFixes.join(" "),
    marksAwarded: { awarded: estimatedMark, available: maxMarks, explanation: feedbackAndFixes.join(" ") },
    guidance: feedbackAndFixes,
    stepByStep,
    qsKeywords: keywords,
    zeroMarkTraps: traps,
    practiceChallenge: { question: sampleQuestion, answer: sampleAnswer },
    questionOverview: questionPlainEnglish,
    calculationAndSolutionBreakdown: stepByStep,
    markingSchemeAlignment: markAllocationBreakdown,
    markerRoute: [],
  };
}

function localExaminer(
  level: Level,
  subject: string,
  questionText: string,
  studentAnswerText: string,
  markingSchemeText: string,
  hasImages: boolean,
  imageTextFound: boolean,
): ExaminerResult {
  if (subject.toLowerCase() !== "physics") {
    return evaluateTextSubject(level, subject, questionText, studentAnswerText, markingSchemeText, hasImages, imageTextFound);
  }
  const source = `${questionText}\n${markingSchemeText}`;
  const questionMeasurements = extractMeasurements(questionText);
  const schemeMeasurements = extractMeasurements(markingSchemeText);
  const rule = getPhysicsRule(questionText || markingSchemeText);
  const usedValues = new Map<PhysicsCategory, number>();
  const values = rule.variables.map((variable, index) => {
    const usedCount = usedValues.get(variable.category) || 0;
    const questionMatches = questionMeasurements.filter((item) => item.category === variable.category);
    const schemeMatches = schemeMeasurements.filter((item) => item.category === variable.category);
    const matches = questionMatches.length ? questionMatches : schemeMatches;
    if (matches[usedCount]) {
      usedValues.set(variable.category, usedCount + 1);
      return matches[usedCount].value;
    }
    const labelPattern: Partial<Record<PhysicsCategory, RegExp>> = {
      mass: /mass\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
      acceleration: /acceleration\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
      speed: /(?:initial velocity|final velocity|speed|velocity)\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
      distance: /(?:distance|displacement)\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
      time: /time\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
      current: /current\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
      voltage: /(?:voltage|potential difference)\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
      resistance: /resistance\s*(?:of|is|=|:)?\s*(-?\d+(?:\.\d+)?)/i,
    };
    const labelMatch = source.match(labelPattern[variable.category] || /$^/);
    if (labelMatch) return Number(labelMatch[1]);
    return undefined;
  });
  const hasAllValues = values.every((value): value is number => typeof value === "number" && Number.isFinite(value));
  const expectedValue = hasAllValues ? rule.calculate(values) : null;
  const answer = studentAnswerText.trim();
  const answerNumbers = [...answer.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  const containsValue = (value: number) => answerNumbers.some((candidate) => Math.abs(candidate - value) <= Math.max(0.005, Math.abs(value) * 0.005));
  const formulaPresent = rule.formulaPattern.test(answer);
  const hasOperation = /[×*÷/]|\b(?:times|multiplied|divided|over)\b/i.test(answer);
  const substitutionPresent = hasAllValues && rule.variables.every((_, index) => containsValue(values[index])) && hasOperation;
  const correctValue = expectedValue !== null && answerNumbers.some((candidate) => Math.abs(candidate - expectedValue) <= Math.max(0.01, Math.abs(expectedValue) * 0.01));
  const correctAnswerWithUnits = correctValue && rule.unitPattern.test(answer);
  const declaredMarkCounts = [...`${questionText}\n${markingSchemeText}`.matchAll(/\b(\d+)\s*marks?\b|\[(\d+)\s*\]/gi)]
    .map((match) => Number(match[1] || match[2]));
  const maxMarks = Math.max(1, declaredMarkCounts.length ? Math.max(...declaredMarkCounts) : 3);
  const hasStudentAnswer = Boolean(answer);
  const estimatedMark = hasStudentAnswer
    ? Math.min(maxMarks, Number(formulaPresent) + Number(substitutionPresent) + Number(correctAnswerWithUnits))
    : 0;
  const fallbackUsed = !hasAllValues;
  const specificQuestion = questionText.trim() ? ` The question asks: ${questionText.trim()}` : " The exact question text was not available.";
  const questionPlainEnglish = `${rule.topic}: ${rule.concept}${specificQuestion} ${hasAllValues ? `Use the extracted values and report the result in ${rule.unit}.` : `A calculation cannot be completed yet because the question text does not provide all values needed for ${rule.formula}. No placeholder numbers have been substituted.`}${hasImages && !imageTextFound ? " No readable text was extracted from the uploaded images." : ""}`;
  const substitutions = rule.variables.map((variable, index) => `${variable.symbol} = ${typeof values[index] === "number" ? values[index] : "not detected"} ${variable.unit}`).join(", ");
  const substitutedFormula = hasAllValues
    ? rule.variables.reduce((formula, variable, index) => formula.replace(new RegExp(`\\b${variable.symbol}\\b`, "g"), String(values[index])), rule.formula)
    : "Not enough extracted values to substitute.";
  const fullCalculationAndWorking = [
    `Initial relationship: ${rule.formula}.`,
    `Variables in SI units: ${hasAllValues ? substitutions : `${substitutions}. Missing required values; verify the OCR text or enter the values manually`}.`,
    `Rearrangement: ${rule.rearrangement}`,
    `Substitute: ${hasAllValues ? `${rule.formula} -> ${substitutedFormula}` : "No numerical substitution is shown until all required values are available."}`,
    expectedValue !== null ? `Calculate: ${substitutedFormula} = ${Number(expectedValue.toPrecision(5))} ${rule.unit}.` : "Calculate: Cannot calculate without all required input values.",
    expectedValue !== null ? `Final answer: ${Number(expectedValue.toPrecision(5))} ${rule.unit}.` : "Final answer: Not available until the missing values are provided.",
  ].join("\n");
  const markAllocationBreakdown = [
    `Mark 1: ${formulaPresent ? "Awarded" : "Not awarded"} — correct formula/relationship stated (${rule.formula}).`,
    `Mark 2: ${substitutionPresent ? "Awarded" : "Not awarded"} — given values substituted into the relationship.`,
    `Mark 3: ${correctAnswerWithUnits ? "Awarded" : "Not awarded"} — correct final value with SI unit (${rule.unit}).`,
  ];
  const feedbackAndFixes = !hasStudentAnswer
    ? ["No student answer text was available to grade. Add a typed answer or upload a readable answer image for OCR."]
    : estimatedMark === maxMarks
      ? ["Full credit on the three-step GMP-style calculation check: relationship, substitution, and final value with unit are all present."]
      : [
        !formulaPresent ? "State the physics relationship before substituting values; a magic triangle alone may not earn the formula mark." : "Your formula or relationship is present.",
        !substitutionPresent ? "Show each given value inserted into the formula and include the arithmetic operation." : "Your numerical substitution is shown.",
        expectedValue === null ? "The OCR/typed question is missing one or more required values, so the numerical result cannot be checked yet." : !correctValue ? "Recheck the arithmetic and significant figures against the OCR-extracted values." : !correctAnswerWithUnits ? `The numerical value is correct, but include the unit ${rule.unit} to secure the final mark.` : "Your final value and unit are correct.",
      ];
  feedbackAndFixes.push("This is a hypothetical practice estimate using a simplified SQA-style rubric, not an official SQA mark.");
  const zeroMarkTraps = [
    ...(formulaPresent ? [] : ["A magic triangle alone may not count as a stated physics relationship."]),
    ...(substitutionPresent ? [] : ["A final number without visible substitution may lose the method mark."]),
    ...(correctAnswerWithUnits ? [] : ["Missing or incorrect SI units can lose the final accuracy mark."]),
    "Use significant figures consistent with the precision of the values in the question.",
    ...(fallbackUsed ? ["No sample numbers were substituted; missing values must be read from the source or entered manually before a calculation can be assessed."] : []),
  ];
  const stepByStep = fullCalculationAndWorking.split("\n");

  return {
    estimatedMark,
    maxMarks,
    feedbackAndFixes,
    overview: questionPlainEnglish,
    questionPlainEnglish,
    fullCalculationAndWorking,
    markAllocationBreakdown,
    questionSpecificFeedback: feedbackAndFixes.join(" "),
    marksAwarded: { awarded: estimatedMark, available: maxMarks, explanation: feedbackAndFixes.join(" ") },
    guidance: feedbackAndFixes,
    stepByStep,
    qsKeywords: [rule.formula, ...rule.variables.map((variable) => variable.name)],
    zeroMarkTraps,
    practiceChallenge: expectedValue !== null
      ? { question: `Using the extracted values ${values.join(", ")}, what result do you get from ${rule.formula}?`, answer: `${Number(expectedValue.toPrecision(5))} ${rule.unit}` }
      : { question: `What values are needed to use ${rule.formula}?`, answer: rule.variables.map((variable) => `${variable.name} (${variable.unit})`).join(", ") },
    questionOverview: questionPlainEnglish,
    calculationAndSolutionBreakdown: stepByStep,
    markingSchemeAlignment: markAllocationBreakdown,
    markerRoute: [],
  };
}

async function extractImageText(_file: File): Promise<string> {
  return "";
}

interface ExaminerCriterion {
  id: string;
  label: string;
  guidance: string;
}

function getExaminerCriteria(subject: string): ExaminerCriterion[] {
  const normalized = subject.toLowerCase();
  if (/physics|chemistry|biology|mathematics|maths|computing/.test(normalized)) {
    return [
      { id: "formula", label: "Formula stated", guidance: "Write the relevant relationship before substituting values. A mnemonic triangle alone may not show the method." },
      { id: "substitution", label: "Correct values substituted", guidance: "Show the given values in the relationship, with clear operations and consistent units." },
      { id: "answer", label: "Final answer + correct units", guidance: "Check the arithmetic, rounding or significant figures, and include the required unit or simplified form." },
    ];
  }
  if (/english|french|german|spanish|latin/.test(normalized)) {
    return [
      { id: "quote", label: "Direct quote", guidance: "Choose a short, exact quotation that supports the point you are making." },
      { id: "technique", label: "Literary technique identified", guidance: "Name the specific technique or language feature rather than describing it vaguely." },
      { id: "effect", label: "Effect on reader explained", guidance: "Explain the precise connotations or effect in context, and link it to the question." },
    ];
  }
  return [
    { id: "knowledge", label: "Knowledge point (K&U)", guidance: "Use a precise fact, concept, date, example, or detail relevant to the question." },
    { id: "analysis", label: "Source / evidence analysis", guidance: "Explain in your own words how the evidence supports the point; evaluate a source where asked." },
    { id: "conclusion", label: "Valid conclusion", guidance: "Reach a supported judgement that answers the question and follows from the evidence." },
  ];
}

function ExaminerCropAssessment({
  photos,
  subject,
  level,
  activePhotoId,
  onActivePhotoChange,
  onCropChange,
  checkedCriteria,
  onCriterionChange,
  estimatedMark,
  onEstimatedMarkChange,
}: {
  photos: ExaminerPhoto[];
  subject: string;
  level: Level;
  activePhotoId: string;
  onActivePhotoChange: (id: string) => void;
  onCropChange: (photoId: string, crop: Crop | undefined, preview: string) => void;
  checkedCriteria: Record<string, boolean>;
  onCriterionChange: (id: string, checked: boolean) => void;
  estimatedMark: number;
  onEstimatedMarkChange: (mark: number) => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const photo = photos.find((item) => item.preview === activePhotoId) || photos[0];
  const criteria = getExaminerCriteria(subject);
  if (!photo) return null;

  function updateCropPreview(pixelCrop: PixelCrop, percentCrop: Crop) {
    const image = imageRef.current;
    if (!image || pixelCrop.width < 1 || pixelCrop.height < 1) return;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(pixelCrop.width * scaleX));
    canvas.height = Math.max(1, Math.round(pixelCrop.height * scaleY));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    onCropChange(photo.preview, percentCrop, canvas.toDataURL("image/jpeg", 0.96));
  }

  const guidance = subject.toLowerCase().match(/physics|chemistry|biology|mathematics|maths|computing/)
    ? `For ${subject} at ${level}, define each symbol, show the relationship, substitute values with units, then verify the result and significant figures.`
    : subject.toLowerCase().match(/english|french|german|spanish|latin/)
      ? `For ${subject} at ${level}, anchor each point in exact textual evidence, identify the feature, and explain its effect in context.`
      : `For ${subject} at ${level}, build a point with specific knowledge, explain what the evidence demonstrates, and finish with a supported judgement.`;
  const traps = subject.toLowerCase().match(/physics|chemistry|biology|mathematics|maths|computing/)
    ? ["A memorised triangle without a stated relationship may not earn method credit.", "Check units, significant figures, signs, and formula/equation accuracy.", "Do not skip substitution or intermediate working."]
    : subject.toLowerCase().match(/english|french|german|spanish|latin/)
      ? ["A quotation without analysis does not explain its effect.", "Avoid generic claims such as 'it makes the reader want to read on'.", "Use the exact word or phrase and link your interpretation to context."]
      : ["A broad claim without precise facts weakens Knowledge and Understanding.", "Do not copy source wording without explaining its meaning in your own words.", "A conclusion must answer the question and follow from the evidence."];

  return <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-4">
    <section className="rounded-xl border border-white/10 bg-zinc-950/95 p-4 text-zinc-100 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-bold">Crop the assessed area</h2><p className="mt-1 text-xs text-zinc-400">Drag over one question, answer, or mark-scheme section.</p></div>
        <select aria-label="Image to crop" value={photo.preview} onChange={(event) => onActivePhotoChange(event.target.value)} className="max-w-full rounded-md border border-white/15 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100">
          {photos.map((item, index) => <option key={item.preview} value={item.preview}>{`${item.type === "markingScheme" ? "Mark scheme" : item.type === "answer" ? "Student answer" : "Question"} ${index + 1}`}</option>)}
        </select>
      </div>
      <div className="flex min-h-64 max-h-[65vh] items-center justify-center overflow-auto rounded-lg bg-black/70 p-2">
        <ReactCrop crop={photo.crop} onChange={(_, percentCrop) => onCropChange(photo.preview, percentCrop, photo.cropPreview || "")} onComplete={updateCropPreview} keepSelection>
          <img ref={imageRef} src={photo.preview} alt={`Crop ${photo.type} image`} className="block max-h-[62vh] max-w-full object-contain" />
        </ReactCrop>
      </div>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={() => onCropChange(photo.preview, undefined, "")} className="rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10">Reset crop</button>
      </div>
    </section>
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-zinc-950/95 p-4 text-zinc-100 shadow-xl shadow-black/20 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-bold">Cropped zoom</h2>
        <div className="grid min-h-44 place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/80 p-3">
          <img src={photo.cropPreview || photo.preview} alt={photo.cropPreview ? "Selected crop, enlarged" : "Full image preview; select a crop to zoom"} className="max-h-64 w-full object-contain" />
        </div>
      </section>
      <section className="rounded-xl border border-white/10 bg-zinc-950/95 p-4 text-zinc-100 shadow-xl shadow-black/20 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-bold">SQA self-assessment · {subject} · {level}</h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Assessment criteria</legend>
          {criteria.map((criterion) => <label key={criterion.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"><input type="checkbox" checked={Boolean(checkedCriteria[criterion.id])} onChange={(event) => onCriterionChange(criterion.id, event.target.checked)} className="size-4 accent-emerald-400" /><span>{criterion.label}</span></label>)}
        </fieldset>
        <details className="mt-3 rounded-md border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold">SQA Examiner Guidance</summary>
          <div className="mt-3 space-y-3 text-xs leading-5 text-zinc-300">
            <p><span className="font-semibold text-white">Worked approach:</span> {guidance}</p>
            <div><p className="mb-1 font-semibold text-white">Zero mark traps</p><ul className="list-disc space-y-1 pl-5">{traps.map((trap) => <li key={trap}>{trap}</li>)}</ul></div>
          </div>
        </details>
        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="estimated-mark" className="shrink-0 text-xs font-semibold">Estimated mark</label>
          <input id="estimated-mark" type="range" min={0} max={criteria.length} step={1} value={Math.min(estimatedMark, criteria.length)} onChange={(event) => onEstimatedMarkChange(Number(event.target.value))} className="min-w-0 flex-1 accent-emerald-400" />
          <output htmlFor="estimated-mark" className="min-w-10 text-right text-sm font-bold tabular-nums">{Math.min(estimatedMark, criteria.length)}/{criteria.length}</output>
        </div>
      </section>
    </div>
  </div>;
}

function MarkingSchemeExaminer({ selectedSubjects }: { selectedSubjects: SelectedSubject[] }) {
  const [level, setLevel] = useState<Level>("Higher");
  const [subject, setSubject] = useState(selectedSubjects[0]?.subject || SUBJECTS_LIST[0]);
  const [photos, setPhotos] = useState<ExaminerPhoto[]>([]);
  const [activePhotoId, setActivePhotoId] = useState("");
  const [documentType, setDocumentType] = useState<ExaminerDocumentType>("question");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [markSchemeText, setMarkSchemeText] = useState("");
  const [result, setResult] = useState<ExaminerResult | null>(null);
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [estimatedMark, setEstimatedMark] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const subjects = Array.from(new Set([...SUBJECTS_LIST, ...selectedSubjects.map((item) => item.subject)]));
  const criteria = getExaminerCriteria(subject);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);
  useEffect(() => {
    setCheckedCriteria({});
    setEstimatedMark(0);
    setResult(null);
  }, [subject, level]);

  function addFiles(files: FileList | File[], type = documentType) {
    const next = Array.from(files);
    const invalid = next.find((file) => file.size > 5 * 1024 * 1024);
    if (invalid) return;
    const remainingSlots = Math.max(0, 5 - photos.length);
    const images = next.filter((file) => file.type.startsWith("image/")).slice(0, remainingSlots);
    const addedPhotos = images.map((file) => ({ file, preview: URL.createObjectURL(file), type, ocrText: "", ocrStatus: "reading" as const }));
    setPhotos((current) => [...current, ...addedPhotos].slice(0, 5));
    setActivePhotoId((current) => current || addedPhotos[0]?.preview || "");
    for (const photo of addedPhotos) {
      void extractImageText(photo.file).then((ocrText) => {
        setPhotos((current) => current.map((item) => item.preview === photo.preview
          ? { ...item, ocrText, ocrStatus: ocrText ? "complete" : "failed" }
          : item));
      });
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => { if (videoRef.current) videoRef.current.srcObject = stream; });
    } catch { setCameraOpen(false); }
  }

  function capturePhoto() {
    if (!videoRef.current || photos.length >= 5) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => { if (blob) addFiles([new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })]); }, "image/jpeg", 0.9);
  }

  function removePhoto(index: number) {
    const removed = photos[index];
    const remaining = photos.filter((_, i) => i !== index);
    setPhotos(remaining);
    if (removed?.preview === activePhotoId) setActivePhotoId(remaining[0]?.preview || "");
    if (removed) URL.revokeObjectURL(removed.preview);
  }
  function movePhoto(index: number, direction: -1 | 1) {
    setPhotos((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }

  function updateEstimatedMark(mark: number) {
    const nextMark = Math.max(0, Math.min(criteria.length, mark));
    setEstimatedMark(nextMark);
    setResult((current) => current ? {
      ...current,
      estimatedMark: nextMark,
      marksAwarded: { awarded: nextMark, available: criteria.length, explanation: "Self-assessed against the selected subject checklist." },
    } : current);
  }

  function updateCriterion(id: string, checked: boolean) {
    const nextChecks = { ...checkedCriteria, [id]: checked };
    const nextMark = criteria.filter((criterion) => nextChecks[criterion.id]).length;
    setCheckedCriteria(nextChecks);
    setEstimatedMark(nextMark);
    setResult((current) => current ? {
      ...current,
      estimatedMark: nextMark,
      markAllocationBreakdown: criteria.map((criterion, index) => `Mark ${index + 1}: ${nextChecks[criterion.id] ? "Self-awarded" : "Not selected"} — ${criterion.label}.`),
      marksAwarded: { awarded: nextMark, available: criteria.length, explanation: "Self-assessed against the selected subject checklist." },
    } : current);
  }

  function updatePhotoCrop(photoId: string, crop: Crop | undefined, preview: string) {
    setPhotos((current) => current.map((photo) => photo.preview === photoId ? { ...photo, crop, cropPreview: preview } : photo));
  }

  async function examine(e: React.FormEvent) {
    e.preventDefault();
    const extractedTexts = await Promise.all(photos.map(async ({ file, type, ocrText }) => ({ type, text: ocrText || await extractImageText(file) })));
    const textFor = (type: ExaminerDocumentType) => extractedTexts.filter((item) => item.type === type).map((item) => item.text).filter(Boolean).join("\n");
    const question = [questionText, textFor("question")].filter(Boolean).join("\n");
    const answer = [answerText, textFor("answer")].filter(Boolean).join("\n");
    const markingScheme = [markSchemeText, textFor("markingScheme")].filter(Boolean).join("\n");
    const localResult = localExaminer(level, subject, question, answer, markingScheme, photos.length > 0, extractedTexts.some((item) => item.text.trim()));
    const markAllocationBreakdown = criteria.map((criterion, index) => `Mark ${index + 1}: ${checkedCriteria[criterion.id] ? "Self-awarded" : "Not selected"} — ${criterion.label}.`);
    const feedbackAndFixes = [
      ...localResult.feedbackAndFixes,
      `Your self-assessed mark is ${estimatedMark}/${criteria.length} for ${subject} at ${level}. Review the criteria and adjust the mark slider as needed.`,
    ];
    setResult({
      ...localResult,
      estimatedMark,
      maxMarks: criteria.length,
      markAllocationBreakdown,
      feedbackAndFixes,
      guidance: feedbackAndFixes,
      marksAwarded: { awarded: estimatedMark, available: criteria.length, explanation: "Self-assessed against the selected subject checklist." },
    });
  }

  const section = (title: string, icon: React.ReactNode, content: React.ReactNode) => <section className="bg-card border border-border rounded-xl p-5"><div className="flex items-center gap-2 mb-3"><span className="text-primary">{icon}</span><h2 className="text-sm font-bold">{title}</h2></div>{content}</section>;
  return <div className="p-6 space-y-5 max-w-6xl mx-auto">
    <div><h1 className="text-xl font-bold">Marking Scheme Examiner</h1><p className="text-muted-foreground text-sm mt-1">Crop your working, compare it with subject-specific criteria, and set a practice mark.</p></div>
    <form onSubmit={examine} className="space-y-4">
      {photos.length > 0 && <ExaminerCropAssessment photos={photos} subject={subject} level={level} activePhotoId={activePhotoId} onActivePhotoChange={setActivePhotoId} onCropChange={updatePhotoCrop} checkedCriteria={checkedCriteria} onCriterionChange={updateCriterion} estimatedMark={estimatedMark} onEstimatedMarkChange={updateEstimatedMark} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs font-semibold">Level<select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm">{LEVELS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold">Subject<select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold text-sm">Upload documents</h2><span className="text-xs font-semibold text-muted-foreground">Photos added: {photos.length}/5</span></div><p className="text-xs text-muted-foreground">Add the question and marking scheme. Your own answer is optional: include it to receive an estimated mark and answer review.</p><div className="flex flex-wrap gap-2"><select aria-label="Document type" value={documentType} onChange={(e) => setDocumentType(e.target.value as ExaminerDocumentType)} className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm"><option value="question">Question</option><option value="answer">Your answer (optional)</option><option value="markingScheme">Marking scheme</option></select><button type="button" disabled={photos.length >= 5} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-semibold disabled:opacity-40"><Upload className="w-4 h-4" /> Upload</button><button type="button" disabled={photos.length >= 5} onClick={startCamera} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-semibold disabled:opacity-40"><Camera className="w-4 h-4" /> Camera</button><input ref={fileInputRef} hidden type="file" accept="image/*" multiple onChange={(e) => e.target.files && addFiles(e.target.files)} /></div>{cameraOpen && <div className="flex flex-wrap gap-2 items-start"><video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-lg bg-black" /><div className="flex gap-2"><button type="button" onClick={capturePhoto} disabled={photos.length >= 5} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Capture</button><button type="button" onClick={() => { streamRef.current?.getTracks().forEach((track) => track.stop()); setCameraOpen(false); }} className="px-3 py-2 rounded-lg border border-border text-xs font-semibold">Close</button></div></div>}{photos.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{photos.map((photo, index) => <div key={photo.preview} className="relative rounded-lg border border-border overflow-hidden"><img src={photo.preview} alt={`${photo.type} page ${index + 1}`} className="aspect-square object-cover w-full" /><span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">{photo.type === "markingScheme" ? "Mark scheme" : photo.type === "answer" ? "Your answer" : "Question"}</span><div className="absolute inset-x-1 bottom-1 flex justify-between"><button type="button" title="Move photo up" disabled={index === 0} onClick={() => movePhoto(index, -1)} className="p-1 rounded bg-black/60 text-white disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button><button type="button" title="Move photo down" disabled={index === photos.length - 1} onClick={() => movePhoto(index, 1)} className="p-1 rounded bg-black/60 text-white disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button><button type="button" title="Delete photo" onClick={() => removePhoto(index)} className="p-1 rounded bg-black/60 text-white"><Trash2 className="w-3 h-3" /></button></div></div>)}</div>}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3"><textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} placeholder="Paste the question here..." className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm resize-y" /><textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={4} placeholder="Paste your answer here (optional)..." className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm resize-y" /><textarea value={markSchemeText} onChange={(e) => setMarkSchemeText(e.target.value)} rows={4} placeholder="Paste the marking scheme here..." className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm resize-y" /></div>
      <button type="submit" disabled={photos.length === 0 && !questionText.trim() && !markSchemeText.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"><ScanSearch className="w-4 h-4" /> Examine Mark Scheme</button>
    </form>
    {result && <div ref={resultRef} className="space-y-4 scroll-mt-4"><div className="bg-card border border-border rounded-xl p-5"><h2 className="font-bold text-sm mb-2">AI overview</h2><p className="text-sm leading-6">{result.overview}</p>{result.answerOverview && <p className="text-sm leading-6 mt-3 text-muted-foreground"><span className="font-semibold text-foreground">Your answer:</span> {result.answerOverview}</p>}{result.marksAwarded && <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-2xl font-black text-primary">{result.marksAwarded.awarded}/{result.marksAwarded.available}</span><span className="text-sm text-muted-foreground">estimated marks</span><span className="text-sm">{result.marksAwarded.explanation}</span></div>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{section(result.marksAwarded ? "How To Improve This Answer" : "Tips For Securing Marks", <CheckSquare className="w-4 h-4" />, <ul className="list-disc list-inside space-y-2 text-sm">{(result.guidance || result.stepByStep).map((item) => <li key={item}>{item}</li>)}</ul>)}{section("Step-by-Step Examiner Solution", <CheckSquare className="w-4 h-4" />, <ol className="list-decimal list-inside space-y-2 text-sm">{result.stepByStep.map((item) => <li key={item}>{item}</li>)}</ol>)}{section("Must-Have QS Keywords", <Award className="w-4 h-4" />, <div className="flex flex-wrap gap-2">{result.qsKeywords.map((item) => <span key={item} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">{item}</span>)}</div>)}{section("Zero-Mark Traps", <AlertCircle className="w-4 h-4" />, <ul className="list-disc list-inside space-y-2 text-sm">{result.zeroMarkTraps.map((item) => <li key={item}>{item}</li>)}</ul>)}{section("Instant 1-Mark Practice Challenge", <GraduationCap className="w-4 h-4" />, <div className="space-y-2 text-sm"><p className="font-semibold">{result.practiceChallenge.question}</p><p className="text-muted-foreground">{result.practiceChallenge.answer}</p></div>)}</div></div>}
    {result && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{section("Mark Allocation Breakdown", <CheckSquare className="w-4 h-4" />, <ol className="list-decimal list-inside space-y-2 text-sm">{result.markAllocationBreakdown.map((item) => <li key={item}>{item}</li>)}</ol>)}{section("Feedback and Fixes", <AlertCircle className="w-4 h-4" />, <ul className="list-disc list-inside space-y-2 text-sm">{result.feedbackAndFixes.map((item) => <li key={item}>{item}</li>)}</ul>)}</div>}
  </div>;
}

async function encodeExamMarkerImage(file: File): Promise<string> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not prepare an image.")), "image/jpeg", 0.78);
  });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read an image."));
    reader.onerror = () => reject(new Error("Could not read an image."));
    reader.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

function ExamMarker({ selectedSubjects }: { selectedSubjects: SelectedSubject[] }) {
  const [subject, setSubject] = useState(selectedSubjects[0]?.subject || SUBJECTS_LIST[0]);
  const [level, setLevel] = useState<Level>(selectedSubjects[0]?.level || "Higher");
  const [documentType, setDocumentType] = useState<ExaminerDocumentType>("question");
  const [images, setImages] = useState<ExamMarkerImage[]>([]);
  const imagesRef = useRef(images);
  const [questionText, setQuestionText] = useState("");
  const [markingSchemeText, setMarkingSchemeText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [result, setResult] = useState<ExamMarkerResult | null>(null);
  const [error, setError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  imagesRef.current = images;
  const subjects = Array.from(new Set([...SUBJECTS_LIST, ...selectedSubjects.map((item) => item.subject)]));
  const hasQuestion = Boolean(questionText.trim() || images.some((image) => image.type === "question"));
  const hasScheme = Boolean(markingSchemeText.trim() || images.some((image) => image.type === "markingScheme"));

  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview)), []);
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [result, error]);

  function addImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    const valid = selected.filter((file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024);
    const available = Math.max(0, 5 - images.length);
    const additions = valid.slice(0, available).map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      type: documentType,
    }));
    setImages((current) => [...current, ...additions]);
    setResult(null);
    setError(selected.some((file) => file.size > 10 * 1024 * 1024)
      ? "Each image must be 10 MB or smaller."
      : selected.length > additions.length
        ? "You can add up to five images. Unsupported files were skipped."
        : "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(id: string) {
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter((image) => image.id !== id);
    });
    setResult(null);
  }

  async function reviewAnswer(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!hasQuestion || !hasScheme) {
      setError("Add both the question and its marking scheme as images or pasted text before reviewing.");
      return;
    }

    setIsReviewing(true);
    try {
      const documents = await Promise.all(images.map(async (image) => ({
        type: image.type,
        mimeType: "image/jpeg",
        data: await encodeExamMarkerImage(image.file),
      })));
      const response = await fetch("/api/exam-marker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          level,
          questionText,
          markingSchemeText,
          answerText,
          documents,
        }),
      });
      const payload = await response.json() as { result?: ExamMarkerResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "The marking request could not be completed.");
      setResult(payload.result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not connect to the marking service. Please try again.");
    } finally {
      setIsReviewing(false);
    }
  }

  const documentLabel = (type: ExaminerDocumentType) => type === "markingScheme" ? "Mark scheme" : type === "answer" ? "Your answer" : "Question";
  const listSection = (title: string, items: string[], ordered = false) => {
    const ListTag = ordered ? "ol" : "ul";
    return <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      {items.length > 0
        ? <ListTag className={`${ordered ? "list-decimal" : "list-disc"} space-y-2 pl-5 text-sm leading-6`}>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ListTag>
        : <p className="text-sm text-muted-foreground">No details were returned.</p>}
    </section>;
  };

  return <div className="mx-auto max-w-5xl space-y-5 p-6">
    <header>
      <h1 className="text-xl font-bold">Exam Marker</h1>
      <p className="mt-1 text-sm text-muted-foreground">Upload a question and its marking scheme for a tailored explanation. Add your answer for a mark estimate and specific feedback.</p>
    </header>
    <form onSubmit={reviewAnswer} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold">Subject
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm">{subjects.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <label className="text-xs font-semibold">Level
          <select value={level} onChange={(event) => setLevel(event.target.value as Level)} className="mt-1 w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm">{LEVELS.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
      </div>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Your source material</h2>
          <span className="text-xs text-muted-foreground">{images.length}/5 images</span>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">JPEG, PNG and WebP images are supported.</p>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Image document type" value={documentType} onChange={(event) => setDocumentType(event.target.value as ExaminerDocumentType)} className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm">
            <option value="question">Question image</option>
            <option value="markingScheme">Mark scheme image</option>
            <option value="answer">Your answer image</option>
          </select>
          <button type="button" disabled={images.length >= 5} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-semibold disabled:opacity-40">
            <Upload className="h-4 w-4" /> Add image
          </button>
          <input ref={fileInputRef} hidden type="file" accept="image/*" multiple onChange={(event) => addImages(event.target.files)} />
        </div>
        {images.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => <figure key={image.id} className="relative overflow-hidden rounded-lg border border-border bg-muted">
            <img src={image.preview} alt={`${documentLabel(image.type)} upload preview`} className="h-36 w-full object-contain" />
            <figcaption className="border-t border-border px-2 py-1.5 text-xs font-semibold">{documentLabel(image.type)}</figcaption>
            <button type="button" onClick={() => removeImage(image.id)} aria-label={`Remove ${documentLabel(image.type)} image`} className="absolute right-2 top-2 rounded-md bg-background/90 p-1.5 text-foreground shadow-sm hover:bg-background"><X className="h-4 w-4" /></button>
          </figure>)}
        </div>}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <label className="text-xs font-semibold">Question text
            <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} rows={5} placeholder="Paste the exact question here, or add a question image." className="mt-1 w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold">Marking scheme text
            <textarea value={markingSchemeText} onChange={(event) => setMarkingSchemeText(event.target.value)} rows={5} placeholder="Paste the marking points here, or add a scheme image." className="mt-1 w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold">Your answer <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea value={answerText} onChange={(event) => setAnswerText(event.target.value)} rows={5} placeholder="Paste your response or add an answer image to receive a mark." className="mt-1 w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm font-normal" />
          </label>
        </div>
      </section>
      {error && <p ref={errorRef} role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={isReviewing} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-50">
        {isReviewing ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading and marking…</> : <><ScanSearch className="h-4 w-4" /> Explain and mark</>}
      </button>
    </form>

    {result && <div ref={resultRef} className="scroll-mt-4 space-y-4" aria-live="polite">
      {result.score !== null && result.maxMarks !== null && <section className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
        <span className="text-3xl font-black tabular-nums text-primary">{result.score}/{result.maxMarks}</span>
        <span className="text-sm font-semibold">AI mark estimate against the uploaded scheme</span>
      </section>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {listSection("What the question is asking", result.questionExplanation)}
        {listSection("Mark scheme, in plain language", result.markingSchemeExplanation)}
      </div>
      {result.markBreakdown.length > 0 && <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold">Mark-by-mark assessment</h2>
        <div className="divide-y divide-border">
          {result.markBreakdown.map((item, index) => <article key={`${index}-${item.criterion}`} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
            <span className="row-span-2 min-w-12 font-bold tabular-nums text-primary">{item.awarded === null ? "—" : item.awarded}/{item.available}</span>
            <h3 className="text-sm font-semibold">{item.criterion}</h3>
            <p className="text-sm leading-5 text-muted-foreground">{item.rationale}</p>
          </article>)}
        </div>
      </section>}
      {answerText.trim() || images.some((image) => image.type === "answer")
        ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {listSection("Your answer: what worked", result.answerFeedback)}
          {listSection("What to change for more marks", result.improvements)}
        </div>
        : <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Add your answer next time to receive a mark and specific feedback on what to improve.</p>}
      <p className="rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">{result.confidenceNote} AI feedback is a practice estimate, not an official SQA mark.</p>
    </div>}
  </div>;
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
                {["Practice", "Test", "Prelim", "Past Paper", "Exam"].map(
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

function ExamTimer() {
  const [marks, setMarks] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const markValue = Number(marks);
  const durationSeconds = Number.isFinite(markValue) && markValue > 0
    ? Math.round(markValue * 90)
    : 0;
  const seconds = remainingSeconds ?? durationSeconds;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemainingSeconds((current) => current === null || current <= 0 ? 0 : current - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (running && remainingSeconds === 0) setRunning(false);
  }, [running, remainingSeconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  function reset() {
    setRunning(false);
    setRemainingSeconds(null);
    setAlarmDismissed(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold">Exam Timer</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Set your question marks and get a timed practice target.
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <label className="block text-sm font-semibold" htmlFor="exam-timer-marks">
          Marks for this question
          <input
            id="exam-timer-marks"
            type="number"
            min="0.1"
            step="any"
            value={marks}
            onChange={(event) => {
              setMarks(event.target.value);
              setRemainingSeconds(null);
              setRunning(false);
              setAlarmDismissed(false);
            }}
            placeholder="e.g. 10"
            className="mt-2 w-full rounded-lg border border-border bg-input-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {durationSeconds > 0
            ? `${markValue} marks × 1.5 = ${(durationSeconds / 60).toLocaleString(undefined, { maximumFractionDigits: 2 })} minutes`
            : "Enter a mark value to calculate your time."}
        </p>
        <div className="rounded-xl bg-primary/5 py-7 text-center">
          <p className="font-mono text-5xl font-bold tabular-nums text-primary" aria-live="polite">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {running ? "Time remaining" : "Minutes : seconds"}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Reset exam timer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (running) {
                setRunning(false);
              } else if (seconds > 0) {
                setRemainingSeconds(seconds);
                setRunning(true);
              }
            }}
            disabled={durationSeconds === 0 || seconds === 0}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={running ? "Pause exam timer" : "Start exam timer"}
          >
            {running ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>
          <span className="h-11 w-11" aria-hidden="true" />
        </div>
      </div>
      {remainingSeconds === 0 && !alarmDismissed && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-red-600/35 p-6 backdrop-blur-[1px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="exam-timer-alarm-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 text-center text-slate-900 shadow-2xl">
            <h2 id="exam-timer-alarm-title" className="text-xl font-bold">Time&apos;s up</h2>
            <p className="mt-2 text-sm text-slate-600">Your question time has finished.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setAlarmDismissed(true)}
                className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
              >
                Switch off alarm
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Reset timer
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [formError, setFormError] = useState("");
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    subject: selectedSubjects[0]?.subject || "",
    level: (selectedSubjects[0]?.level || "Higher") as Level,
    date: "",
    time: "",
    isPrelim: false,
  });

  function openAddExam() {
    setEditingId(null);
    setExamForm({
      subject: selectedSubjects[0]?.subject || "",
      level: selectedSubjects[0]?.level || "Higher",
      date: "",
      time: "",
      isPrelim: false,
    });
    setAdding(true);
  }

  function editExam(exam: ExamDate) {
    setEditingId(exam.id);
    setExamForm({
      subject: exam.subject,
      level: exam.level,
      date: exam.date,
      time: exam.time || "",
      isPrelim: exam.isPrelim,
    });
    setAdding(true);
  }

  function saveExam(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      setExamDates(examDates.map((exam) => exam.id === editingId
        ? {
            ...exam,
            subject: examForm.subject,
            level: examForm.level,
            date: examForm.date,
            time: examForm.time || undefined,
            isPrelim: examForm.isPrelim,
          }
        : exam));
    } else {
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
    }
    setEditingId(null);
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
          onClick={openAddExam}
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
                      onClick={() => editExam(e)}
                      className="p-1.5 rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label={`Edit ${e.subject} exam date`}
                      title="Edit exam date"
                    >
                      <Pen className="w-4 h-4" />
                    </button>
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
                      onClick={() => editExam(e)}
                      className="p-1.5 rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label={`Edit ${e.subject} exam date`}
                      title="Edit exam date"
                    >
                      <Pen className="w-4 h-4" />
                    </button>
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
            onSubmit={saveExam}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{editingId ? "Edit Exam / Prelim Date" : "Add Exam / Prelim Date"}</h3>
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
                {editingId ? "Save Changes" : "Add Exam"}
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
  const [celebration, setCelebration] = useState("");

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
    if (linesCleared > 0) {
      setCelebration(linesCleared > 1 ? "🎉✨🏆" : "🎉✨");
      window.setTimeout(() => setCelebration(""), 1000);
    }
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
    setCelebration("");
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
    <div className="h-full min-h-0 flex flex-col p-4 space-y-3">
      <div>
        <h1 className="text-xl font-bold">Break</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Place blocks to fill rows and columns. Take a mental break!
        </p>
      </div>

      {celebration && <div aria-live="polite" className="text-center text-3xl tracking-widest animate-bounce" aria-label="Line cleared">{celebration}</div>}

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

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center">
        <div className="shrink-0">
          <div
            className="grid gap-0.5 bg-muted p-1.5 rounded-2xl"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              width: "min(68vh, 620px, calc(100vw - 2rem))",
              minWidth: "min(240px, 100%)",
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHover({ r, c });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      placePiece(r, c);
                    }}
                    onDragLeave={() => setHover(null)}
                    className="aspect-square rounded-sm transition-colors"
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
              Drag the piece onto a valid cell on the grid
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
                <div
                  key={idx}
                  draggable={!isUsed && !gameOver}
                  onDragStart={() => {
                    if (!isUsed && !gameOver) setSelected(idx);
                  }}
                  onDragEnd={() => {
                    setSelected(null);
                    setHover(null);
                  }}
                  className={`p-2 rounded-xl border-2 transition-colors flex flex-col items-center justify-center gap-1 ${isUsed ? "opacity-30 cursor-not-allowed border-border" : isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted cursor-grab active:cursor-grabbing"}`}
                  style={{ minHeight: 76, aspectRatio: "1 / 1" }}
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
                          className="w-3.5 h-3.5 rounded-sm"
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
                </div>
              );
            })}
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              How to play
            </p>
            <p className="text-xs text-muted-foreground">
              1. Drag a piece from below
            </p>
            <p className="text-xs text-muted-foreground">
              2. Move it over the grid to preview placement
            </p>
            <p className="text-xs text-muted-foreground">
              3. Let go to place it
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

function WordNoteEditor({
  note,
  onChange,
  onNameChange,
}: {
  note: NoteFile;
  onChange: (text: string) => void;
  onNameChange: (name: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onChange(editorRef.current?.innerText || "");
  };
  const tools = [
    { label: "Bold", icon: <Bold className="w-3.5 h-3.5" />, command: "bold" },
    { label: "Italic", icon: <Italic className="w-3.5 h-3.5" />, command: "italic" },
    { label: "Underline", icon: <Underline className="w-3.5 h-3.5" />, command: "underline" },
    { label: "Align left", icon: <AlignLeft className="w-3.5 h-3.5" />, command: "justifyLeft" },
    { label: "Align centre", icon: <AlignCenter className="w-3.5 h-3.5" />, command: "justifyCenter" },
    { label: "Align right", icon: <AlignRight className="w-3.5 h-3.5" />, command: "justifyRight" },
    { label: "Bulleted list", icon: <List className="w-3.5 h-3.5" />, command: "insertUnorderedList" },
    { label: "Numbered list", icon: <ListOrdered className="w-3.5 h-3.5" />, command: "insertOrderedList" },
  ];
  return (
    <div className="max-w-4xl mx-auto border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
        <select aria-label="Text style" defaultValue="p" onChange={(e) => runCommand("formatBlock", e.target.value)} className="px-2 py-1.5 rounded border border-border bg-card text-xs">
          <option value="h1">Title</option><option value="h2">Heading 1</option><option value="h3">Heading 2</option><option value="p">Normal</option>
        </select>
        <select aria-label="Font size" defaultValue="3" onChange={(e) => runCommand("fontSize", e.target.value)} className="px-2 py-1.5 rounded border border-border bg-card text-xs">
          <option value="1">Small</option><option value="3">Normal</option><option value="5">Large</option><option value="7">Huge</option>
        </select>
        {tools.map((tool) => <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} onClick={() => runCommand(tool.command)} className="p-2 rounded hover:bg-background text-muted-foreground hover:text-foreground">{tool.icon}</button>)}
      </div>
      <input aria-label="Note title" value={note.name} onChange={(e) => onNameChange(e.target.value)} className="w-full px-6 pt-5 text-2xl font-bold bg-transparent outline-none" />
      <div ref={editorRef} contentEditable role="textbox" aria-label="Note body" suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerText)} className="min-h-[55vh] p-6 outline-none whitespace-pre-wrap text-base leading-7" dangerouslySetInnerHTML={{ __html: note.textContent.replace(/\n/g, "<br />") }} />
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
            <WordNoteEditor note={openNote} onChange={(textContent) => updateNote(openNote.id, { textContent })} onNameChange={(name) => updateNote(openNote.id, { name })} />
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
function ContactUs({
  recommendations,
  setRecommendations,
}: {
  recommendations: Recommendation[];
  setRecommendations: (r: Recommendation[]) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "suggestion",
    message: "",
  });
  const [sent, setSent] = useState(false);
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRecommendations([
      ...recommendations,
      { ...form, id: generateId(), date: todayStr() },
    ]);
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
            desc: "Ideas to improve Scribio",
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

// ─── ACCESSIBILITY ────────────────────────────────────────────────────────────
function AccessibilityPanel({
  settings,
  setSettings,
  onClose,
}: {
  settings: AccessibilitySettings;
  setSettings: (s: AccessibilitySettings) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-4 top-16 z-30 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold">Accessibility</h2>
          <p className="text-xs text-muted-foreground mt-1">Personalise how Scribio looks on your screen.</p>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted" aria-label="Close accessibility settings">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="flex items-center justify-between text-xs font-semibold mb-2">
            Font size <span className="text-muted-foreground">{settings.fontScale}%</span>
          </label>
          <input
            type="range"
            min="90"
            max="140"
            step="5"
            value={settings.fontScale}
            onChange={(e) => setSettings({ ...settings, fontScale: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Font</label>
          <select
            value={settings.fontFamily}
            onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value as AccessibilitySettings["fontFamily"] })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
          >
            <option value="default">Sans serif</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Colour</label>
          <select
            value={settings.colour}
            onChange={(e) => setSettings({ ...settings, colour: e.target.value as AccessibilitySettings["colour"] })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
          >
            <option value="default">Default</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => setSettings({ ...settings, highContrast: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          High contrast
        </label>
        <button
          type="button"
          onClick={() => setSettings({ fontScale: 100, fontFamily: "default", colour: "default", highContrast: false })}
          className="w-full py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
        >
          Reset appearance
        </button>
      </div>
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
  const [showAccessibility, setShowAccessibility] =
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
  const [sessionUserId, setSessionUserId] =
    useLocalStorage<string>("qs_session_uid", "");

  useEffect(() => {
    if (!firebaseConfigured) return;

    let isMounted = true;

    async function syncRemoteUsers() {
      const remoteUsers = await fetchUserProfiles();
      if (!isMounted) return;

      const mapped = remoteUsers.map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        school: profile.school,
        passwordHash: profile.passwordHash ?? simpleHash(""),
        status: profile.status,
        requestDate: profile.requestDate || todayStr(),
      }));

      setUsersRaw((previous) => {
        const map = new Map(previous.map((item) => [item.id, item]));
        mapped.forEach((item) => map.set(item.id, item));
        return [...map.values()];
      });
    }

    void syncRemoteUsers();

    if (firebaseAuth) {
      const unsubscribe = firebaseAuth.onIdTokenChanged(async (user) => {
        if (!user) {
          setSessionUserId("");
          return;
        }

        setSessionUserId(user.uid);
        const profile = await loadUserProfile(user.uid);
        const nextUser: AppUser = {
          id: user.uid,
          name: profile?.name ?? user.email?.split("@")[0] ?? "Student",
          email: user.email ?? "",
          school: profile?.school ?? "",
          passwordHash: profile?.passwordHash ?? simpleHash(""),
          status: (profile?.status as UserStatus | undefined) ?? "approved",
          requestDate: profile?.requestDate ?? todayStr(),
        };

        setUsersRaw((previous) => {
          const map = new Map(previous.map((item) => [item.id, item]));
          map.set(nextUser.id, nextUser);
          return [...map.values()];
        });
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [setUsersRaw, setSessionUserId]);

  const [selectedSubjects, setSelectedSubjectsRaw] =
    useLocalStorage<SelectedSubject[]>(userStorageKey("qs_subjects", sessionUserId), []);
  const [scores, setScoresRaw] = useLocalStorage<ScoreEntry[]>(
    userStorageKey("qs_scores", sessionUserId),
    [],
  );
  const [tasks, setTasksRaw] = useLocalStorage<Task[]>(
    userStorageKey("qs_tasks", sessionUserId),
    [],
  );
  const [examDates, setExamDatesRaw] = useLocalStorage<
    ExamDate[]
  >(userStorageKey("qs_exams", sessionUserId), []);
  const [notes, setNotesRaw] = useLocalStorage<NoteFile[]>(
    userStorageKey("qs_notes", sessionUserId),
    [],
  );
  const [recommendations, setRecommendationsRaw] = useLocalStorage<Recommendation[]>(
    userStorageKey("scribio_recommendations", sessionUserId),
    [],
  );
  const [accessibility, setAccessibility] = useLocalStorage<AccessibilitySettings>(
    userStorageKey("scribio_accessibility", sessionUserId),
    { fontScale: 100, fontFamily: "default", colour: "default", highContrast: false },
  );

  const setUsers = (u: AppUser[]) => setUsersRaw(u);
  const setSelectedSubjects = (s: SelectedSubject[]) =>
    setSelectedSubjectsRaw(s);
  const setScores = (s: ScoreEntry[]) => setScoresRaw(s);
  const setTasks = (t: Task[]) => setTasksRaw(t);
  const setExamDates = (e: ExamDate[]) => setExamDatesRaw(e);
  const setNotes = (n: NoteFile[]) => setNotesRaw(n);
  const setRecommendations = (r: Recommendation[]) => setRecommendationsRaw(r);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size",
      `${15 * (accessibility.fontScale / 100)}px`,
    );
  }, [accessibility.fontScale]);

  useEffect(() => {
    if (!firebaseConfigured || !sessionUserId) return;

    let isMounted = true;

    async function hydrateUserData() {
      const data = await loadStudyData(sessionUserId);
      if (!isMounted || !data) return;

      if (Array.isArray(data.selectedSubjects)) {
        setSelectedSubjectsRaw(data.selectedSubjects as SelectedSubject[]);
      }
      if (Array.isArray(data.scores)) {
        setScoresRaw(data.scores as ScoreEntry[]);
      }
      if (Array.isArray(data.tasks)) {
        setTasksRaw(data.tasks as Task[]);
      }
      if (Array.isArray(data.examDates)) {
        setExamDatesRaw(data.examDates as ExamDate[]);
      }
      if (Array.isArray(data.notes)) {
        setNotesRaw(data.notes as NoteFile[]);
      }
      if (Array.isArray(data.recommendations)) {
        setRecommendationsRaw(data.recommendations as Recommendation[]);
      }
      if (data.accessibility) {
        setAccessibility(data.accessibility as AccessibilitySettings);
      }
      if (typeof data.darkMode === "boolean") {
        setDarkMode(data.darkMode);
      }
    }

    void hydrateUserData();
    return () => {
      isMounted = false;
    };
  }, [sessionUserId, setSelectedSubjectsRaw, setScoresRaw, setTasksRaw, setExamDatesRaw, setNotesRaw, setRecommendationsRaw, setAccessibility, setDarkMode]);

  useEffect(() => {
    if (!firebaseConfigured || !currentUser) return;

    const syncUserData = async () => {
      await saveStudyData(currentUser.id, {
        selectedSubjects,
        scores,
        tasks,
        examDates,
        notes,
        recommendations,
        accessibility,
        darkMode,
      });
    };

    void syncUserData();
  }, [currentUser, selectedSubjects, scores, tasks, examDates, notes, recommendations, accessibility, darkMode]);

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
  }, [sessionUserId, users, selectedSubjects.length]);

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
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Task due today", { body: `${t.title}${t.subject ? ` · ${t.subject}` : ""}` });
              }
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
        darkMode={darkMode}
        toggleDark={() => setDarkMode((current) => !current)}
      />
    );
  }

  if (screen === "admin") {
    return (
      <AdminPanel
        users={users}
        setUsers={setUsers}
        recommendations={recommendations}
        onBack={() => setScreen("access")}
        darkMode={darkMode}
        toggleDark={() => setDarkMode((current) => !current)}
      />
    );
  }

  if (screen === "onboarding") {
    return <OnboardingModal onDone={handleOnboardingDone} darkMode={darkMode} toggleDark={() => setDarkMode((current) => !current)} />;
  }

  if (!currentUser) {
    return (
      <AccessGate
        onApproved={handleApproved}
        onAdmin={() => setScreen("admin")}
        users={users}
        setUsers={setUsers}
        darkMode={darkMode}
        toggleDark={() => setDarkMode((current) => !current)}
      />
    );
  }

  const fontFamily =
    accessibility.fontFamily === "serif"
      ? "Georgia, serif"
      : accessibility.fontFamily === "mono"
        ? "ui-monospace, SFMono-Regular, monospace"
        : undefined;
  return (
    <div
      className={`flex h-screen overflow-hidden bg-background text-foreground ${accessibility.colour === "warm" ? "accessibility-warm" : accessibility.colour === "cool" ? "accessibility-cool" : ""}`}
      style={{
        fontSize: `${accessibility.fontScale}%`,
        fontFamily,
        filter: [
          accessibility.colour === "warm" ? "sepia(0.12) saturate(1.08)" : "",
          accessibility.colour === "cool" ? "hue-rotate(8deg) saturate(0.96)" : "",
          accessibility.highContrast ? "contrast(1.15)" : "",
        ].filter(Boolean).join(" ") || undefined,
      }}
    >
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
                Scribio
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
              onClick={() => setShowAccessibility((v) => !v)}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              title="Accessibility"
              aria-label="Accessibility settings"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((d: boolean) => !d)}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>

          {showAccessibility && (
            <AccessibilityPanel
              settings={accessibility}
              setSettings={setAccessibility}
              onClose={() => setShowAccessibility(false)}
            />
          )}
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
                <PastPapers selectedSubjects={selectedSubjects} />
              )}
              {view === "scores" && (
                <ScoreTracker
                  scores={scores}
                  setScores={setScores}
                  selectedSubjects={selectedSubjects}
                />
              )}
              {view === "focus" && <FocusTimer />}
              {view === "examTimer" && <ExamTimer />}
              {view === "examMarker" && <ExamMarker selectedSubjects={selectedSubjects} />}
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
              {view === "contact" && (
                <ContactUs
                  recommendations={recommendations}
                  setRecommendations={setRecommendations}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
