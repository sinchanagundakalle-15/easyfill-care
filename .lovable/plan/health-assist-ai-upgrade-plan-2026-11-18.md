# HEALTH ASSIST AI upgrade plan

## Goal
Upgrade the existing application in place, preserve its current design and demo workflows, and avoid presenting unverified healthcare, appointment, OCR, or scheme information as real.

## Work
1. **Secure accounts and private data:** Use Lovable Cloud email/password, Google, and Lovable sign-in; retain name and phone in a private profile. Keep existing browser demo accounts/data clearly separate, since local passwords and records cannot be safely converted into secure accounts. Put period history, preferences, and confirmed EasyFill values behind account-level access rules.
2. **Correct EasyFill:** Remove sample forms and all canned OCR values. Read uploaded images and PDFs; identify a matching patient, prescription, or health-history form; show original text, extracted fields, and “Not detected” blanks; let users correct results and confirm before private saving or booking autofill.
3. **India-wide hospital discovery:** Connect Google Maps Platform for bounded, signed-in live hospital searches by location or terms; show returned address, contact, website, rating, and distance only when supplied. Keep the existing seeded catalogue identifiable as demo data. Do not invent departments, fees, emergency services, doctors, or live slots; offer official site/contact links when provider booking availability is absent.
4. **Government Schemes:** Add a separate navigation page with official-source links and an eligibility checker limited to criteria that can be verified from official scheme pages. Clearly show sources and verification dates; direct users to myScheme for broader central/state/UT discovery rather than imply an exhaustive verified catalogue.
5. **Period Tracker:** Add private date history, editable cycle preferences, irregular-cycle estimates, calendar, record deletion, and optional browser reminders. Predictions remain estimates, not diagnoses; browser notifications can only be delivered while the app is open unless a separate delivery provider is configured.
6. **Preserve and integrate:** Add navigation and page metadata in the existing TanStack structure; retain current comparison, recommendation, emergency, admin, appointment history, accessibility, and demo experiences while separating demo data from live results.
7. **Verify:** Test cycle calculations, private-data ownership, OCR missing-field behavior, official-link/source rendering, and key existing app flows; inspect preview/build diagnostics and commit the completed changes.

## Technical approach
- Use generated Lovable Cloud clients, authenticated server functions, and owner-only row policies for private records.
- Use Google Maps Platform Places API through its server-side connector, with bounded search requests; do not call Places directly from the browser.
- Keep OCR/document rendering in the browser and only persist user-confirmed extracted fields.
- Do not migrate legacy browser-stored credentials or claim that local demo appointments are live reservations.

## External setup and limits
- Cloud account access and private-record tables are now enabled. Google Maps Platform still requires the user to complete the connection card before live discovery can call it.
- No hospital booking provider is connected; official hospital contact/booking links replace live-slot claims.
- No official all-India scheme data feed is configured; only verified scheme criteria will be scored in-app, with myScheme as the official broader directory.