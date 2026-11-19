import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, FileCheck2, Info, Search, ShieldCheck } from "lucide-react";
import { Btn, Card, Input, Label, Page } from "@/components/app/ui";

export const Route = createFileRoute("/schemes")({
  head: () => ({ meta: [
    { title: "Government Healthcare Schemes — HEALTH ASSIST AI" },
    { name: "description", content: "Explore official Indian government healthcare scheme sources and review eligibility." },
    { property: "og:title", content: "Government Healthcare Schemes — HEALTH ASSIST AI" },
    { property: "og:description", content: "Official scheme information and careful eligibility guidance." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SchemesPage,
});

const VERIFIED_ON = "17 November 2026";
const officialDirectory = "https://www.myscheme.gov.in/";
const schemes = [{
  id: "pmmvy",
  name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
  region: "Central government · India",
  description: "Maternity benefit support for eligible pregnant women and lactating mothers. The official page describes benefits for the first living child and, subject to the programme rules, a second child when the child is a girl.",
  criteria: "Pregnancy or lactation and the applicable beneficiary/category requirements must be confirmed on the official scheme page. This checker does not infer income or occupation eligibility where the published rules need further review.",
  documents: "Check the official page for current required documents and application procedure.",
  url: "https://www.myscheme.gov.in/schemes/pmmvy",
  source: "myScheme · Ministry of Women and Child Development",
  tags: "maternity pregnancy women child central",
}];

function SchemesPage() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [category, setCategory] = useState("");
  const [occupation, setOccupation] = useState("");
  const [pregnantOrLactating, setPregnantOrLactating] = useState("");
  const [childNumber, setChildNumber] = useState("");
  const [checked, setChecked] = useState(false);
  const visible = useMemo(() => schemes.filter((scheme) => `${scheme.name} ${scheme.region} ${scheme.description} ${scheme.tags}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const categoryText = [state, age && `${age} years`, income && `₹${Number(income).toLocaleString("en-IN")} family income`, occupation, category].filter(Boolean).join(" · ");

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-teal">Official-source guide</p><h1 className="text-3xl font-extrabold text-primary">Government Schemes</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Explore healthcare support from verified official pages. This selection is not an exhaustive list of every state or union territory scheme.</p></div><a href={officialDirectory} target="_blank" rel="noreferrer"><Btn variant="outline"><ExternalLink className="h-4 w-4" /> Browse myScheme</Btn></a></div>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-teal" /><div><h2 className="font-bold">Eligibility review</h2><p className="text-xs text-muted-foreground">Your answers stay in this page and are not saved.</p></div></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><Label htmlFor="scheme-state">State or union territory</Label><Input id="scheme-state" value={state} onChange={(event) => setState(event.target.value)} placeholder="Enter your state" /></div>
          <div><Label htmlFor="scheme-age">Age</Label><Input id="scheme-age" type="number" min="0" max="120" value={age} onChange={(event) => setAge(event.target.value)} placeholder="Years" /></div>
          <div><Label htmlFor="scheme-income">Annual family income</Label><Input id="scheme-income" type="number" min="0" value={income} onChange={(event) => setIncome(event.target.value)} placeholder="₹" /></div>
          <div><Label htmlFor="scheme-occupation">Occupation</Label><Input id="scheme-occupation" value={occupation} onChange={(event) => setOccupation(event.target.value)} placeholder="Optional" /></div>
          <div><Label htmlFor="scheme-category">Beneficiary category</Label><Input id="scheme-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="As shown in official documents" /></div>
          <div><Label htmlFor="scheme-pregnancy">Pregnant or lactating?</Label><select id="scheme-pregnancy" value={pregnantOrLactating} onChange={(event) => setPregnantOrLactating(event.target.value)} className="h-11 w-full rounded-xl border bg-card px-3 text-sm"><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select></div>
          <div><Label htmlFor="scheme-child">Which living child?</Label><select id="scheme-child" value={childNumber} onChange={(event) => setChildNumber(event.target.value)} className="h-11 w-full rounded-xl border bg-card px-3 text-sm"><option value="">Choose</option><option value="1">First child</option><option value="2">Second child</option><option value="other">Another child</option></select></div>
        </div>
        <Btn className="mt-5" onClick={() => setChecked(true)}>Review matching guidance</Btn>
      </Card>

      {checked && <Card className="mt-5 border-l-4 border-l-warning p-5"><h2 className="font-bold">Potentially eligible · confirmation required</h2><p className="mt-2 text-sm text-muted-foreground">{pregnantOrLactating === "no" ? "Your answer does not match the scheme’s stated pregnant or lactating beneficiary group." : "Your answers are not enough to confirm eligibility. The scheme page lists beneficiary-category rules that must be checked against your official documents."} {childNumber === "other" ? "The scheme page describes benefits for the first living child and specific second-child cases." : "Only the official scheme authority can confirm your eligibility."}</p>{categoryText && <p className="mt-2 text-xs text-muted-foreground">Answers checked: {categoryText}</p>}</Card>}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-bold">Verified scheme pages</h2><p className="text-sm text-muted-foreground">Source checked {VERIFIED_ON} · Confirm current rules before applying.</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search schemes" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search schemes" /></div></div>
      <div className="mt-4 space-y-4">{visible.map((scheme) => <Card key={scheme.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-teal">{scheme.region}</p><h3 className="mt-1 text-lg font-bold">{scheme.name}</h3></div><span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Source checked</span></div><p className="mt-3 text-sm">{scheme.description}</p><div className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><p className="font-semibold">Eligibility</p><p className="mt-1 text-muted-foreground">{scheme.criteria}</p></div><div><p className="font-semibold">Documents and process</p><p className="mt-1 text-muted-foreground">{scheme.documents}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="flex items-center gap-2 text-xs text-muted-foreground"><FileCheck2 className="h-4 w-4" /> Source: {scheme.source} · checked {VERIFIED_ON}</p><a href={scheme.url} target="_blank" rel="noreferrer"><Btn size="sm" variant="outline">Official details <ExternalLink className="h-3.5 w-3.5" /></Btn></a></div></Card>)}{visible.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No verified pages match that search. Try the official myScheme directory.</Card>}</div>
      <Card className="mt-5 flex items-start gap-3 p-4 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" /><p>For state and union-territory schemes not listed here, use the official myScheme directory, which includes central and state/UT programmes. This page does not store your answers or submit applications.</p></Card>
    </Page>
  );
}