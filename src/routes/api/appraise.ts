import { createFileRoute } from "@tanstack/react-router";
import { appraiseImage } from "@/lib/appraisal.server";

export const Route = createFileRoute("/api/appraise")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { image?: string };
          if (!body.image || body.image.length > 8_000_000) {
            return Response.json({ error: "Choose a clear photo under 6 MB." }, { status: 400 });
          }
          return Response.json(await appraiseImage(body.image));
        } catch (error) {
          const message = error instanceof Error ? error.message : "The appraisal spell failed.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});