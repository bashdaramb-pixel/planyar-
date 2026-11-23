import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Web search is not configured yet. Add FIRECRAWL_API_KEY to the PlanYar service variables in Railway." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 2 || query.length > 180) {
      return NextResponse.json({ error: "Enter a search phrase between 2 and 180 characters." }, { status: 400 });
    }

    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `${query} product model technical specifications datasheet`,
        limit: 8,
        scrapeOptions: { formats: ["markdown"] },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      console.error("PlanYar web product search provider error:", response.status);
      return NextResponse.json({ error: "The web search provider could not complete this search. Please try again." }, { status: 502 });
    }

    const results = (Array.isArray(payload.data) ? payload.data : [])
      .filter((item: unknown) => item && typeof item === "object")
      .map((item: Record<string, unknown>) => ({
        title: typeof item.title === "string" ? item.title.slice(0, 240) : "",
        url: typeof item.url === "string" && /^https?:\/\//i.test(item.url) ? item.url : "",
        description: typeof item.description === "string" ? item.description.slice(0, 700) : "",
        content: typeof item.markdown === "string" ? item.markdown.slice(0, 5000) : "",
      }))
      .filter((item: { title: string; url: string }) => item.title && item.url);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("PlanYar web product search failed:", error);
    return NextResponse.json(
      { error: error instanceof Error && error.name === "TimeoutError" ? "Web search timed out. Please try again." : "Could not search the web right now." },
      { status: 500 },
    );
  }
}
