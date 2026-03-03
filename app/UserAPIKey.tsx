"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export function UserAPIKey() {
  const [userAPIKey, setUserAPIKey] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from sessionStorage
  useEffect(() => {
    const storedKey = localStorage.getItem("togetherApiKey");
    if (storedKey) {
      setUserAPIKey(storedKey);
    }
  }, []);

  const validateAndSaveApiKey = async (apiKey: string) => {
    if (!apiKey) {
      localStorage.removeItem("togetherApiKey");
      return false;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("togetherApiKey", apiKey);
        toast.success("API key validated and saved!");
        return true;
      } else {
        toast.error(result.message || "Invalid API key");
        return false;
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      toast.error("Failed to validate API key. Please try again.");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserAPIKey(value);

    if (value.length === 0) {
      localStorage.removeItem("togetherApiKey");
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      validateAndSaveApiKey(value);
    }, 500);
  };

  return (
    <div className="flex gap-3">
      <div className="text-left text-xs max-md:hidden">
        <p className="text-gray-600">[Optional] Add your</p>
        <a
          href="https://api.together.xyz/settings/api-keys"
          target="_blank"
          className="text-gray-300 underline"
          rel="noopener noreferrer"
        >
          Together API Key:
        </a>
      </div>
      <div className="relative flex-1">
        <input
          type="password"
          value={userAPIKey}
          autoComplete="off"
          onChange={handleApiKeyChange}
          placeholder="API key"
          className="h-8 w-full rounded border-[0.5px] border-gray-700 bg-gray-900 px-2 text-sm focus-visible:outline focus-visible:outline-gray-200"
        />
        {isValidating && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}
