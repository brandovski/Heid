import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("API unavailable");
    const data = await res.json();
    const rate = parseFloat(data?.USDBRL?.bid);
    if (isNaN(rate)) throw new Error("Invalid rate");
    return NextResponse.json({ rate });
  } catch {
    return NextResponse.json({ error: "Cotação indisponível" }, { status: 503 });
  }
}
