import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/auth/permissions";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;

  try {
    const response = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        await assertAdminSession();

        const oidcToken = process.env.VERCEL_OIDC_TOKEN;
        const storeId = process.env.BLOB_STORE_ID;

        if (!oidcToken || !storeId) {
          throw new Error(
            "Configure VERCEL_OIDC_TOKEN e BLOB_STORE_ID no .env.local.",
          );
        }

        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: ALLOWED_IMAGE_TYPES,
            maximumSizeInBytes: MAX_IMAGE_SIZE_BYTES,
            validUntil: Date.now() + 5 * 60 * 1000,
            oidcToken,
            storeId,
          }),
          urlOptions: {
            addRandomSuffix: true,
          },
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel enviar a imagem.";

    console.error("[blob-upload]", {
      message,
      hasOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN),
      hasStoreId: Boolean(process.env.BLOB_STORE_ID),
      hasReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
