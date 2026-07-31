import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

const USER_AGENT = "EcoLink-Client/1.0 (Contact: team@ecolink.com)";

async function handleReverseGeocode(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const url = new URL(req.url ?? "", "http://localhost");
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!lat || !lon) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Latitude and longitude are required" }));
      return;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
      },
    );

    if (!response.ok) {
      const status = response.status;
      const body =
        status === 429
          ? { error: "Too Many Requests - Rate Limited by Nominatim" }
          : { error: "Failed to fetch from geocoding service" };
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
      return;
    }

    const data = await response.json();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Geocode API error:", message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

function attachMiddleware(server: {
  middlewares: Connect.Server;
}) {
  server.middlewares.use("/api/reverse-geocode", (req, res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }
    void handleReverseGeocode(req, res);
  });
}

export function reverseGeocodeMiddleware(): Plugin {
  return {
    name: "reverse-geocode",
    configureServer(server) {
      attachMiddleware(server);
    },
    configurePreviewServer(server) {
      attachMiddleware(server);
    },
  };
}
