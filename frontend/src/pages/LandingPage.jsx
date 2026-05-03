import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import HeroScene from "../components/HeroScene";
import ScrollVelocity from "../components/ScrollVelocity";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LiquidGlass from "../components/LiquidGlass";

/* ═══════════════════════════════════════════════════════════════
   ANIMATION PRIMITIVES
   ═══════════════════════════════════════════════════════════════ */

function TextReveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "120%" }}
        animate={inView ? { y: "0%" } : {}}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function FadeIn({ children, className = "", delay = 0, y = 40 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ target, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const anim = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      setVal(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [inView, target, duration]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: "◈",
    title: "Smart Analysis",
    desc: "Gemini AI dissects job descriptions, extracts keywords, and scores your match automatically.",
  },
  {
    icon: "△",
    title: "GitHub Sync",
    desc: "Pulls your real repositories, languages, stars, and READMEs to back every resume claim.",
  },
  {
    icon: "○",
    title: "PDF Compilation",
    desc: "LaTeX-compiled, ATS-friendly PDF output ready to submit to any company.",
  },
  {
    icon: "□",
    title: "Privacy First",
    desc: "API keys live in your browser only. Nothing touches our servers. Ever.",
  },
];

const TESTIMONIALS = [
  {
    name: "Alex Chen",
    role: "Software Engineer at Meta",
    text: "Morphr helped me tailor my resume for 12 different roles. Got 8 interviews. The keyword matching is insanely accurate.",
  },
  {
    name: "Priya Sharma",
    role: "Full Stack Developer",
    text: "I was spending hours editing my resume for each application. Now it takes 30 seconds and the output is better than what I wrote manually.",
  },
  {
    name: "Marcus Johnson",
    role: "DevOps Engineer",
    text: "The GitHub integration is brilliant. It pulled my best projects and wove them into the resume naturally. Felt like magic.",
  },
  {
    name: "Sarah Kim",
    role: "ML Engineer at Google",
    text: "Finally a tool that understands LaTeX. No more broken formatting. The PDF comes out perfect every single time.",
  },
];

const TOKEN_GUIDE = [
  {
    num: "01",
    title: "Get Your Free Gemini API Key",
    steps: [
      "Go to aistudio.google.com",
      "Sign in with your Google account",
      'Click "Get API Key" → "Create API key"',
      "Copy the key (starts with AIza...)",
      "Paste it in Morphr Settings",
    ],
    link: "https://aistudio.google.com",
    linkText: "Open AI Studio",
    note: "Completely free — no credit card needed",
  },
  {
    num: "02",
    title: "Add Your GitHub Username",
    steps: [
      "Go to your GitHub profile",
      "Copy your username from the URL (github.com/YOUR-USERNAME)",
      "Paste it in Morphr Settings",
    ],
    link: null,
    linkText: null,
    note: "We only read public repositories",
  },
  {
    num: "03",
    title: "Create a GitHub Token (Optional)",
    steps: [
      "Go to GitHub → Settings → Developer Settings",
      'Click "Fine-grained tokens" → "Generate new token"',
      "Set expiration to 90 days",
      'Under "Repository access" select "Public repositories (read-only)"',
      'Click "Generate token" and copy it',
      "Paste it in Morphr Settings",
    ],
    link: "https://github.com/settings/tokens?type=beta",
    linkText: "Create Token on GitHub",
    note: "Without a token: 60 calls/hour. With one: 5,000/hour.",
  },
];

/* ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const heroRef = useRef(null);
  const location = useLocation();
  const { scrollYProgress: heroP } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroP, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroP, [0, 0.6], [1, 0.88]);
  const heroY = useTransform(heroP, [0, 1], [0, 250]);

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.replace(/^#/, "");
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const rafA = requestAnimationFrame(() => {
      const rafB = requestAnimationFrame(scrollToTarget);
      return () => cancelAnimationFrame(rafB);
    });

    return () => cancelAnimationFrame(rafA);
  }, [location.hash, location.pathname]);

  return (
    <div className="bg-void">
      <Navbar />

      {/* ═════ HERO ═════ */}
      <section
        ref={heroRef}
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <HeroScene />
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 mb-8 px-5 py-2.5 rounded-full glass-liquid"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-gold"
            />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-gold/50 relative z-10">
              Powered by Gemini AI
            </span>
          </motion.div>

          <h1 className="font-heading font-black leading-[0.9] tracking-tighter mb-8">
            <TextReveal delay={0.5}>
              <span className="text-text-primary block text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
                Morph Your
              </span>
            </TextReveal>
            <TextReveal delay={0.7}>
              <span className="bg-gradient-to-r from-gold via-amber to-gold-300 bg-clip-text text-transparent block text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
                Resume
              </span>
            </TextReveal>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.3 }}
            className="text-text-dim text-base sm:text-lg md:text-xl leading-[1.8] max-w-xl mx-auto mb-10 font-mono"
          >
            Upload your resume, paste a job description, and get a perfectly
            tailored PDF — backed by your real GitHub projects.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/app"
              className="btn-primary !text-base !px-12 !py-5 no-underline inline-block"
            >
              Start Morphing →
            </Link>
            <a
              href="#about"
              className="btn-ghost !text-base no-underline inline-block"
            >
              Learn More
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-text-dim/25">
            Scroll
          </span>
          <motion.div
            className="w-px h-10 bg-gradient-to-b from-gold/30 to-transparent origin-top"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ═════ VELOCITY MARQUEE ═════ */}
      <div className="border-y border-white/[0.03] py-1">
        <ScrollVelocity
          texts={[
            "MORPHR ✦ AI TAILORING ✦ GITHUB SYNC ✦ LATEX PDF ✦ GEMINI AI ✦",
            "PRIVACY FIRST ✦ ATS OPTIMIZED ✦ KEYWORD MATCH ✦ OPEN SOURCE ✦",
          ]}
          velocity={60}
          className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-[0.1em] text-white/[0.04] uppercase"
        />
      </div>

      {/* ═════ ABOUT ═════ */}
      <section id="about" className="section-padding">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <FadeIn>
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/30 block mb-4">
                  About
                </span>
              </FadeIn>
              <TextReveal>
                <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-text-primary leading-[1.05] mb-6">
                  Your Resume, <span className="text-gold">Morphed</span>
                </h2>
              </TextReveal>
              <FadeIn delay={0.2}>
                <p className="text-text-dim text-sm sm:text-base leading-[2] font-mono mb-4">
                  Morphr uses Gemini 2.5 Flash to analyze job descriptions,
                  extract keywords, and match them against your real GitHub
                  projects. It rewrites your LaTeX resume to highlight the most
                  relevant experience.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <p className="text-text-dim text-sm sm:text-base leading-[2] font-mono mb-6">
                  No fabrication. No hallucination. Every bullet point is backed
                  by actual repository data — languages, READMEs, and project
                  descriptions.
                </p>
              </FadeIn>
              <FadeIn delay={0.4}>
                <Link
                  to="/app"
                  className="btn-secondary !text-sm no-underline inline-block"
                >
                  Try it now →
                </Link>
              </FadeIn>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 30, suffix: "s", label: "Average time" },
                { value: 95, suffix: "%", label: "ATS compatible" },
                { value: 10, suffix: "+", label: "Keywords matched" },
                { value: 0, suffix: "", label: "Data stored", display: "Zero" },
              ].map((stat, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="p-5 rounded-2xl glass-liquid text-center">
                    <div className="font-heading text-3xl sm:text-4xl font-black text-text-primary mb-1.5 relative z-10">
                      {stat.display || (
                        <CountUp target={stat.value} suffix={stat.suffix} />
                      )}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-dim/40 relative z-10">
                      {stat.label}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════ FEATURES ═════ */}
      <section id="features" className="section-padding">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <FadeIn>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/30 block mb-4">
                Features
              </span>
            </FadeIn>
            <TextReveal>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary">
                Everything You Need
              </h2>
            </TextReveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative p-7 md:p-8 rounded-2xl glass-liquid overflow-hidden group"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                                  bg-gradient-to-br from-gold/[0.03] via-transparent to-transparent pointer-events-none"
                  />
                  <div className="relative z-10">
                    <div
                      className="w-14 h-14 rounded-2xl glass-subtle flex items-center justify-center mb-5
                                    group-hover:border-gold/20 transition-colors duration-500 border border-white/[0.06]"
                    >
                      <span className="text-gold text-xl">{f.icon}</span>
                    </div>
                    <h3
                      className="font-heading text-base md:text-lg font-semibold text-text-primary mb-2
                                   group-hover:text-gold transition-colors duration-500"
                    >
                      {f.title}
                    </h3>
                    <p className="text-text-dim/60 text-sm leading-[1.8] font-mono">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═════ HOW IT WORKS ═════ */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <FadeIn>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/30 block mb-4">
                Process
              </span>
            </FadeIn>
            <TextReveal>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary">
                How It Works
              </h2>
            </TextReveal>
          </div>
          {[
            {
              num: "01",
              title: "Upload Resume",
              desc: "Drag and drop your LaTeX .tex template into the app.",
            },
            {
              num: "02",
              title: "Paste Job Description",
              desc: "Add the company name and the full job posting text.",
            },
            {
              num: "03",
              title: "Download Tailored PDF",
              desc: "AI rewrites relevant sections and compiles your new resume.",
            },
          ].map((step, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <motion.div
                whileHover={{ x: 12 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-6 md:gap-10 py-8 md:py-10 border-b border-white/[0.04] group"
              >
                <span
                  className="font-heading text-5xl md:text-7xl lg:text-8xl font-black text-white/[0.03]
                                 group-hover:text-gold/12 transition-colors duration-700 flex-shrink-0 leading-none"
                >
                  {step.num}
                </span>
                <div className="pt-2 md:pt-4">
                  <h3
                    className="font-heading text-lg md:text-xl font-semibold text-text-primary mb-2
                                 group-hover:text-gold transition-colors duration-500"
                  >
                    {step.title}
                  </h3>
                  <p className="text-text-dim/50 text-sm font-mono leading-relaxed max-w-md">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═════ TOKEN GUIDE ═════ */}
      <section id="guide" className="section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <FadeIn>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/30 block mb-4">
                Setup Guide
              </span>
            </FadeIn>
            <TextReveal>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary leading-tight">
                Get Your <span className="text-gold">Tokens</span>
              </h2>
            </TextReveal>
            <FadeIn delay={0.15}>
              <p className="text-text-dim text-sm font-mono mt-4 max-w-lg mx-auto leading-relaxed">
                Morphr needs a free Gemini API key and your GitHub username.
                Follow these steps.
              </p>
            </FadeIn>
          </div>

          <div className="flex flex-col gap-4">
            {TOKEN_GUIDE.map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="rounded-2xl glass-liquid overflow-hidden">
                  <div className="flex items-center gap-4 px-6 pt-6 pb-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl glass-subtle border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <span className="font-heading text-lg font-black text-gold/60">
                        {item.num}
                      </span>
                    </div>
                    <h3 className="font-heading text-base md:text-lg font-semibold text-text-primary">
                      {item.title}
                    </h3>
                  </div>
                  <div className="px-6 pb-5 relative z-10">
                    <div className="ml-3 pl-6 border-l border-white/[0.04]">
                      {item.steps.map((step, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.05 + j * 0.04 }}
                          className="flex items-start gap-2.5 py-1.5"
                        >
                          <div
                            className="w-5 h-5 rounded-full glass-subtle border border-white/[0.06]
                                          flex items-center justify-center flex-shrink-0 mt-0.5"
                          >
                            <span className="text-[8px] font-mono text-gold/50 font-bold">
                              {j + 1}
                            </span>
                          </div>
                          <span className="text-text-dim/70 text-sm font-mono leading-relaxed">
                            {step}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-3 ml-3 pl-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="text-text-dim/25 text-xs font-mono italic">
                        💡 {item.note}
                      </span>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold/60 hover:text-gold text-xs font-mono font-semibold no-underline
                                     px-3 py-1.5 rounded-lg glass-subtle border border-white/[0.06]
                                     hover:border-gold/20 transition-all duration-300 inline-block w-fit"
                        >
                          {item.linkText} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div className="text-center mt-8">
              <Link
                to="/settings"
                className="btn-primary !text-sm !px-10 !py-4 no-underline inline-block"
              >
                Configure Settings
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═════ TESTIMONIALS ═════ */}
      <section id="testimonials" className="section-padding">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <FadeIn>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/30 block mb-4">
                Testimonials
              </span>
            </FadeIn>
            <TextReveal>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary">
                What Users Say
              </h2>
            </TextReveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 rounded-2xl glass-liquid group"
                >
                  <div className="flex gap-1 mb-4 relative z-10">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-gold/40 text-sm">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-text-dim/70 text-sm font-mono leading-[1.8] mb-5 italic relative z-10">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-9 h-9 rounded-full glass-subtle border border-white/[0.06] flex items-center justify-center">
                      <span className="font-heading text-[10px] font-bold text-gold/70">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-semibold">
                        {t.name}
                      </p>
                      <p className="text-text-dim/40 text-[10px] font-mono">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═════ VELOCITY 2 ═════ */}
      <div className="border-y border-white/[0.03] py-1">
        <ScrollVelocity
          texts={["MORPH YOUR RESUME ✦ TAILORED IN SECONDS ✦ AI POWERED ✦"]}
          velocity={40}
          className="font-heading text-4xl sm:text-5xl md:text-6xl tracking-[0.08em] text-white/[0.03] uppercase"
        />
      </div>

      {/* ═════ CTA ═════ */}
      <section className="section-padding relative overflow-hidden min-h-[50vh] flex items-center">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/[0.012] blur-[150px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/30 block mb-6">
              Get Started
            </span>
          </FadeIn>
          <TextReveal>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-8">
              <span className="text-text-primary">Ready to </span>
              <span className="text-gold">Morph</span>
              <span className="text-text-primary">?</span>
            </h2>
          </TextReveal>
          <FadeIn delay={0.2}>
            <p className="text-text-dim/50 text-base md:text-lg font-mono mb-10 max-w-lg mx-auto leading-relaxed">
              Stop sending generic resumes. Let AI morph every application to
              maximize your interview rate.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <Link
              to="/app"
              className="btn-primary !text-base !px-14 !py-5 no-underline inline-block"
            >
              Launch Morphr
            </Link>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
