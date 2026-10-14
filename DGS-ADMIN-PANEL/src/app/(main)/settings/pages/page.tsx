import { redirect } from "next/navigation";

export default function PagesIndexPage() {
  redirect("/settings/pages/terms-and-condition");
}
