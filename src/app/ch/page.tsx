"use client";

import React, { useRef } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────
const hierarchy = {
  ceo: { id: 1, name: "آرش ایران زاده", role: "مدیرعامل", color: "amber" },
  branches: [
    {
      id: "research",
      title: "تحقیق و توسعه",
      icon: "flask",
      color: "purple",
      members: [
        { id: 2, name: "رویا ایزدی", role: "کارشناس تحقیق" },
        { id: 3, name: "الهه برزگر", role: "کارشناس تحقیق" },
      ],
    },
    {
      id: "finance",
      title: "مالی و حسابداری",
      icon: "calculator",
      color: "emerald",
      members: [
        { id: 4, name: "فاطمه نظری", role: "کارشناس حسابداری" },
        { id: 5, name: "سمیع زنگنه آبادی", role: "کارشناس خزانه داری" },
        { id: 9, name: "امیر رضا عباسلو", role: "کارشناس صندوق" },
      ],
    },
    {
      id: "contracts",
      title: "قراردادها",
      icon: "scroll",
      color: "rose",
      members: [
        { id: 6, name: "مسعود منصوری", role: "کارشناس قرارداد" },
        { id: 7, name: "فاطمه رضوی", role: "کارشناس قرارداد" },
      ],
    },
    {
      id: "transport",
      title: "حمل و نقل",
      icon: "truck",
      color: "teal",
      members: [
        { id: 8, name: "محمد نعمتی", role: "کارشناس حمل و نقل و سوخت رسانی" },
      ],
    },
    {
      id: "warehousing",
      title: "انبارداری",
      icon: "box",
      color: "sky",
      members: [
        { id: 10, name: "مهدی اسداللهی", role: "انباردار" },
        { id: 11, name: "اصغر حسن زاده", role: "انباردار" },
      ],
    },
  ],
};

// ─── Color Palette ───────────────────────────────────────────────────────────
type Colors = {
  border: string;
  bg: string;
  text: string;
  glow: string;
  line: string;
  ring: string;
  gradientFrom: string;
  gradientTo: string;
};

