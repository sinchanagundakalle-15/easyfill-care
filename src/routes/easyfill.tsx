import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Volume2, Mic, MicOff, Download, CalendarCheck, Loader2, ScanText, Square, Type, FileText } from "lucide-react";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { Btn, Card, Input, Page, RequireAuth } from "@/components/app/ui";
import { useAppUser } from "@/lib/cloud-user";
import { getPrivateHealthData, savePrivateEasyFillData } from "@/lib/private-health.functions";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/easyfill")({
  head: () => ({ meta: [
    { title: "EasyFill OCR Form Assistant — HEALTH ASSIST AI" },
    { name: "description", content: "Read your uploaded medical forms and review accessible, editable fields." },
    { property: "og:title", content: "EasyFill OCR Form Assistant — HEALTH ASSIST AI" },
    { property: "og:description", content: "Private OCR form filling from your uploaded documents." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <RequireAuth><EasyFill /></RequireAuth>,
});

const FIELDS = [
  { key: "patientName", label: "Patient Name", re: /(?:patient\s*name|name)\s*[:\-]\s*(.+)/i },
  { key: "dob", label: "Date of Birth", re: /(?:d\.?o\.?b|date\s*of\s*birth)\s*[:\-]\s*(.+)/i },
  { key: "age", label: "Age", re: /\bage\s*[:\-]\s*(\d{1,3})/i },
  { key: "gender", label: "Gender", re: /(?:gender|sex)\s*[:\-]\s*(\w+)/i },
  { key: "bloodGroup", label: "Blood Group", re: /blood\s*(?:group)?\s*[:\-]\s*([ABO]{1,2}\s*[+\-]|[ABO]{1,2}\s*(?:positive|negative|\+ve|-ve))/i },
  { key: "phone", label: "Phone", re: /(?:phone|mobile|contact)\s*[:\-]\s*([\d\s+]{10,14})/i },
  { key: "insuranceId", label: "Insurance ID", re: /(?:insurance|policy)\s*(?:id|no\.?|number)?\s*[:\-]\s*([A-Z0-9\-\/]+)/i },
  { key: "allergies", label: "Allergies", re: /allerg(?:y|ies)\s*[:\-]\s*(.+)/i },
  { key: "medicalHistory", label: "Medical History", re: /(?:medical\s*history|history|past\s*illness)\s*[:\-]\s*(.+)/i },
] as const;
type Key = (typeof FIELDS)[number]["key"];
type FieldValue = { value: string; conf: number };
type FieldSet = Record<Key, FieldValue>;
type SR = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: (e: { results: { 0: { transcript: string; confidence: number } }[] }) => void; onend: () => void; onerror: () => void };
type DocumentView = { title: string; kind: "image" | "pdf"; url: string };

function blankFields(): FieldSet {
  return Object.fromEntries(FIELDS.map((field) => [field.key, { value: "", conf: 0 }])) as FieldSet;
}

function parseDocument(text: string, confidence: number): FieldSet {
  const lines = text.split(/\n/);
  const values = blankFields();
  for (const field of FIELDS) {
    const line = lines.find((item) => item.match(field.re));
    const match = line?.match(field.re);
    const value = (match?.[1] ?? "").trim().replace(/\s+/g, " ");
    values[field.key] = { value: /hospital|form/i.test(value) && field.key === "patientName" ? "" : value, conf: value ? Math.max(0, Math.min(100, Math.round(confidence))) : 0 };
  }
  return values;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) { toast.error("Text-to-speech is not supported in this browser"); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

async function readPdf(file: File, setProgress: (value: number) => void) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  if (pdf.numPages > 12) throw new Error("For privacy and speed, upload a PDF with 12 pages or fewer.");
  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string }>;
    pageTexts.push(items.map((item) => item.str ?? "").join(" "));
    setProgress(Math.round((pageNumber / pdf.numPages) * 25));
  }
  const extractedText = pageTexts.join("\n");
  if (extractedText.replace(/\s/g, "").length > 20) return { text: extractedText, confidence: 0 };

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const recognized: string[] = [];
    const confidences: number[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const canvasContext = canvas.getContext("2d");
      if (!canvasContext) throw new Error("This browser could not prepare the PDF page for reading.");
      await page.render({ canvasContext, viewport }).promise;
      const result = await worker.recognize(canvas);
      recognized.push(result.data.text);
      confidences.push(result.data.confidence);
      setProgress(25 + Math.round((pageNumber / pdf.numPages) * 75));
      canvas.width = 0;
      canvas.height = 0;
    }
    const averageConfidence = confidences.reduce((sum, confidence) => sum + confidence, 0) / Math.max(1, confidences.length);
    return { text: recognized.join("\n"), confidence: averageConfidence };
  } finally {
    await worker.terminate();
  }
}

