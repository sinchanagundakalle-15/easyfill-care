// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Volume2, Mic, MicOff, Download, CalendarCheck, Loader2, ScanText, Square, Type } from "lucide-react";
import { Btn, Card, DemoBadge, Input, Page, RequireAuth } from "@/components/app/ui";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/easyfill")({
  head: () => ({ meta: [{ title: "EasyFill OCR Form Assistant — HEALTH ASSIST AI" }, { name: "description", content: "Scan healthcare forms, auto-extract fields and fill them with voice and read-aloud." }, { property: "og:title", content: "EasyFill — HEALTH ASSIST AI" }, { property: "og:description", content: "Accessible OCR-based healthcare form filling." }] }),
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

const SAMPLES = [
  { title: "Patient Registration Form", text: `SANKESHWAR MISSION HOSPITAL\nPATIENT REGISTRATION FORM\nPatient Name: Sunita Ramesh Patil\nDate of Birth: 14/03/1978\nAge: 48\nGender: Female\nBlood Group: B+\nPhone: 9845012345\nInsurance ID: STAR-KA-778120\nAllergies: Penicillin, Dust\nMedical History: Type 2 diabetes, hypertension` },
  { title: "Eye Checkup Intake", text: `M M JOSHI EYE HOSPITAL\nOPD INTAKE SHEET\nName: Mahadev Kulkarni\nDOB: 02-11-1956\nAge: 69\nSex: Male\nBlood Group: O+\nMobile: 9448877665\nPolicy No: AYUSH-PMJAY-55120\nAllergies: None known\nHistory: Cataract left eye, glaucoma suspect` },
  { title: "Emergency Admission", text: `KLES DR. PRABHAKAR KORE HOSPITAL\nEMERGENCY ADMISSION FORM\nPatient Name: Arjun Desai\nDate of Birth: 21/07/2001\nAge: 25\nGender: Male\nBlood Group: A-\nContact: 9731234567\nInsurance ID: HDFC-ERGO-99231\nAllergy: Sulfa drugs\nMedical History: Asthma since childhood` },
];

