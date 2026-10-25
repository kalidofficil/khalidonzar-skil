import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /files/<id> opens an attachment. Files are private, so this checks the user
 * may see it (RLS) and redirects to a download link that expires in 60 seconds.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/files/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("attachments")
    .select("storage_path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (!file) return new NextResponse("Not found", { status: 404 });

  const download = request.nextUrl.searchParams.has("download");
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(file.storage_path, 60, download ? { download: file.file_name } : undefined);
  if (error || !data) return new NextResponse("Not found", { status: 404 });

  return NextResponse.redirect(data.signedUrl);
}
