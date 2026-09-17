export default function AnalyzingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm text-gray-600">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
      </div>

      <span>Analyzing your image...</span>
    </div>
  );
    }
