import { lookupRenewal } from "@/lib/ironclad";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const account = typeof body.account === "string" ? body.account : "";
  const selectedRecordId = typeof body.selectedRecordId === "string" ? body.selectedRecordId : undefined;

  try {
    const result = await lookupRenewal(account, selectedRecordId);
    return Response.json(result, { status: result.status === "error" ? 400 : 200 });
  } catch (error) {
    return Response.json(
      {
        input: account,
        status: "error",
        warnings: [],
        message: error instanceof Error ? error.message : "Lookup failed.",
      },
      { status: 400 },
    );
  }
}