function parse(text: string, baseConf: number) {
  const out: Record<string, { value: string; conf: number }> & { patientName?: { value: string; conf: number } } = {};
  const lines = text.split(/\n/);
  for (const f of FIELDS) {
    for (const ln of lines) { const m = ln.match(f.re); if (m) { out[f.key] = { value: (m[1] ?? "").trim().replace(/\s+/g, " "), conf: Math.min(99, Math.round(baseConf - Math.random() * 8)) }; break; } }
    if (!out[f.key]) out[f.key] = { value: "", conf: 0 };
  }
  if (out.patientName?.value && /hospital|form/i.test(out.patientName.value)) out.patientName = { value: "", conf: 0 };
  return out;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return toast.error("Text-to-speech is not supported in this browser");
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = "en-IN"; u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function EasyFill() {
  const large = useStore((s) => s.largeText);
  const [doc, setDoc] = useState<{ kind: "sample" | "image" | "pdf"; title: string; text?: string; url?: string } | null>(null);
  const [fields, setFields] = useState<Record<string, { value: string; conf: number }> | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listening, setListening] = useState<Key | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  useEffect(() => () => { window.speechSynthesis?.cancel(); recRef.current?.stop(); }, []);

  const runSample = (i: number) => {
    const s = SAMPLES[i];
    setDoc({ kind: "sample", title: s.title, text: s.text }); setBusy(true); setProgress(0); setFields(null);
    let p = 0; const t = setInterval(() => { p += 20; setProgress(p); if (p >= 100) { clearInterval(t); setFields(parse(s.text, 98)); setBusy(false); toast.success("Form scanned — review the extracted fields"); } }, 180);
  };

  const onFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) return toast.error("File too large (max 10 MB)");
    const url = URL.createObjectURL(file);
    setFields(null);
    if (file.type === "application/pdf") {
      setDoc({ kind: "pdf", title: file.name, url });
      setFields(parse("", 0)); toast.message("PDF loaded. Fill fields by typing or voice (OCR works best on photos/scans).");
      return;
    }
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image or PDF");
    setDoc({ kind: "image", title: file.name, url }); setBusy(true); setProgress(0);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: (m) => { if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100)); } });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setFields(parse(data.text, data.confidence || 80));
      toast.success("Text recognised — review the extracted fields");
    } catch {
      toast.error("OCR failed. You can still fill the fields manually or by voice.");
      setFields(parse("", 0));
    } finally { setBusy(false); }
  };

  const listen = (key: Key) => {
    const SR = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input needs Chrome or Edge");
    if (listening) { recRef.current?.stop(); return; }
    const r = new SR(); r.lang = "en-IN"; r.interimResults = false;
    r.onresult = (e) => { const v = e.results[0][0].transcript; setFields((f) => ({ ...f!, [key]: { value: v, conf: Math.round(e.results[0][0].confidence * 100) || 90 } })); };
    r.onend = () => setListening(null); r.onerror = () => setListening(null);
    recRef.current = r; setListening(key); speak(`Say ${FIELDS.find((f) => f.key === key)!.label}`); setTimeout(() => r.start(), 900);
  };

  const readAll = () => { if (!fields) return; speak(FIELDS.map((f) => `${f.label}: ${fields[f.key].value || "not filled"}`).join(". ")); };
  const values = () => Object.fromEntries(Object.entries(fields ?? {}).map(([k, v]) => [k, v.value]));

  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.setFillColor(15, 41, 74); pdf.rect(0, 0, 210, 28, "F");
    pdf.setTextColor(255); pdf.setFontSize(16); pdf.text("HEALTH ASSIST AI — EasyFill", 14, 17);
    pdf.setTextColor(20); pdf.setFontSize(11); pdf.text(`Source: ${doc?.title ?? ""}`, 14, 40);
    let y = 54;
    FIELDS.forEach((f) => { pdf.setFont("helvetica", "bold"); pdf.text(f.label, 14, y); pdf.setFont("helvetica", "normal"); pdf.text(pdf.splitTextToSize(fields![f.key].value || "—", 120), 70, y); y += 12; });
    pdf.setFontSize(9); pdf.setTextColor(120); pdf.text(`Generated ${new Date().toLocaleString("en-IN")}`, 14, 285);
    pdf.save("easyfill-form.pdf");
  };

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="flex items-center gap-2 text-sm font-semibold text-teal"><ScanText className="h-4 w-4" /> EasyFill</p><h1 className="text-3xl font-extrabold text-primary">OCR Form Assistant</h1><p className="text-muted-foreground">Upload a medical form or pick a sample. Review, correct by voice, then export or autofill your booking.</p></div>
        <Btn variant={large ? "primary" : "outline"} onClick={actions.toggleLargeText}><Type className="h-4 w-4" /> Large high-contrast text</Btn>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_2fr]">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/50 p-6 text-center hover:border-teal">
          <Upload className="h-8 w-8 text-teal" /><p className="mt-2 font-semibold">Upload form</p><p className="text-xs text-muted-foreground">JPG, PNG or PDF · max 10 MB</p>
          <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((s, i) => <button key={s.title} onClick={() => runSample(i)} className="rounded-2xl border bg-card p-4 text-left shadow-card hover:border-teal"><FileText className="h-6 w-6 text-primary" /><p className="mt-2 text-sm font-semibold">{s.title}</p><p className="text-xs text-muted-foreground">Sample form</p></button>)}
        </div>
      </div>

      {doc && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Original document</p><span className="text-xs text-muted-foreground">{doc.title}</span></div>
            {doc.kind === "sample" && <pre className="whitespace-pre-wrap rounded-xl border bg-muted p-6 font-mono text-sm leading-7">{doc.text}</pre>}
            {doc.kind === "image" && <img src={doc.url} alt="Uploaded form" className="w-full rounded-xl border" />}
            {doc.kind === "pdf" && <iframe src={doc.url} title="Uploaded PDF" className="h-[560px] w-full rounded-xl border" />}
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Extracted fields</p><DemoBadge /></div>
            {busy ? (
              <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-teal" /><p className="mt-3 font-medium">Reading document… {progress}%</p><div className="mx-auto mt-3 h-2 max-w-xs rounded-full bg-muted"><div className="h-2 rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} /></div></div>
            ) : fields && (
              <>
                <div className="mt-4 space-y-3">
                  {FIELDS.map((f) => { const v = fields[f.key]; return (
                    <div key={f.key}>
                      <div className="mb-1 flex items-center justify-between"><label htmlFor={f.key} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</label>
                        {v.conf > 0 && <span className={cn("rounded-full px-2 text-[11px] font-semibold", v.conf >= 90 ? "bg-success/15 text-success" : v.conf >= 75 ? "bg-warning/20 text-foreground" : "bg-destructive/10 text-destructive")}>{v.conf}% confidence</span>}</div>
                      <div className="flex gap-1.5">
                        <Input id={f.key} value={v.value} maxLength={200} onChange={(e) => setFields({ ...fields, [f.key]: { value: e.target.value, conf: 100 } })} className={cn(!v.value && "border-warning")} />
                        <button aria-label={`Read ${f.label} aloud`} onClick={() => speak(`${f.label}: ${v.value || "empty"}`)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border hover:bg-secondary"><Volume2 className="h-4 w-4" /></button>
                        <button aria-label={`Fill ${f.label} by voice`} onClick={() => listen(f.key)} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl border hover:bg-secondary", listening === f.key && "bg-destructive text-destructive-foreground")}>{listening === f.key ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
                      </div>
                    </div>); })}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Btn variant="outline" onClick={readAll}><Volume2 className="h-4 w-4" /> Read all</Btn>
                  <Btn variant="ghost" onClick={() => window.speechSynthesis.cancel()}><Square className="h-4 w-4" /> Stop</Btn>
                  <Btn variant="outline" onClick={exportPdf}><Download className="h-4 w-4" /> Export PDF</Btn>
                  <Btn variant="teal" onClick={() => { actions.setEasyfill(values()); toast.success("Saved. Use 'Autofill from EasyFill' in the booking form."); }}><CalendarCheck className="h-4 w-4" /> Use for booking</Btn>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Saved data autofills patient details at <Link to="/find" className="text-teal underline">any hospital booking</Link>.</p>
              </>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}

type SR = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: (e: { results: { 0: { transcript: string; confidence: number } }[] }) => void; onend: () => void; onerror: () => void };