const colorMap: Record<string, Colors> = {
  amber:   { border: "border-amber-400/40",   bg: "bg-amber-400/10",   text: "text-amber-200",   glow: "rgba(251,191,36,0.18)",  line: "bg-amber-400",   ring: "ring-amber-400/30",   gradientFrom: "from-amber-400/60",   gradientTo: "to-amber-500/0"   },
  purple:  { border: "border-purple-400/40",  bg: "bg-purple-400/10",  text: "text-purple-200",  glow: "rgba(192,132,252,0.18)", line: "bg-purple-400",  ring: "ring-purple-400/30",  gradientFrom: "from-purple-400/60",  gradientTo: "to-purple-500/0"  },
  emerald: { border: "border-emerald-400/40", bg: "bg-emerald-400/10", text: "text-emerald-200", glow: "rgba(52,211,153,0.18)",  line: "bg-emerald-400", ring: "ring-emerald-400/30", gradientFrom: "from-emerald-400/60", gradientTo: "to-emerald-500/0" },
  rose:    { border: "border-rose-400/40",    bg: "bg-rose-400/10",    text: "text-rose-200",    glow: "rgba(251,113,133,0.18)", line: "bg-rose-400",    ring: "ring-rose-400/30",    gradientFrom: "from-rose-400/60",    gradientTo: "to-rose-500/0"    },
  teal:    { border: "border-teal-400/40",    bg: "bg-teal-400/10",    text: "text-teal-200",    glow: "rgba(45,212,191,0.18)",  line: "bg-teal-400",    ring: "ring-teal-400/30",    gradientFrom: "from-teal-400/60",    gradientTo: "to-teal-500/0"    },
  sky:     { border: "border-sky-400/40",     bg: "bg-sky-400/10",     text: "text-sky-200",     glow: "rgba(56,189,248,0.18)",  line: "bg-sky-400",     ring: "ring-sky-400/30",     gradientFrom: "from-sky-400/60",     gradientTo: "to-sky-500/0"     },
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ name, className = "w-4 h-4" }: { name: string; className?: string }) => {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (name) {
    case "flask":
      return <svg {...props}><path d="M10 2v6.5L4 20a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L14 8.5V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>;
    case "calculator":
      return <svg {...props}><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="8" y1="14" y2="14"/><line x1="12" x2="12" y1="14" y2="14"/><line x1="16" x2="16" y1="14" y2="14"/><line x1="8" x2="8" y1="18" y2="18"/><line x1="12" x2="12" y1="18" y2="18"/><line x1="16" x2="16" y1="18" y2="18"/></svg>;
    case "scroll":
      return <svg {...props}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>;
    case "truck":
      return <svg {...props}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>;
    case "box":
      return <svg {...props}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
    case "crown":
      return <svg {...props}><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>;
    case "user":
      return <svg {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    default:
      return null;
  }
};

// ─── Card Content ────────────────────────────────────────────────────────────
const CardContent = ({ item, colors, isCEO = false }: { item: any; colors: Colors; isCEO?: boolean }) => (
  <div className="relative z-10 flex flex-col text-right w-full" dir="rtl">
    {/* Top Row: Number + Status Pill */}
    <div className="flex justify-between items-center w-full mb-4">
      <span className={`font-mono text-[10px] tracking-widest px-2 py-1 rounded-full border ${colors.border} ${colors.bg} ${colors.text}`}>
        #{String(item.id).padStart(3, "0")}
      </span>
      <div className={`relative w-9 h-9 rounded-full flex items-center justify-center border ${colors.border} ${colors.bg} ${colors.text}`}>
        <span className={`absolute inset-0 rounded-full ${colors.line} opacity-20 animate-ping`} />
        <Icon name={isCEO ? "crown" : "user"} className="w-4 h-4 relative z-10" />
      </div>
    </div>

    {/* Name */}
    <h3 className={`font-bold text-white leading-tight mb-2 ${isCEO ? "text-xl" : "text-base"}`}>
      {item.name}
    </h3>

    {/* Role with live dot */}
    <div className="flex items-center gap-2">
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.line} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colors.line}`} />
      </span>
      <p className={`text-[11px] font-medium leading-relaxed ${colors.text} opacity-90`}>{item.role}</p>
    </div>
  </div>
);

// ─── Organizational Card ─────────────────────────────────────────────────────
const OrgCard = ({
  item,
  color,
  isCEO = false,
}: {
  item: any;
  color: string;
  isCEO?: boolean;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = colorMap[color] || colorMap.amber;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    cardRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-2xl p-[1px] transition-all duration-300 ease-out w-full ${
        isCEO ? "max-w-[320px]" : "max-w-[260px]"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Animated gradient border */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientTo} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Card body */}
      <div className="relative rounded-2xl bg-[#0b1020]/95 backdrop-blur-xl p-5 overflow-hidden">
        {/* Cursor spotlight */}
        <div
          className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), ${colors.glow}, transparent 45%)`,
          }}
        />

        {/* Shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent z-0 pointer-events-none" />

        <CardContent item={item} colors={colors} isCEO={isCEO} />
      </div>
    </div>
  );
};

// ─── Branch Header Pill ──────────────────────────────────────────────────────
const BranchHeader = ({ branch }: { branch: any }) => {
  const colors = colorMap[branch.color];
  return (
    <div
      className={`relative z-20 flex items-center gap-2 px-4 py-2 rounded-full border ${colors.border} ${colors.bg} backdrop-blur-md shadow-lg shadow-black/20`}
    >
      <span className={`absolute inset-0 rounded-full ${colors.line} opacity-10`} />
      <span className={colors.text}>
        <Icon name={branch.icon} className="w-3.5 h-3.5" />
      </span>
      <span className={`text-xs md:text-[13px] font-bold whitespace-nowrap ${colors.text}`}>
        {branch.title}
      </span>
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} opacity-70`}>
        {branch.members.length}
      </span>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OrganizationalChartPage() {
  const { ceo, branches } = hierarchy;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#060914] text-slate-100 font-sans overflow-x-hidden relative selection:bg-white/20"
    >
      {/* Custom Keyframes */}
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[140px] animate-[float-glow_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[140px] animate-[float-glow_10s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-14 md:mb-20 max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-medium text-slate-300 tracking-wide">
              ساختار فعال · {new Date().toLocaleDateString("fa-IR")}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
            چارت سازمانی
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            ساختار، نقش‌ها و مسئولیت‌های سازمانی در یک نگاه
          </p>
          <div className="mt-6 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </header>

        {/* ─── Tree ─────────────────────────────────────────────── */}
        <div className="w-full max-w-7xl flex flex-col items-center">

          {/* CEO */}
          <div className="relative z-20 flex justify-center">
            <OrgCard item={ceo} color={ceo.color} isCEO />
          </div>

          {/* Connector: CEO → trunk */}
          <div className="relative w-px h-10 md:h-14 bg-gradient-to-b from-amber-400/60 via-amber-400/30 to-white/10" />

          {/* ── Branches container ─────────────────────────────── */}
          <div className="relative w-full pt-10 md:pt-14 flex flex-col md:flex-row md:flex-wrap md:justify-center md:items-start gap-10 md:gap-x-4 md:gap-y-12">

            {/* Desktop curved horizontal connector */}
            <svg
              className="hidden md:block absolute top-0 left-0 w-full h-14 pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 100 56"
            >
              <defs>
                <linearGradient id="branchLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                </linearGradient>
              </defs>
              {/* Horizontal bar */}
              <line
                x1="10" y1="4" x2="90" y2="4"
                stroke="url(#branchLine)"
                strokeWidth="0.3"
                vectorEffect="non-scaling-stroke"
              />
              {/* Vertical drops */}
              {[10, 30, 50, 70, 90].map((x) => (
                <path
                  key={x}
                  d={`M ${x} 4 Q ${x} 14 ${x} 14`}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.3"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {branches.map((branch) => {
              const colors = colorMap[branch.color];
              return (
                <div
                  key={branch.id}
                  className="relative flex flex-col items-center w-full md:w-auto md:flex-1 md:min-w-[180px] md:max-w-[240px]"
                >
                  {/* Mobile connector down */}
                  <div className="md:hidden w-px h-8 bg-white/10 mb-4" />

                  {/* Desktop connector down to header */}
                  <div className="hidden md:block absolute top-14 left-1/2 -translate-x-1/2 w-px h-6 bg-white/15" />

                  {/* Branch Header */}
                  <div className="relative z-20 md:mt-[80px]">
                    <BranchHeader branch={branch} />
                  </div>

                  {/* Vertical line to members */}
                  <div className={`w-px h-5 ${colors.line} opacity-40`} />

                  {/* Members */}
                  <div className="flex flex-col items-center gap-0 w-full">
                    {branch.members.map((member, idx) => (
                      <React.Fragment key={member.id}>
                        {idx > 0 && (
                          <div className={`w-px h-4 ${colors.line} opacity-30`} />
                        )}
                        <div className="w-full flex justify-center">
                          <OrgCard item={member} color={branch.color} />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="h-px w-16 mx-auto mb-4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-[11px] text-slate-500 tracking-wide">
            {branches.reduce((sum, b) => sum + b.members.length, 0) + 1} عضو ·{" "}
            {branches.length} دپارتمان
          </p>
        </footer>
      </div>
    </div>
  );
}