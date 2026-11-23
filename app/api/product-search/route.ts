import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_ID;
    if (!apiKey || !searchEngineId) {
      return NextResponse.json(
        { error: "Google web search is not configured yet. Add GOOGLE_API_KEY and GOOGLE_CSE_ID to the PlanYar service variables in Railway." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 2 || query.length > 180) {
      return NextResponse.json({ error: "Enter a search phrase between 2 and 180 characters." }, { status: 400 });
    }

    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: `${query} product model technical specifications datasheet`,
      num: "8",
    });
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("PlanYar Google search provider error:", response.status, payload?.error?.code ?? "");
      return NextResponse.json(
        { error: response.status === 429 ? "Google search quota exceeded. Check your Google API quota and billing settings." : "Google could not complete this search. Check the API key and Programmable Search Engine configuration." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const results = (Array.isArray(payload.items) ? payload.items : [])
      .filter((item: unknown) => item && typeof item === "object")
      .map((item: Record<string, unknown>) => ({
        title: typeof item.title === "string" ? item.title.slice(0, 240) : "",
        url: typeof item.link === "string" && /^https?:\/\//i.test(item.link) ? item.link : "",
        description: typeof item.snippet === "string" ? item.snippet.slice(0, 700) : "",
        content: "",
      }))
      .filter((item: { title: string; url: string }) => item.title && item.url);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("PlanYar Google product search failed:", error);
    return NextResponse.json(
      { error: error instanceof Error && error.name === "TimeoutError" ? "Google search timed out. Please try again." : "Could not search Google right now." },
      { status: 500 },
    );
  }
}
