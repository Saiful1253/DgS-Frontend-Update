"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Globe2, ShieldCheck, Sparkles, Cpu, Award, ArrowRight, Layers, Users, Zap } from "lucide-react";

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <Globe2 className="w-4 h-4" />
            Italy Registered Digital Technology Agency
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-6">
            Bridging European Heritage & Global Engineering Excellence
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed">
            Born at the intersection of European design heritage and global engineering talent, we build enterprise-grade software and digital experiences. We bridge strategy, clean architecture, and modern tech stacks to turn complex business problems into elegant, reliable solutions.
          </p>
        </div>
      </section>

      {/* Story, Mission, Vision */}
      <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Our Story</h3>
            <p className="text-slate-400 leading-relaxed">
              Founded in Italy with global operating hubs, Milanova Technologies bridges high-end design aesthetics with robust software engineering for worldwide scale.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-blue-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Our Mission</h3>
            <p className="text-slate-400 leading-relaxed">
              To build simple, scalable, and secure digital products that empower businesses to operate efficiently and grow without technical friction.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Our Vision</h3>
            <p className="text-slate-400 leading-relaxed">
              To be the most trusted cross-border technology partner, recognized globally for structural precision, user-centric simplicity, and engineering excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values & Why Choose Us */}
      <section id="why-choose-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Core Values & Engineering Strengths</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Why enterprise clients and fast-growing startups trust Milanova for mission-critical software & digital solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "EU-Compliant & Global Reach",
              desc: "Headquartered in Italy for seamless European legal, financial, and compliance standards, backed by global execution capability.",
              icon: Globe2,
            },
            {
              title: "Full-Lifecycle Product Engineering",
              desc: "From architectural consultation and UX design to full-stack development, cloud deployment, and automated CI/CD pipelines.",
              icon: Layers,
            },
            {
              title: "AI & Low-Code Rescue Capabilities",
              desc: "Specialized expertise in debugging, optimizing, and auditing non-dev or AI-generated code (Claude, Cursor, Bubble, FlutterFlow).",
              icon: Cpu,
            },
            {
              title: "Pragmatic Simplicity",
              desc: "Clean architecture over unnecessary complexity. Maintainable, modular codebases designed for long-term viability.",
              icon: CheckCircle2,
            },
            {
              title: "Radical Transparency",
              desc: "No black boxes, zero hidden bottlenecks, open async communication with direct developer access.",
              icon: Users,
            },
            {
              title: "Predictable European Quality",
              desc: "Uncompromised standards in UI/UX design, GDPR compliance, rigorous code reviews, and automated security auditing.",
              icon: ShieldCheck,
            },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
              <item.icon className="w-8 h-8 text-cyan-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Culture Section with 3D / Glassmorphism Visual Cards */}
      <section id="culture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <span className="text-cyan-400 font-semibold text-sm tracking-wider uppercase">Our Culture</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-4">Engineering Culture & Values</h2>
          <p className="text-slate-400 max-w-3xl mx-auto">
            We bridge design precision with high-impact, full-stack engineering. Grounded in a culture of radical transparency, extreme ownership, and inclusive collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Radical Transparency */}
          <div className="relative group p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/50 transition-all duration-300">
            <div className="absolute -top-6 left-8 w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-cyan-400 font-bold text-lg">
                01
              </div>
            </div>
            <div className="mt-4 mb-6">
              {/* Visual Glassmorphism Shape */}
              <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-800/40 to-transparent border border-cyan-500/20 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="w-24 h-24 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 rotate-12 backdrop-blur-md flex items-center justify-center">
                  <Layers className="w-10 h-10 text-cyan-400" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Radical Transparency & Collaboration</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Open dashboards, live blueprint sketching, direct async communication channels, and clear architectural roadmaps.
            </p>
            <span className="inline-flex items-center text-xs font-semibold text-cyan-400">
              No black boxes · Zero hidden bottlenecks
            </span>
          </div>

          {/* Card 2: Diverse Global Teams */}
          <div className="relative group p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300">
            <div className="absolute -top-6 left-8 w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-blue-400 font-bold text-lg">
                02
              </div>
            </div>
            <div className="mt-4 mb-6">
              <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-800/40 to-transparent border border-blue-500/20 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="relative flex items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/40 -mr-4 backdrop-blur-md flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="w-20 h-20 rounded-full bg-purple-500/20 border border-purple-400/40 backdrop-blur-md flex items-center justify-center z-10">
                    <Globe2 className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Diverse & Inclusive Global Teams</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Gender-balanced, multicultural perspectives from European headquarters and regional talent hubs driving tech innovation.
            </p>
            <span className="inline-flex items-center text-xs font-semibold text-blue-400">
              Cross-border talent · Inclusive innovation
            </span>
          </div>

          {/* Card 3: Extreme Ownership */}
          <div className="relative group p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300">
            <div className="absolute -top-6 left-8 w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-600 p-[1px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-purple-400 font-bold text-lg">
                03
              </div>
            </div>
            <div className="mt-4 mb-6">
              <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-800/40 to-transparent border border-purple-500/20 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="w-20 h-20 rotate-45 rounded-xl bg-purple-500/20 border border-purple-400/40 backdrop-blur-md flex items-center justify-center">
                  <div className="-rotate-45">
                    <Cpu className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Extreme Ownership as Co-Architects</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              We don&apos;t just execute task tickets; we take responsibility for product outcome, scalability, and business viability.
            </p>
            <span className="inline-flex items-center text-xs font-semibold text-purple-400">
              Co-architect mindset · Long-term viability
            </span>
          </div>
        </div>
      </section>

      {/* Our Process & Certifications */}
      <section id="process" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-cyan-400 font-semibold text-sm tracking-wider uppercase">Delivery Process</span>
            <h2 className="text-3xl font-bold text-white mt-2 mb-6">How We Deliver Excellence</h2>
            <div className="space-y-6">
              {[
                { step: "01", name: "Discover & Align", text: "Business logic analysis, user journey mapping, and technical architecture planning." },
                { step: "02", name: "Agile Engineering", text: "Sprint-based development with continuous integration and async demo updates." },
                { step: "03", name: "QA & Security Audits", text: "Automated test suites, security patching, GDPR compliance checks, and code audits." },
                { step: "04", name: "Deploy & Scale", text: "Smooth cloud deployment, production launch, documentation handover, and ongoing support." },
              ].map((p, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-cyan-400 shrink-0">
                    {p.step}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{p.name}</h4>
                    <p className="text-sm text-slate-400">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="certifications" className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800">
            <Award className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Certifications & Standards</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              We operate under European regulatory frameworks, maintaining strict standards across modern web technology stacks and security compliance.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="font-bold text-cyan-400 text-lg mb-1">GDPR</div>
                <div className="text-xs text-slate-400">EU Data Protection</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="font-bold text-blue-400 text-lg mb-1">ISO Standards</div>
                <div className="text-xs text-slate-400">Quality Management</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="font-bold text-purple-400 text-lg mb-1">AWS / Cloud</div>
                <div className="text-xs text-slate-400">Certified Architecture</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="font-bold text-emerald-400 text-lg mb-1">Next.js / .NET</div>
                <div className="text-xs text-slate-400">Modern Engineering</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-purple-900/40 border border-cyan-500/30 text-center relative overflow-hidden">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Something Extraordinary?</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            Connect with our team to discuss your software engineering, creative production, or digital growth needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all">
              Book a Consultation
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-700 font-semibold hover:border-slate-600 transition-all">
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
