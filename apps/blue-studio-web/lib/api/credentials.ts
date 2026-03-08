import { z } from "zod";

const credentialsSchema = z.object({
  openAiApiKey: z.string().min(1),
  myOsApiKey: z.string().min(1),
  myOsAccountId: z.string().min(1),
  myOsBaseUrl: z.string().url().optional().default("https://api.dev.myos.blue/"),
});

export type RouteCredentials = z.infer<typeof credentialsSchema>;

export function parseRouteCredentials(value: unknown): RouteCredentials {
  return credentialsSchema.parse(value);
}
