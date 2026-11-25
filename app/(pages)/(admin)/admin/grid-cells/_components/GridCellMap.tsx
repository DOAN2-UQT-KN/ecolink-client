import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import MapGL, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
  type StyleSpecification,
} from "react-map-gl/maplibre";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useGetGridCells } from "@/apis/grid-cell/getGridCells";
import type { IGridCell } from "@/apis/grid-cell/models/gridCell";
import { Slider } from "@/components/ui/slider";
import { GOONG_STYLE_URL } from "@/libs/goong";
import { formattedDate } from "@/utils/formattedDate";
import { GridCellDetailDialog } from "./GridCellDetailDialog";

/** Without a Goong key (local dev) fall back to plain OpenStreetMap tiles. */
const OSM_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

// Font names must exist in the style's glyph server.
const TEXT_FONT = GOONG_STYLE_URL ? ["Roboto Regular"] : ["Open Sans Regular"];

const MAP_LIMIT = 500;

/** Zoom levels: below SQUARE_MIN_ZOOM cells are points/clusters, from it they are true 100 m squares. */
const CLUSTER_MAX_ZOOM = 14;
const SQUARE_MIN_ZOOM = 16;

const SOURCE_POINTS = "grid-cell-points";
const SOURCE_SQUARES = "grid-cell-squares";
const LAYER_CLUSTERS = "grid-cell-clusters";
const LAYER_CLUSTER_COUNT = "grid-cell-cluster-count";
const LAYER_POINTS = "grid-cell-point";
const LAYER_POINT_COUNT = "grid-cell-point-count";
const LAYER_SQUARES = "grid-cell-square";
const LAYER_SQUARES_LINE = "grid-cell-square-line";

const M_PER_DEG_LAT = 111_320;

function squareOf(cell: IGridCell): [number, number][] {
  const half = cell.grid_size_m / 2;
  const dLat = half / M_PER_DEG_LAT;
  const dLng = half / (M_PER_DEG_LAT * Math.cos((cell.center_lat * Math.PI) / 180));
  const { center_lng: x, center_lat: y } = cell;
  return [
    [x - dLng, y - dLat],
    [x + dLng, y - dLat],
    [x + dLng, y + dLat],
    [x - dLng, y + dLat],
    [x - dLng, y - dLat],
  ];
}

