import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/files/extract/route";

describe("POST /api/files/extract", () => {
  it("returns extracted text for plain text file", async () => {
    const formData = new FormData();
    formData.set("file", new File(["hello world"], "test.txt", { type: "text/plain" }));

    const response = await POST(new Request("http://localhost/api/files/extract", {
      method: "POST",
      body: formData,
    }));
    expect(response.status).toBe(200);

    const payload = (await response.json()) as { extractedText: string };
    expect(payload.extractedText).toBe("hello world");
  });

  it("returns 400 when no file is provided", async () => {
    const response = await POST(
      new Request("http://localhost/api/files/extract", { method: "POST", body: new FormData() })
    );
    expect(response.status).toBe(400);
  });
});
