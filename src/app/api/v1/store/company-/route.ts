import { NextResponse } from "next/server";
import { getHubSpotFieldOptions } from "@/services/hubspots/form.service";
import { FALLBACK_OPTIONS } from "@/constants/hubspots/companyposition.constants";
import type { FormOptionsResponse } from "@/types/hubspots/form.types";

export async function GET() {
  try {
    const options = await getHubSpotFieldOptions(
      "job_title_position",
      FALLBACK_OPTIONS
    );
    const response: FormOptionsResponse = {
      options,
      source: options === FALLBACK_OPTIONS ? "fallback" : "data",
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to load company size options:", error);

    const response: FormOptionsResponse = {
      options: FALLBACK_OPTIONS,
      source: "fallback",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
