import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ImportResult {
  imported: number;
  failed: number;
  errors: { item: string; error: string }[];
}

export default function ImportGear() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("archive", file);

      const res = await fetch("/api/items/import", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      const data: ImportResult = await res.json();
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Import complete",
        description: `Imported ${data.imported} item(s)${data.failed ? `, ${data.failed} failed` : ""}.`,
      });
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: (err?.message || "Could not import archive").replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Import Gear</h1>
        <p className="text-muted-foreground mb-6">
          Upload a <code className="text-sm">.zip</code> containing a{" "}
          <code className="text-sm">gear.json</code> and the referenced photo files to bulk-add items.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Upload archive</CardTitle>
            <CardDescription>
              New items default to you as the owner and "Unsorted" storage location — edit them afterward.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
              }}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />

            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Import
                </>
              )}
            </Button>

            {result && (
              <div className="rounded-md border p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Imported {result.imported} item(s)
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" /> {result.failed} failed
                  </div>
                )}
                {result.errors?.length > 0 && (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        <span className="font-medium">{e.item}</span>: {e.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
