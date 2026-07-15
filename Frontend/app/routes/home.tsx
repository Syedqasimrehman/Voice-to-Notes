import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Voice Note" },
    { name: "AI Voice Note from English to Urdu and From Urdu to Englisj", content: "Welcome To AI Voice" },
  ];
}

export default function Home() {
  return <Welcome />;
}
