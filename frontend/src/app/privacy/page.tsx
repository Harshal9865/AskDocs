import Link from "next/link";
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | AskDocs AI",
  description: "AskDocs Privacy Policy, Google API User Data Policy Compliance, and Security Disclosures.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Radiant Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-12 sm:py-20 space-y-10">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to AskDocs</span>
          </Link>
          <span className="text-xs font-mono text-zinc-400">Effective Date: September 2026</span>
        </div>

        {/* Header Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3.5 py-1 text-xs font-bold text-purple-300 backdrop-blur-md">
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span>Enterprise Security & Trust</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            AskDocs Privacy Policy & Security Disclosures
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
            We are committed to protecting your privacy, institutional confidentiality, and providing transparent disclosures regarding Google OAuth and document processing.
          </p>
        </div>

        {/* Quick Trust Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: "Zero Model Training", desc: "Customer documents are never used to train public or proprietary AI models." },
            { title: "AES-256 Encryption", desc: "All files and vector chunks are encrypted in transit (TLS 1.3) and at rest." },
            { title: "Zero-Trust Isolation", desc: "Multi-tenant workspace isolation guarantees strict partition of your data." },
          ].map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Full Privacy Policy Sections */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-xl space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-mono text-purple-300">1</span>
              <span>Information We Collect</span>
            </h2>
            <p>
              When you use AskDocs, we collect information necessary to provide AI-powered document search, retrieval, and collaboration services:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400">
              <li><strong>Account Information:</strong> Name, email address, and authentication tokens via Google Sign-In or password authentication.</li>
              <li><strong>Uploaded Content:</strong> Documents, spreadsheets, PDFs, slide decks, and text notes uploaded to your active workspace.</li>
              <li><strong>Integration Data:</strong> When connected, read-only metadata and selected file streams from Google Drive, Slack, Notion, or ERP webhooks.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-mono text-purple-300">2</span>
              <span>Google API Services User Data Policy Compliance (Limited Use)</span>
            </h2>
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2 text-xs text-purple-200">
              <p className="font-bold text-purple-300">
                Google Drive & OAuth Data Protection Notice:
              </p>
              <p>
                AskDocs&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-purple-300 hover:text-white"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                <li>We only request read-only access (<code>drive.readonly</code>) to files and folders you explicitly select.</li>
                <li>We do not transfer or sell Google user data to third parties, advertising networks, or data brokers.</li>
                <li>Google user data is strictly used to provide cited AI document question-answering and vector synthesis.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-mono text-purple-300">3</span>
              <span>How We Process & Protect Your Data</span>
            </h2>
            <p>
              Uploaded documents are chunked and vectorized using cryptographic embedding models. Each chunk retains strict workspace tenancy tags. Our Enterprise Application Firewall (WAF) inspects requests to prevent unauthorized cross-tenant extraction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-mono text-purple-300">4</span>
              <span>Data Retention & Right to Deletion</span>
            </h2>
            <p>
              You maintain 100% ownership of your data. When you delete a file or workspace, all associated text excerpts, vector embeddings, and chunk metadata are permanently purged from our database and cloud storage within 30 days.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/10">
            <h2 className="text-base font-bold text-white">Contact & Data Protection Inquiries</h2>
            <p className="text-xs text-zinc-400">
              For privacy requests, GDPR deletion, or Google OAuth verification inquiries, contact our Data Security Team at:
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-mono text-purple-300">
              Email: harshalkr220@gmail.com
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
