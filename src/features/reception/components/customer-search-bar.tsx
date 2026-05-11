"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { customersApi } from "@/lib/api/customers";
import type { Customer } from "@/types/customer";

interface CustomerSearchBarProps {
  onSelect: (customer: Customer) => void;
  onCreateNew: (searchTerm: string) => void;
}

export function CustomerSearchBar({ onSelect, onCreateNew }: CustomerSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    customersApi
      .list({ search: debouncedQuery, limit: 8 })
      .then((data) => {
        if (!cancelled) {
          setResults(data.data ?? []);
          setOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(customer: Customer) {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(customer);
  }

  function handleCreateNew() {
    const term = query;
    setQuery("");
    setOpen(false);
    onCreateNew(term);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar por nombre, documento o teléfono..."
          className="pr-24"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            Buscando…
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full rounded-xl border bg-background shadow-lg max-h-72 overflow-y-auto">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handleSelect(c)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.firstName} {c.lastName}
                    {c.secondLastName ? ` ${c.secondLastName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.documentType} {c.document} · {c.phone1}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Seleccionar →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && debouncedQuery && !loading && results.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border bg-background shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No se encontró ningún cliente con «{debouncedQuery}».
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            + Crear cliente nuevo
          </button>
        </div>
      )}
    </div>
  );
}
