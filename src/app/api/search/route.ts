import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    console.error("BACKEND_API_URL is not set in .env.local");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const fetchUrl = `${backendUrl}/search?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(fetchUrl, {
      next: { revalidate: 3600 }, 
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error from backend: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch from backend:", error);
    return NextResponse.json(
      { error: "Failed to connect to the backend service" },
      { status: 503 }
    );
  }
}