export function GridCellMap() {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef>(null);
  const fittedRef = useRef(false);

  const { data, isLoading } = useGetGridCells({
    page: 1,
    limit: MAP_LIMIT,
    sort: "submitted",
  });
  const cells = useMemo(() => data?.data?.items ?? [], [data]);
  const maxCount = useMemo(
    () => cells.reduce((m, c) => Math.max(m, c.submitted_count), 1),
    [cells],
  );

  const [range, setRange] = useState<[number, number] | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const [lo, hi] = range ?? [1, maxCount];
  const clampedHi = Math.min(hi, maxCount);

  const visible = useMemo(
    () =>
      cells.filter(
        (c) => c.submitted_count >= lo && c.submitted_count <= clampedHi,
      ),
    [cells, lo, clampedHi],
  );
  const selected: IGridCell | null =
    cells.find((c) => c.cell_key === selectedKey) ?? null;

  const pointData = useMemo<
    FeatureCollection<Point, { key: string; count: number }>
  >(
    () => ({
      type: "FeatureCollection",
      features: visible.map((c) => ({
        type: "Feature",
        properties: { key: c.cell_key, count: c.submitted_count },
        geometry: { type: "Point", coordinates: [c.center_lng, c.center_lat] },
      })),
    }),
    [visible],
  );

  const squareData = useMemo<
    FeatureCollection<Polygon, { key: string; count: number }>
  >(
    () => ({
      type: "FeatureCollection",
      features: visible.map((c) => ({
        type: "Feature",
        properties: { key: c.cell_key, count: c.submitted_count },
        geometry: { type: "Polygon", coordinates: [squareOf(c)] },
      })),
    }),
    [visible],
  );

  // Amber (few reports) to red (the busiest cell), shared by points and squares.
  const countColor = [
    "interpolate",
    ["linear"],
    ["get", "count"],
    1,
    "#facc15",
    Math.max(maxCount, 2),
    "#dc2626",
  ] as never;

  // Zoom to the data once both the data and the map style are ready.
  useEffect(() => {
    if (fittedRef.current || !mapReady || cells.length === 0) return;
    const map = mapRef.current;
    if (!map) return;
    const lats = cells.map((c) => c.center_lat);
    const lngs = cells.map((c) => c.center_lng);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, maxZoom: 15, duration: 600 },
    );
    fittedRef.current = true;
  }, [cells, mapReady]);

  // Hide the base map's own icons (shops, banks, stations...) so only our cells stand out.
  // Text-only labels such as street names stay.
  const handleLoad = () => {
    const map = mapRef.current?.getMap();
    if (map) {
      for (const layer of map.getStyle().layers ?? []) {
        if (layer.type !== "symbol" || layer.id.startsWith("grid-cell")) continue;
        if (map.getLayoutProperty(layer.id, "icon-image") !== undefined) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }
    }
    setMapReady(true);
  };

  const handleClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      setSelectedKey(null);
      return;
    }
    // Cluster: zoom in far enough to break it apart.
    if (feature.layer.id === LAYER_CLUSTERS) {
      const source = mapRef.current?.getSource(SOURCE_POINTS) as
        | GeoJSONSource
        | undefined;
      const clusterId = feature.properties?.cluster_id as number;
      const [lng, lat] = (feature.geometry as Point).coordinates;
      void source?.getClusterExpansionZoom(clusterId).then((zoom) => {
        mapRef.current?.easeTo({ center: [lng, lat], zoom: zoom + 0.5 });
      });
      return;
    }
    setSelectedKey(String(feature.properties?.key ?? ""));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[10px] border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground-secondary">
            {t("Reports per cell")}
          </span>
          <span className="tabular-nums">
            {lo} – {clampedHi}
            <span className="ml-3 text-foreground-secondary">
              {t("{{count}} cells shown", { count: visible.length })}
            </span>
          </span>
        </div>
        <Slider
          min={1}
          max={Math.max(maxCount, 2)}
          step={1}
          value={[lo, clampedHi]}
          onValueChange={(v) => setRange([v[0], v[1]])}
          disabled={cells.length === 0}
        />
      </div>

      <div className="relative h-[560px] overflow-hidden rounded-[10px] border border-border">
        <MapGL
          ref={mapRef}
          mapStyle={GOONG_STYLE_URL ?? OSM_STYLE}
          initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={[LAYER_CLUSTERS, LAYER_POINTS, LAYER_SQUARES]}
          onLoad={handleLoad}
          onClick={handleClick}
        >
          <NavigationControl position="top-left" />

          {/* Zoomed out: nearby cells merge into one bubble showing the total reports. */}
          <Source
            id={SOURCE_POINTS}
            type="geojson"
            data={pointData}
            cluster
            clusterMaxZoom={CLUSTER_MAX_ZOOM}
            clusterRadius={50}
            clusterProperties={{ total: ["+", ["get", "count"]] }}
          >
            <Layer
              id={LAYER_CLUSTERS}
              type="circle"
              filter={["has", "point_count"]}
              paint={{
                "circle-color": "#ea580c",
                "circle-opacity": 0.85,
                "circle-radius": [
                  "step",
                  ["get", "point_count"],
                  18,
                  5,
                  24,
                  20,
                  32,
                ],
                "circle-stroke-width": 3,
                "circle-stroke-color": "#ffffff",
              }}
            />
            <Layer
              id={LAYER_CLUSTER_COUNT}
              type="symbol"
              filter={["has", "point_count"]}
              layout={{
                "text-field": ["get", "total"],
                "text-font": TEXT_FONT,
                "text-size": 13,
                "text-allow-overlap": true,
              }}
              paint={{ "text-color": "#ffffff" }}
            />

            {/* Medium zoom: one dot per cell, sized and coloured by report count. */}
            <Layer
              id={LAYER_POINTS}
              type="circle"
              filter={["!", ["has", "point_count"]]}
              maxzoom={SQUARE_MIN_ZOOM}
              paint={{
                "circle-color": countColor,
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["get", "count"],
                  1,
                  8,
                  Math.max(maxCount, 2),
                  22,
                ],
                "circle-stroke-width": [
                  "case",
                  ["==", ["get", "key"], selectedKey ?? ""],
                  4,
                  2,
                ],
                "circle-stroke-color": [
                  "case",
                  ["==", ["get", "key"], selectedKey ?? ""],
                  "#2563eb",
                  "#ffffff",
                ],
              }}
            />
            <Layer
              id={LAYER_POINT_COUNT}
              type="symbol"
              filter={["!", ["has", "point_count"]]}
              maxzoom={SQUARE_MIN_ZOOM}
              layout={{
                "text-field": ["to-string", ["get", "count"]],
                "text-font": TEXT_FONT,
                "text-size": 11,
                "text-allow-overlap": true,
              }}
              paint={{ "text-color": "#ffffff" }}
            />
          </Source>

          {/* Zoomed in: the real 100 m squares, which can never overlap. */}
          <Source id={SOURCE_SQUARES} type="geojson" data={squareData}>
            <Layer
              id={LAYER_SQUARES}
              type="fill"
              minzoom={SQUARE_MIN_ZOOM}
              paint={{ "fill-color": countColor, "fill-opacity": 0.55 }}
            />
            <Layer
              id={LAYER_SQUARES_LINE}
              type="line"
              minzoom={SQUARE_MIN_ZOOM}
              paint={{
                "line-color": [
                  "case",
                  ["==", ["get", "key"], selectedKey ?? ""],
                  "#2563eb",
                  "#7f1d1d",
                ],
                "line-width": [
                  "case",
                  ["==", ["get", "key"], selectedKey ?? ""],
                  3,
                  1,
                ],
              }}
            />
          </Source>
        </MapGL>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm">
            {t("Loading...")}
          </div>
        ) : null}

        {!isLoading && cells.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-foreground-secondary">
            {t("No grid cells found")}
          </div>
        ) : null}

        {selected ? (
          <aside className="absolute right-3 top-3 w-72 space-y-3 rounded-[10px] border border-border bg-card p-4 shadow-lg">
            <div>
              <div className="font-mono text-sm font-semibold">
                {selected.cell_key}
              </div>
              <div className="text-xs text-foreground-secondary">
                {selected.center_lat.toFixed(5)},{" "}
                {selected.center_lng.toFixed(5)} · {selected.grid_size_m} m
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-foreground-secondary">{t("Reports")}</dt>
              <dd className="text-right font-semibold tabular-nums">
                {selected.submitted_count}
              </dd>
              <dt className="text-foreground-secondary">{t("Verified")}</dt>
              <dd className="text-right tabular-nums">
                {selected.verified_count}
              </dd>
              <dt className="text-foreground-secondary">
                {t("Latest report")}
              </dt>
              <dd className="text-right">
                {selected.last_report_at
                  ? formattedDate(selected.last_report_at)
                  : "—"}
              </dd>
              <dt className="text-foreground-secondary">{t("Cleanups")}</dt>
              <dd className="text-right tabular-nums">
                {selected.cleanup_count}
              </dd>
              <dt className="text-foreground-secondary">
                {t("Latest cleanup")}
              </dt>
              <dd className="text-right">
                {selected.last_cleaned_at
                  ? formattedDate(selected.last_cleaned_at)
                  : "—"}
              </dd>
            </dl>

            <button
              type="button"
              onClick={() => setDetailKey(selected.cell_key)}
              className="block w-full cursor-pointer rounded-md border border-border py-1.5 text-center text-sm font-medium hover:bg-accent"
            >
              {t("View details")}
            </button>
          </aside>
        ) : null}
      </div>
      <GridCellDetailDialog
        cellKey={detailKey}
        onClose={() => setDetailKey(null)}
      />
    </div>
  );
}
