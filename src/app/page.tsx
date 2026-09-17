import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Lucida<span className="text-blue-400"> AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_35%)]" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-24 text-center sm:px-6 lg:pb-32 lg:pt-32">
          <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
            ✦ Intelligent Visual Analysis
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Understand any image
            <span className="block text-blue-400">with AI.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Upload an image, ask exactly what you want to know, and let Lucida
            AI analyze it with precision.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-blue-500 px-7 py-4 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
            >
              Start Analyzing →
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              What Lucida can do
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              One image. Many possibilities.
            </h2>

            <p className="mt-4 text-slate-400">
              Ask questions naturally and get answers focused on your exact
              request.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="🔍"
              title="Image Understanding"
              description="Understand objects, scenes, details, and visual information in your images."
            />

            <FeatureCard
              icon="📝"
              title="OCR & Documents"
              description="Extract readable text from screenshots, documents, notes, and other images."
            />

            <FeatureCard
              icon="📊"
              title="Charts & Diagrams"
              description="Ask questions about charts, diagrams, graphs, and other visual data."
            />

            <FeatureCard
              icon="🌐"
              title="Translation"
              description="Translate visible text while keeping the original text and translation clearly separated."
            />

            <FeatureCard
              icon="🛠️"
              title="Find Mistakes"
              description="Identify visible errors and get clear explanations and possible corrections."
            />

            <FeatureCard
              icon="💬"
              title="Continue the Conversation"
              description="Ask follow-up questions about the same image without starting over."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How it works
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Get visual answers in three simple steps.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              number="01"
              title="Upload"
              description="Choose an image from your device."
            />

            <Step
              number="02"
              title="Ask"
              description="Describe exactly what you want to know."
            />

            <Step
              number="03"
              title="Understand"
              description="Lucida analyzes the image and gives you a focused answer."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-blue-500/5">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to understand your images?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Start your visual analysis workspace and explore what your images
            can tell you.
          </p>

          <Link
            href="/signup"
            className="mt-8 inline-flex rounded-xl bg-blue-500 px-7 py-4 font-semibold text-white transition hover:bg-blue-400"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Lucida AI</p>

          <p>AI-powered visual intelligence</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-blue-400/30 hover:bg-white/[0.05]">
      <div className="mb-4 text-3xl">{icon}</div>

      <h3 className="text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-400">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 font-bold text-blue-300">
        {number}
      </div>

      <h3 className="mt-5 text-xl font-semibold">{title}</h3>

      <p className="mt-3 text-slate-400">{description}</p>
    </div>
  );
      }
