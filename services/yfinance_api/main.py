from datetime import datetime, timezone
from cachetools import TTLCache
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI(title="InvestToolkit yfinance API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[], allow_methods=["GET"], allow_headers=["*"])
quote_cache = TTLCache(maxsize=1000, ttl=60)
search_cache = TTLCache(maxsize=500, ttl=3600)

@app.get("/health")
def health():
    return {"status": "ok", "provider": "yfinance"}

@app.get("/search")
def search(q: str = Query(min_length=1, max_length=80)):
    key = q.strip().lower()
    if key in search_cache:
        return search_cache[key]
    try:
        quotes = yf.Search(q, max_results=20, news_count=0).quotes
        items = []
        for item in quotes:
            exchange = item.get("exchange") or item.get("exchDisp") or ""
            quote_type = item.get("quoteType", "").upper()
            if quote_type not in {"EQUITY", "ETF"}:
                continue
            if exchange not in {"NMS", "NYQ", "NGM", "NCM", "PCX", "BTS", "ASE", "NASDAQ", "NYSE", "NYSEArca"}:
                continue
            items.append({"symbol": item.get("symbol"), "name": item.get("shortname") or item.get("longname") or item.get("symbol"), "type": "ETF" if quote_type == "ETF" else "Stock", "region": "United States", "currency": "USD"})
            if len(items) >= 10:
                break
        result = {"items": items, "source": "yfinance / Yahoo Finance"}
        search_cache[key] = result
        return result
    except Exception as exc:
        raise HTTPException(status_code=502, detail="SEARCH_FAILED") from exc

@app.get("/quote/{symbol}")
def quote(symbol: str):
    symbol = symbol.strip().upper()
    if symbol in quote_cache:
        return quote_cache[symbol]
    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period="5d", interval="1d", auto_adjust=False)
        if history.empty:
            raise HTTPException(status_code=404, detail="QUOTE_NOT_FOUND")
        price = float(history["Close"].iloc[-1])
        previous = float(history["Close"].iloc[-2]) if len(history) > 1 else price
        change = price - previous
        result = {"symbol": symbol, "price": price, "change": change, "changePercent": (change / previous * 100) if previous else 0, "previousClose": previous, "latestTradingDay": history.index[-1].strftime("%Y-%m-%d"), "source": "yfinance / Yahoo Finance", "freshness": "Yahoo Finance 제공 최신 거래 데이터", "fetchedAt": datetime.now(timezone.utc).isoformat()}
        quote_cache[symbol] = result
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="QUOTE_FAILED") from exc
