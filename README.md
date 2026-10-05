# Health Assist AI

Build a polished, functional final-year engineering project called:

# HEALTH ASSIST AI
Main title: Hospital Service Comparison & EasyFill
Tagline: "Find nearby healthcare services. Compare. Book. Fill with ease."

Use HEALTH ASSIST AI consistently throughout the application wherever the product/application name is displayed (do not use CareCompare + EasyFill).

This is a unified healthcare web application combining:
1. Hospital Service Comparison
2. EasyFill — an accessible OCR-based healthcare form-filling system

MAIN USER FLOW:
LOGIN ↓ LOCATION PERMISSION ↓ SEARCH HEALTHCARE SERVICE ↓ NEARBY HOSPITALS ↓ MAP ↓ PRICE + RATING + DISTANCE + AVAILABLE SLOT ↓ HOSPITAL DETAILS ↓ DOCTOR ↓ APPOINTMENT BOOKING ↓ EASYFILL ↓ OCR FORM ↓ ACCESSIBLE FORM FILLING

HOSPITAL DATABASE & SEED DATA:
Create the seeded/demo hospital database using ONLY the following 13 hospitals:
Sankeshwar:
1. Sankeshwar Mission Hospital (City: Sankeshwar, Karnataka, 591313, Rating: 4.5, Reviews: 29, Type: General Hospital)
2. Shidalali Multi-Speciality Hospital (City: Sankeshwar, Karnataka, 591313, Rating: 4.8, Reviews: 26, Type: Multi-Speciality Hospital)
3. Vivekananda Speciality Hospital (Vivekananda Hospital) (City: Sankeshwar, Karnataka, 591313, Rating: 4.4, Reviews: 38, Type: Speciality Hospital)
4. Rukmini Multispeciality Hospital (City: Sankeshwar, Karnataka, 591313, Rating: 4.2, Reviews: 42, Type: Multi-Speciality Hospital)
5. Patil Care Hospital (City: Sankeshwar, Karnataka, 591313, Rating: 4.4, Reviews: 14, Type: Hospital)
6. M M Joshi Eye Hospital (City: Sankeshwar, Karnataka, 591313, Rating: 5.0, Reviews: 920, Type: Eye Care Center)
7. SBSS Krishna Ayurvedic Medical College & Hospital (City: Sankeshwar, Karnataka, 591313, Rating: 4.5, Reviews: 78, Type: Ayurvedic Hospital)
8. Banashankari Hospital (City: Sankeshwar, Karnataka, 591313, Rating: 4.6, Reviews: 16, Type: Hospital)

Belagavi / Belgaum:
9. Apoorva Multispeciality Hospital (City: Belagavi / Belgaum, Karnataka, 590001, Type: Multi-Speciality Hospital)
10. KLES Dr. Prabhakar Kore Hospital & Medical Research Centre (City: Belagavi / Belgaum, Karnataka, 590001, Type: Tertiary Multi-Speciality Hospital)
11. KLE Cancer Hospital (City: Belagavi / Belgaum, Karnataka, 590001, Type: Cancer Hospital)
12. Dakshata Hospital Pvt Ltd (City: Belagavi / Belgaum, Karnataka, 590001, Location: Khanapur Road, Tilakwadi, Type: Private Hospital)
13. Mahatma Gandhi Cancer Hospital (City: Belagavi / Belgaum, Karnataka, 590001, Type: Cancer Hospital)

IMPORTANT SEARCH & DATABASE BEHAVIOR:
- The UI must look like a normal healthcare search application. Do NOT show any banner or restriction saying "Only Hospitals from Sankeshwar" or "Restricted Database".
- Location input is unrestricted: allows browser geolocation API (with graceful fallback for denial), manual city, area, or pincode (Belagavi, Sankeshwar, Bengaluru, Mumbai, Pune, Delhi, etc.).
- Calculate real distance between user's selected/current location and the 13 seeded hospitals.
- If user searches a city outside the seeded database (e.g., Bengaluru), show an empty state: "No hospitals found for this location in the current database." Do NOT fetch external hospitals.
- Associate realistic demo data across the 13 hospitals: 20+ healthcare services (OPD, Emergency, ICU, MRI, X-Ray, Blood Test, ECG, CT Scan, Dental, Eye Checkup, etc.), 15+ doctors with specialties and timings, pricing, ratings, and real-time appointment slots. Clearly label as "Demo Data".

CORE FEATURES TO IMPLEMENT:
1. Landing Page: Hero, search preview, feature cards, testimonials, quick access.
2. Authentication: Sign up, login, demo login, session management, dashboard protection.
3. Location Access: Real browser navigator.geolocation prompt with fallback to manual search (city/pincode).
4. Interactive Map & List: Leaflet / OpenStreetMap or interactive map showing hospitals and user location with pins, radius, distance markers.
5. Search & Filters: Search by service, specialty, hospital name, distance, price range, rating, open slots.
6. Comparison Tool: Side-by-side comparison of up to 3 hospitals across price, rating, distance, availability, and facilities.
7. Hospital Details & Doctors: Full profile, photos, services with transparent prices, doctors list, schedule.
8. Appointment Booking: Step-by-step booking flow (select doctor/service, date, time slot, patient details, confirmation modal, booking reference ID, cancellation/reschedule, calendar view in "My Appointments").
9. EasyFill OCR Form Assistant:
   - Upload patient forms / medical forms (image or PDF) or pick pre-loaded sample forms.
   - Client-side / mock OCR engine that parses fields (Patient Name, DOB, Age, Gender, Blood Group, Insurance ID, Allergies, Medical History).
   - Side-by-side view: original uploaded document on one side, parsed editable form fields on the other with confidence scores.
   - Accessibility & Voice: text-to-speech reading form fields out loud, large high-contrast text mode, voice input / speech recognition for filling or correcting fields.
   - One-click export to PDF or autofill into hospital appointment booking.
10. Simple ML Demonstration: Estimated wait-time prediction badge or triage urgency score based on symptoms/time of day.
11. Admin / Hospital Dashboard: View and manage the 13 hospital records, services, pricing, and booked appointments.

DESIGN & POLISH:
Premium healthcare tech aesthetic: clean white and deep navy/slate blue (#0F294A), clean teal/cyan accents, crisp cards, shadcn UI components, responsive layout, fluid transitions. Fully functional offline/demo mode so the presentation works seamlessly.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://easyfill-care.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/89fad974-a709-49e1-b5fd-3020a90bb88b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