function EasyFill() {
  const user = useAppUser().user;
  const large = useStore((state) => state.largeText);
  const queryClient = useQueryClient();
  const getPrivateData = useServerFn(getPrivateHealthData);
  const savePrivateData = useServerFn(savePrivateEasyFillData);
  const savedQuery = useQuery({ queryKey: ["private-health", user?.id], queryFn: getPrivateData, enabled: !!user?.isCloud });
  const savedFields = savedQuery.data?.easyfillFields;
  const [doc, setDoc] = useState<DocumentView | null>(null);
  const [fields, setFields] = useState<FieldSet | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listening, setListening] = useState<Key | null>(null);
  const recRef = useRef<SR | null>(null);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    recRef.current?.stop();
  }, []);
  useEffect(() => () => {
    if (doc?.url) URL.revokeObjectURL(doc.url);
  }, [doc?.url]);

  const onFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10 MB)"); return; }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf && !file.type.startsWith("image/")) { toast.error("Please upload an image or PDF"); return; }
    const url = URL.createObjectURL(file);
    setDoc({ kind: isPdf ? "pdf" : "image", title: file.name, url });
    setFields(null);
    setBusy(true);
    setProgress(0);
    try {
      let text = "";
      let confidence = 0;
      if (isPdf) {
        const result = await readPdf(file, setProgress);
        text = result.text;
        confidence = result.confidence;
      } else {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng", 1, { logger: (message) => { if (message.status === "recognizing text") setProgress(Math.round(message.progress * 100)); } });
        try {
          const result = await worker.recognize(file);
          text = result.data.text;
          confidence = result.data.confidence;
        } finally { await worker.terminate(); }
      }
      setFields(parseDocument(text, confidence));
      toast.success("Document read. Review and confirm every field before saving.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Document reading failed. You can still enter each field yourself.");
      setFields(blankFields());
    } finally { setBusy(false); }
  };

  const listen = (key: Key) => {
    const browser = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition) { toast.error("Voice input needs Chrome or Edge"); return; }
    if (listening) { recRef.current?.stop(); return; }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const first = event.results[0]?.[0];
      if (!first) return;
      setFields((current) => current ? { ...current, [key]: { value: first.transcript, conf: Math.round(first.confidence * 100) } } : current);
    };
    recognition.onend = () => setListening(null);
    recognition.onerror = () => setListening(null);
    recRef.current = recognition;
    setListening(key);
    const field = FIELDS.find((item) => item.key === key);
    if (field) speak(`Say ${field.label}`);
    window.setTimeout(() => recognition.start(), 900);
  };

  const readAll = () => {
    if (!fields) return;
    speak(FIELDS.map((field) => `${field.label}: ${fields[field.key].value || "not filled"}`).join(". "));
  };
  const values = () => Object.fromEntries(FIELDS.map((field) => [field.key, fields?.[field.key].value ?? ""]));

  const exportPdf = async () => {
    if (!fields) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.setFillColor(15, 41, 74); pdf.rect(0, 0, 210, 28, "F");
    pdf.setTextColor(255); pdf.setFontSize(16); pdf.text("HEALTH ASSIST AI — EasyFill", 14, 17);
    pdf.setTextColor(20); pdf.setFontSize(11); pdf.text(`Source: ${doc?.title ?? "Manually entered details"}`, 14, 40);
    let y = 54;
    for (const field of FIELDS) {
      if (y > 265) { pdf.addPage(); y = 20; }
      pdf.setFont("helvetica", "bold"); pdf.text(field.label, 14, y);
      pdf.setFont("helvetica", "normal"); pdf.text(pdf.splitTextToSize(fields[field.key].value || "—", 120), 70, y);
      y += 12;
    }
    pdf.setFontSize(9); pdf.setTextColor(120); pdf.text(`Generated ${new Date().toLocaleString("en-IN")}`, 14, 285);
    pdf.save("easyfill-form.pdf");
  };

  const saveForBooking = async () => {
    if (!fields) return;
    const confirmedFields = values();
    try {
      if (user?.isCloud) {
        await savePrivateData({ data: { fields: confirmedFields } });
        await queryClient.invalidateQueries({ queryKey: ["private-health", user.id] });
      } else {
        actions.setEasyfill(confirmedFields);
      }
      toast.success("Confirmed details saved for your next booking.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save confirmed details.");
    }
  };

  const loadSavedFields = () => {
    if (!savedFields) return;
    const restored = blankFields();
    for (const field of FIELDS) restored[field.key] = { value: savedFields[field.key] ?? "", conf: 0 };
    setDoc(null);
    setFields(restored);
  };

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="flex items-center gap-2 text-sm font-semibold text-teal"><ScanText className="h-4 w-4" /> EasyFill</p><h1 className="text-3xl font-extrabold text-primary">OCR Form Assistant</h1><p className="text-muted-foreground">Upload a medical form, review and correct each field, then export or save your confirmed details for booking.</p></div>
        <Btn variant={large ? "primary" : "outline"} onClick={actions.toggleLargeText}><Type className="h-4 w-4" /> Large high-contrast text</Btn>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_2fr]">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-6 text-center hover:border-teal">
          <Upload className="h-8 w-8 text-teal" /><p className="mt-2 font-semibold">Upload your form</p><p className="text-xs text-muted-foreground">JPG, PNG or PDF · max 10 MB</p>
          <input type="file" accept="image/*,application/pdf,.pdf" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onFile(file); event.currentTarget.value = ""; }} />
        </label>
        <Card className="flex items-center gap-3 p-5"><FileText className="h-6 w-6 shrink-0 text-teal" /><p className="text-sm text-muted-foreground">Images and PDFs are read in this browser. Your document itself is not uploaded to the app database. No sample people or pre-filled patient details are used.</p></Card>
      </div>

      {user?.isCloud && savedFields && <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm">Previously confirmed details are saved privately to your account.</p><Btn size="sm" variant="outline" onClick={loadSavedFields}>Load saved details</Btn></Card>}

      {doc && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2"><p className="text-sm font-semibold">Original document</p><span className="truncate text-xs text-muted-foreground">{doc.title}</span></div>
            {doc.kind === "image" ? <img src={doc.url} alt="Uploaded medical form" className="max-h-[720px] w-full rounded-lg border object-contain" /> : <iframe src={doc.url} title="Uploaded PDF" className="h-[560px] w-full rounded-lg border" />}
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Extracted fields</p><span className="text-xs text-muted-foreground">Check before saving</span></div>
            {busy ? <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-teal" /><p className="mt-3 font-medium">Reading document… {progress}%</p><div className="mx-auto mt-3 h-2 max-w-xs rounded-full bg-muted"><div className="h-2 rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} /></div></div> : fields && <>
              <div className="mt-4 space-y-3">{FIELDS.map((field) => {
                const value = fields[field.key];
                return <div key={field.key}><div className="mb-1 flex items-center justify-between"><label htmlFor={field.key} className="text-xs font-semibold uppercase text-muted-foreground">{field.label}</label><span className="text-[11px] text-muted-foreground">{value.conf > 0 ? `${value.conf}% OCR confidence` : value.value ? "Text extracted · not scored" : "Not detected"}</span></div><div className="flex gap-1.5"><Input id={field.key} value={value.value} maxLength={200} onChange={(event) => setFields({ ...fields, [field.key]: { value: event.target.value, conf: 0 } })} className={cn(!value.value && "border-warning")} /><button type="button" aria-label={`Read ${field.label} aloud`} onClick={() => speak(`${field.label}: ${value.value || "empty"}`)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border hover:bg-secondary"><Volume2 className="h-4 w-4" /></button><button type="button" aria-label={`Fill ${field.label} by voice`} onClick={() => listen(field.key)} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg border hover:bg-secondary", listening === field.key && "bg-destructive text-destructive-foreground")}>{listening === field.key ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button></div></div>;
              })}</div>
              <div className="mt-6 flex flex-wrap gap-2"><Btn variant="outline" onClick={readAll}><Volume2 className="h-4 w-4" /> Read all</Btn><Btn variant="ghost" onClick={() => window.speechSynthesis.cancel()}><Square className="h-4 w-4" /> Stop</Btn><Btn variant="outline" onClick={() => void exportPdf()}><Download className="h-4 w-4" /> Export PDF</Btn><Btn variant="teal" onClick={() => void saveForBooking()}><CalendarCheck className="h-4 w-4" /> Save confirmed details</Btn></div>
              <p className="mt-3 text-xs text-muted-foreground">Saved details can autofill the patient section during booking. Review them there before confirming an appointment.</p>
            </>}
          </Card>
        </div>
      )}
      {fields && !doc && <Card className="mt-6 p-5"><div className="flex items-center justify-between gap-3"><p className="font-semibold">Saved patient details</p><span className="text-xs text-muted-foreground">Review and correct these values</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{FIELDS.map((field) => <div key={field.key}><label htmlFor={`saved-${field.key}`} className="text-xs font-semibold uppercase text-muted-foreground">{field.label}</label><Input id={`saved-${field.key}`} value={fields[field.key].value} onChange={(event) => setFields({ ...fields, [field.key]: { value: event.target.value, conf: 0 } })} /></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><Btn variant="outline" onClick={() => void exportPdf()}><Download className="h-4 w-4" /> Export PDF</Btn><Btn variant="teal" onClick={() => void saveForBooking()}><CalendarCheck className="h-4 w-4" /> Save confirmed details</Btn></div></Card>}
      {!doc && !fields && <p className="mt-6 text-sm text-muted-foreground"><Link to="/book/$hospitalId" params={{ hospitalId: "sankeshwar-mission" }} className="text-teal underline">Return to appointment booking</Link></p>}
    </Page>
  );
}
