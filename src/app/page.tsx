import { getPeriods } from "@/lib/data/repository";
import HomeClient from "./HomeClient";

export default async function Home() {
  const result = await getPeriods();
  const periods = result.ok ? result.data : [];

  return <HomeClient periods={periods} />;
}