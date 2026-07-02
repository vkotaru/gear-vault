import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Suggestion {
  label: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Address input with autocomplete backed by /api/geocode (OpenStreetMap).
 * Debounces requests and shows a suggestions dropdown; selecting one fills
 * the field with the full address.
 */
export default function AddressAutocomplete({ value, onChange, placeholder }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Skip the lookup triggered by our own onChange right after a selection.
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const query = (value || "").trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data: Suggestion[] = await res.json();
          setSuggestions(data);
          setOpen(data.length > 0);
        }
      } catch {
        /* ignore lookup errors — the field still accepts free text */
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  const select = (s: Suggestion) => {
    skipNext.current = true;
    onChange(s.label);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lon}-${i}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                // Prevent the input's blur from firing before the click.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
