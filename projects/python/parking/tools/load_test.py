"""Воспроизводимая HTTP-нагрузка на чтение, только для собственного стенда."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import time
import urllib.request
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    parser.add_argument("--requests", type=int, default=200)
    parser.add_argument("--workers", type=int, default=10)
    parser.add_argument("--output", default="load-results.json")
    args = parser.parse_args()
    if args.requests < 1 or not 1 <= args.workers <= 100:
        parser.error("requests >= 1; workers от 1 до 100")
    routes = ["/api/stats", "/api/spots", "/api/forecast", "/health/ready"]

    def request(index):
        start = time.perf_counter()
        try:
            with urllib.request.urlopen(args.url.rstrip("/") + routes[index % len(routes)], timeout=10) as response:
                response.read()
                ok = response.status == 200
        except Exception:
            ok = False
        return (time.perf_counter() - start) * 1000, ok

    started = time.perf_counter()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(request, range(args.requests)))
    elapsed = time.perf_counter() - started
    times = sorted(t for t, _ in results)
    result = {"url": args.url, "requests": args.requests, "workers": args.workers,
              "errors": sum(not ok for _, ok in results), "elapsed_seconds": round(elapsed, 3),
              "requests_per_second": round(args.requests / elapsed, 2),
              "p50_ms": round(times[(len(times) - 1) // 2], 2),
              "p95_ms": round(times[min(len(times) - 1, int(len(times) * .95))], 2)}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
