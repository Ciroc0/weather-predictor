const HF_PREDICTIONS_DATASET =
  process.env.HF_PREDICTIONS_DATASET || "Ciroc0/dmi-aarhus-predictions";
const HF_FRONTEND_SNAPSHOT_FILE =
  process.env.HF_FRONTEND_SNAPSHOT_FILE || "frontend_snapshot.json";
const HF_TOKEN = process.env.HF_TOKEN;
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = {
  expiresAt: 0,
  snapshot: null,
  fetchedAt: null,
};

function buildSnapshotUrl() {
  const encodedDataset = encodeURIComponent(HF_PREDICTIONS_DATASET).replace("%2F", "/");
  const encodedFile = encodeURIComponent(HF_FRONTEND_SNAPSHOT_FILE);
  return `https://huggingface.co/datasets/${encodedDataset}/resolve/main/${encodedFile}?download=true`;
}

async function fetchSnapshot() {
  const headers = {};
  if (HF_TOKEN) {
    headers.Authorization = `Bearer ${HF_TOKEN}`;
  }

  const response = await fetch(buildSnapshotUrl(), {
    headers,
  });

  if (!response.ok) {
    throw new Error(`HF snapshot request failed with status ${response.status}`);
  }

  return response.json();
}

export default async function handler(_req, res) {
  const now = Date.now();
  if (cache.snapshot && cache.expiresAt > now) {
    return res.status(200).json({
      snapshot: cache.snapshot,
      stale: false,
      fetchedAt: cache.fetchedAt,
      source: "cache",
    });
  }

  try {
    const snapshot = await fetchSnapshot();
    cache = {
      snapshot,
      fetchedAt: new Date().toISOString(),
      expiresAt: now + CACHE_TTL_MS,
    };

    return res.status(200).json({
      snapshot,
      stale: false,
      fetchedAt: cache.fetchedAt,
      source: "huggingface",
    });
  } catch (error) {
    if (cache.snapshot) {
      return res.status(200).json({
        snapshot: cache.snapshot,
        stale: true,
        fetchedAt: cache.fetchedAt,
        source: "stale-cache",
        error: error instanceof Error ? error.message : "Snapshot fetch failed",
      });
    }

    return res.status(503).json({
      error: error instanceof Error ? error.message : "Snapshot fetch failed",
    });
  }
}
