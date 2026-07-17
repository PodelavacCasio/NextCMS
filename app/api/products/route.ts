import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getProducts());
}
