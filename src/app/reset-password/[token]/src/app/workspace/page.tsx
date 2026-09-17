"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type Analysis = {
  id: string;
  title: string;
  imageUrl: string;
  imageName?: string | null;
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  messages?: Message[];
  preview?: string;
};

export default function WorkspacePage() {
  const { data: session, status } = useSession();

  const [image, setImage] = useState<string>("");
  const [imageName, setImageName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysisId, setAnalysisId] = useState("");
  const [title, setTitle] = useState("New analysis");

  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      loadHistory();
    }
  }, [status]);

  useEffect(() => {
    const pendingImage = sessionStorage.getItem("lucida_pending_image");

    if (pendingImage) {
      try {
        const data = JSON.parse(pendingImage);

        if (data.imageDataUrl) {
          setImage(data.imageDataUrl);
          setImageName(data.imageName || "Uploaded image");
        }
      } catch {
        // Ignore invalid session storage data.
      }

      sessionStorage.removeItem("lucida_pending_image");
    }
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);

    try {
      const response = await fetch("/api/history");

      if (!response.ok) {
        setHistory([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setHistory(data);
      } else if (Array.isArray(data.analyses)) {
        setHistory(data.analyses);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be smaller than 8MB.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
        setImageName(file.name);

        if (analysisId) {
          startNewAnalysis();
        }
      }
    };

    reader.readAsDataURL(file);
  }

  function startNewAnalysis() {
    setAnalysisId("");
    setTitle("New analysis");
    setMessages([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      setError("Please describe what you want to know about the image.");
      return;
    }

    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    setError("");
    setLoading(true);

    const userPrompt = prompt.trim();

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: userPrompt,
      },
    ]);

    setPrompt("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userPrompt,
          analysisId: analysisId || undefined,
          imageDataUrl: analysisId ? undefined : image,
          imageName: analysisId ? undefined : imageName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to analyze the image.");

        setMessages((current) => current.slice(0, -1));
        setLoading(false);
        return;
      }

      setAnalysisId(data.analysisId);
      setTitle(data.title || "Image analysis");

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);

      await loadHistory();
    } catch {
      setError("Something went wrong. Please try again.");

      setMessages((current) => current.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  async function openAnalysis(id: string) {
    setError("");
    setMobileSidebar(false);

    try {
      const response = await fetch(`/api/history/${id}`);

      if (!response.ok) {
        setError("Unable to open this analysis.");
        return;
      }

      const data = await response.json();

      const analysis = data.analysis || data;

      setAnalysisId(analysis.id);
      setTitle(analysis.title || "Image analysis");
      setImage(analysis.imageUrl || "");
      setImageName(analysis.imageName || "");

      setMessages(
        Array.isArray(analysis.messages) ? analysis.messages : []
      );
    } catch {
      setError("Unable to load this analysis.");
    }
  }

  function handleNewChat() {
    setAnalysisId("");
    setTitle("New analysis");
    setImage("");
    setImageName("");
    setMessages([]);
    setPrompt("");
    setError("");
    setMobileSidebar(false);
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading workspace...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in</h1>
          <p className="mt-2 text-slate-400">
            You need an account to use the workspace.
          </p>

          <a
            href="/login"
            className="mt-6 inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold hover:bg-blue-400"
          >
            Go to Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      {/* Mobile overlay */}
      {mobileSidebar && (
        <button
          aria-label="Close sidebar"
          onClick={() => setMobileSidebar(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-slate-950 transition-transform lg:static lg:translate-x-0 ${
          mobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <a href="/" className="text-xl font-bold">
            Lucida<span className="text-blue-400"> AI</span>
          </a>

          <button
            onClick={() => setMobileSidebar(false)}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/5 lg:hidden"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold transition hover:bg-blue-400"
          >
            ＋ New analysis
          </button>
        </div>

        <div className="px-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            History
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {historyLoading ? (
            <p className="px-2 text-sm text-slate-500">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="px-2 text-sm leading-6 text-slate-500">
              Your image analyses will appear here.
            </p>
          ) : (
            <div className="space-y-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openAnalysis(item.id)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition hover:bg-white/5 ${
                    analysisId === item.id ? "bg-white/10" : ""
                  }`}
                >
                  <p className="truncate text-sm font-medium text-slate-200">
                    {item.title || "Image analysis"}
                  </p>

                  {item.preview && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.preview}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 truncate text-xs text-slate-500">
            {session?.user?.email}
          </div>

          <a
            href="/settings"
            className="mb-2 block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            ⚙ Settings
          </a>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            ↪ Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileSidebar(true)}
              className="rounded-lg px-2 py-1 text-xl text-slate-300 hover:bg-white/5 lg:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {title}
              </p>

              <p className="text-xs text-slate-500">
                Visual Intelligence Workspace
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs text-emerald-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            AI online
          </div>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
            {messages.length === 0 ? (
              <div className="py-8 text-center sm:py-16">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-3xl">
                  ✦
                </div>

                <h1 className="text-3xl font-bold sm:text-4xl">
                  Analyze your image
                </h1>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                  Upload an image and tell Lucida exactly what you want to
                  identify, extract, explain, translate, or understand.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={`${message.id || "message"}-${index}`}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "border border-white/10 bg-white/[0.04] text-slate-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
                      Lucida is analyzing<span className="animate-pulse">...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Image preview */}
            {image && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="truncate text-sm text-slate-300">
                    {imageName || "Uploaded image"}
                  </span>

                  <button
                    onClick={() => {
                      setImage("");
                      setImageName("");
                    }}
                    className="text-xs text-slate-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex max-h-[420px] justify-center bg-black/20 p-3">
                  <img
                    src={image}
                    alt={imageName || "Uploaded image"}
                    className="max-h-[390px] max-w-full rounded-xl object-contain"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-4xl"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 focus-within:border-blue-400/50">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={
                  image
                    ? "What would you like to know about this image?"
                    : "Upload an image first, then ask a question..."
                }
                rows={3}
                disabled={loading}
                className="w-full resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
              />

              <div className="flex items-center justify-between gap-2 px-2 pb-1">
                <label className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5">
                  📎 Upload image

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading || !prompt.trim() || !image}
                  className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Analyzing..." : "Analyze →"}
                </button>
              </div>
            </div>

            <p className="mt-2 text-center text-[11px] text-slate-600">
              Lucida analyzes only the image and information provided in the
              conversation.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
    }
