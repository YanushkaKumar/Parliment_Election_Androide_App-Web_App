import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";

export default function Index() {
  const { voterId } = useSession();
  return <Redirect href={voterId ? "/home" : "/login"} />;
}
