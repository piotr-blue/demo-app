import { redirect } from "next/navigation";

export default function DocumentsPage() {
  redirect("/home?section=documents");
}
