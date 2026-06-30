import { redirect } from "next/navigation";

export default function Home() {
  // Mock session dianggap login → arahkan ke dashboard. Login tetap di /login.
  redirect("/dashboard");
}
