import asyncio
import csv
import io
import os
import time

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

FIRMS_MAP_KEY = os.environ.get("FIRMS_MAP_KEY")
FIRMS_AREA_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
# Suomi NPP (VIIRS_SNPP_NRT) is being retired by NOAA on 2026-11-01; NOAA-21 is the
# recommended primary replacement, NOAA-20 secondary. See DECISIONS.md.
FIRMS_SOURCES = ["VIIRS_NOAA21_NRT", "VIIRS_NOAA20_NRT"]
CACHE_TTL_SECONDS = 300  # FIRMS itself only refreshes every ~5 minutes.

app = FastAPI(title="FireBeetle API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_cache: dict[str, tuple[float, list[dict]]] = {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


async def _fetch_source(client: httpx.AsyncClient, source: str, bbox: str, days: int) -> list[dict]:
    url = f"{FIRMS_AREA_URL}/{FIRMS_MAP_KEY}/{source}/{bbox}/{days}"
    response = await client.get(url, timeout=15)
    response.raise_for_status()

    text = response.text.strip()
    if not text.lower().startswith("latitude"):
        # FIRMS reports errors (invalid key, bad params, rate limit) as a plain
        # text line instead of a CSV header.
        raise HTTPException(status_code=502, detail=f"FIRMS API error for {source}: {text[:200]}")

    fires = []
    for row in csv.DictReader(io.StringIO(text)):
        try:
            fires.append(
                {
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "confidence": row.get("confidence"),
                    "frp": float(row["frp"]) if row.get("frp") else None,
                    "acq_date": row.get("acq_date"),
                    "acq_time": row.get("acq_time"),
                    "satellite": row.get("satellite"),
                    "daynight": row.get("daynight"),
                    "source": source,
                }
            )
        except (KeyError, ValueError):
            continue
    return fires


@app.get("/api/fires")
async def get_fires(
    bbox: str = Query("-180,-90,180,90", description="west,south,east,north"),
    days: int = Query(1, ge=1, le=10),
):
    if not FIRMS_MAP_KEY:
        raise HTTPException(status_code=500, detail="FIRMS_MAP_KEY is not configured on the server")

    cache_key = f"{bbox}:{days}"
    now = time.time()
    cached = _cache.get(cache_key)
    if cached and now - cached[0] < CACHE_TTL_SECONDS:
        return {"count": len(cached[1]), "cached": True, "fires": cached[1]}

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_fetch_source(client, source, bbox, days) for source in FIRMS_SOURCES])

    fires = [fire for group in results for fire in group]
    _cache[cache_key] = (now, fires)
    return {"count": len(fires), "cached": False, "fires": fires}
