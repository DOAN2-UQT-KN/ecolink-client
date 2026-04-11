import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          Accept: "application/json",
          // Required per Nominatim's usage policy to identify the app
          "User-Agent": "EcoLink-Client/1.0 (Contact: team@ecolink.com)",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Too Many Requests - Rate Limited by Nominatim" },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch from geocoding service" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Geocode API error:", error.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
