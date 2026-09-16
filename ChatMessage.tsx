interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({
  role,
  content,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          isUser
            ? "bg-black text-white"
            : "border bg-white text-gray-800"
        }`}
      >
        {!isUser && (
          <div className="mb-2 text-xs font-semibold text-gray-500">
            Lucida AI
          </div>
        )}

        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
