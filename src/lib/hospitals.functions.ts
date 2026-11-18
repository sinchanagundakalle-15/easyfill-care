import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const searchSchema = z.object({
  query: z.string().trim().min(1).max(160),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable(),
});

export type LiveHospital = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  lat: number | null;
  lng: number | null;
};

export const searchLiveHospitals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => searchSchema.parse(input))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) {
      return { hospitals: [] as LiveHospital[], error: "Live hospital search is not configured. Demo listings remain available." };
    }

    const body: Record<string, unknown> = {
      textQuery: `hospitals ${data.query.trim()} India`,
      pageSize: 20,
      regionCode: "IN",
    };
    if (data.location) {
      body["locationBias"] = {
        circle: {
          center: { latitude: data.location.lat, longitude: data.location.lng },
          radius: 50000,
        },
      };
    }

    const response = await fetch("https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Google Maps hospital search failed [${response.status}]: ${details}`);
      return { hospitals: [] as LiveHospital[], error: `Live search is temporarily unavailable (${response.status}). You can still browse the demo listings.` };
    }

    const result = await response.json() as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        nationalPhoneNumber?: string;
        websiteUri?: string;
        rating?: number;
        userRatingCount?: number;
      }>;
    };

    const hospitals = (result.places ?? []).flatMap((place): LiveHospital[] => {
      const name = place.displayName?.text?.trim();
      if (!name || !place.id) return [];
      return [{
        id: place.id,
        name,
        address: place.formattedAddress ?? null,
        phone: place.nationalPhoneNumber ?? null,
        website: place.websiteUri ?? null,
        rating: typeof place.rating === "number" ? place.rating : null,
        reviews: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
        lat: typeof place.location?.latitude === "number" ? place.location.latitude : null,
        lng: typeof place.location?.longitude === "number" ? place.location.longitude : null,
      }];
    });

    return { hospitals, error: null as string | null };
  });