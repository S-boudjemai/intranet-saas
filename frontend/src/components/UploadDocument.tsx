// src/components/UploadDocument.tsx
import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

// --- ICÔNES SVG ---
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
// --- FIN ICÔNES SVG ---

export interface UploadDocumentProps {
  tenant_id: string;
  categoryId?: string;
  onUploadSuccess: () => Promise<void>;
}

export default function UploadDocument({
  tenant_id,
  categoryId,
  onUploadSuccess,
}: UploadDocumentProps) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !token) {
      setStatus("Erreur : Le nom et le fichier sont obligatoires.");
      return;
    }

    setLoading(true);
    setStatus("Envoi en cours...");
    try {
      const safeName = encodeURIComponent(file.name);
      const mimetype = file.type;
      const res1 = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/documents/upload-url?filename=${safeName}&mimetype=${mimetype}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res1.ok) throw new Error("URL S3 impossible");
      const response1 = await res1.json();
      console.log('🔍 Upload URL response:', response1);
      const { url: uploadUrl } = response1.data || response1;

      const res2 = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimetype },
        body: file,
      });
      if (!res2.ok) throw new Error("Échec upload S3");

      // Construire l'URL publique du fichier uploadé sur S3
      const fileUrl = `https://${import.meta.env.VITE_AWS_S3_BUCKET || 'internet-saas'}.s3.${import.meta.env.VITE_AWS_REGION || 'us-east-1'}.amazonaws.com/${safeName}`;

      const documentData = {
        name,
        url: fileUrl,
        tenant_id,
        ...(categoryId ? { categoryId } : {}),
      };
      
      console.log('📄 Sending document data:', documentData);
      
      const res3 = await fetch(`${import.meta.env.VITE_API_URL}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(documentData),
      });
      if (!res3.ok) throw new Error("Impossible d’enregistrer");

      setStatus("✅ Document enregistré !");
      setFile(null);
      setName("");
      if (inputRef.current) inputRef.current.value = "";
      await onUploadSuccess();
    } catch (err: any) {
      setStatus("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const inputClasses = `bg-input border border-border rounded-md w-full p-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all`;

  return (
    <form
      onSubmit={handleUpload}
      className="p-6 bg-card border border-border rounded-lg space-y-6"
    >
      <h2 className="text-xl font-bold text-card-foreground">
        Envoyer un nouveau document
      </h2>

      <div>
        <label
          htmlFor="doc-name"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Nom du document
        </label>
        <input
          id="doc-name"
          type="text"
          className={inputClasses}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Facture Juillet 2025"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Fichier
        </label>
        {!file ? (
          <label
            htmlFor="file-upload"
            className="relative block w-full border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary transition-colors"
          >
            <UploadIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <span className="mt-2 block text-sm font-semibold text-muted-foreground">
              Cliquez pour choisir un fichier
            </span>
            <input
              id="file-upload"
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setName(
                    e.target.files[0].name.split(".").slice(0, -1).join(".")
                  );
                }
              }}
            />
          </label>
        ) : (
          <div className="bg-secondary border border-border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-secondary-foreground truncate">
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
          disabled={!file || !name || loading}
        >
          <span>{loading ? "Envoi..." : "Envoyer le document"}</span>
        </button>
      </div>

      {status && (
        <p
          className={`text-sm font-medium text-center p-3 rounded-md
            ${status.includes("✅") ? "bg-primary/10 text-primary" : ""}
            ${
              status.includes("Erreur")
                ? "bg-destructive/10 text-destructive"
                : ""
            }
            ${
              status.includes("en cours")
                ? "bg-secondary text-secondary-foreground animate-pulse"
                : ""
            }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}
