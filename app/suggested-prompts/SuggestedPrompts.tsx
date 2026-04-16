import { useEffect, useState } from "react";

const shimmer = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

async function compressImage(
  url: string,
  maxWidth: number = 300,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = maxWidth / img.width;
      const width = maxWidth;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with 0.8 quality for smaller size
      const compressedUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve(compressedUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export function SuggestedPrompts({
  imageUrl,
  onSelect,
}: {
  imageUrl: string;
  onSelect: (v: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestions() {
      setLoading(true);
      try {
        // Compress image before sending
        const compressedUrl = await compressImage(imageUrl, 300);

        const headers: HeadersInit = {};
        const apiKey = localStorage.getItem("togetherApiKey");
        if (apiKey) {
          headers["x-api-key"] = apiKey;
        }

        const res = await fetch(
          `/api/suggested-prompts?imageUrl=${encodeURIComponent(compressedUrl)}`,
          { headers },
        );
        const data = await res.json();

        if (!cancelled) {
          setSuggestions(data.suggestions ?? []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <div className="p-2 md:p-4">
      <style>{shimmer}</style>

      {loading || suggestions === null ? (
        <div className="grid grid-cols-3 gap-2 pb-4">
          {Array.from(Array(3).keys()).map((i) => (
            <div
              className="h-9 w-full animate-[shimmer_4.5s_infinite_linear] rounded-md bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] bg-[length:400%_100%]"
              key={i}
            />
          ))}
        </div>
      ) : (
        <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-4 md:-mx-4 md:px-4">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(suggestion)}
              className="shrink-0 rounded-md bg-gray-800 px-3 py-2 text-left text-sm transition enabled:cursor-pointer enabled:hover:bg-gray-700 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
