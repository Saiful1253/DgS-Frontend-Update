import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const parsed = new URL(urlParam);
    const isCloudinary = parsed.hostname.endsWith("cloudinary.com");
    if (!isCloudinary && !parsed.hostname.includes("milanova.tech") && !parsed.hostname.includes("localhost")) {
      return new NextResponse("Forbidden domain", { status: 403 });
    }

    // Try direct fetch first
    let res = await fetch(urlParam);

    // If Cloudinary denies raw .pdf delivery due to account ACL restriction,
    // fetch the high-resolution page image renders and synthesize a complete multi-page PDF
    if (!res.ok && (res.status === 401 || res.status === 403) && isCloudinary) {
      const pageBuffers: Buffer[] = [];
      let pageIndex = 1;

      while (pageIndex <= 20) {
        const pageJpgUrl = urlParam
          .replace("/upload/", `/upload/pg_${pageIndex}/`)
          .replace(/\.pdf$/i, ".jpg");
        const pageRes = await fetch(pageJpgUrl);
        if (!pageRes.ok) break;
        pageBuffers.push(Buffer.from(await pageRes.arrayBuffer()));
        pageIndex++;
      }

      // Fallback: if no pg_N matched, try base .jpg
      if (pageBuffers.length === 0) {
        const fallbackRes = await fetch(urlParam.replace(/\.pdf$/i, ".jpg"));
        if (fallbackRes.ok) {
          pageBuffers.push(Buffer.from(await fallbackRes.arrayBuffer()));
        }
      }

      if (pageBuffers.length > 0) {
        const pdf = new jsPDF();
        pageBuffers.forEach((buf, idx) => {
          const imgData = `data:image/jpeg;base64,${buf.toString("base64")}`;
          const imgProps = pdf.getImageProperties(imgData);
          if (idx === 0) {
            pdf.deletePage(1); // Remove default blank page
          }
          pdf.addPage(
            [imgProps.width, imgProps.height],
            imgProps.width > imgProps.height ? "landscape" : "portrait"
          );
          pdf.addImage(imgData, "JPEG", 0, 0, imgProps.width, imgProps.height);
        });

        const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.statusText}`, { status: res.status });
    }

    const blob = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "application/pdf";

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("pdf") ? "application/pdf" : contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "Failed to fetch document",
      { status: 500 }
    );
  }
}
