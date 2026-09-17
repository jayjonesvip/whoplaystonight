import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NFL_TEAMS } from "@/app/lib/nfl";
import { pageMetadata } from "@/app/lib/seo";
import { TeamLive } from "@/app/ui/team-live";

type PageProps = { params: Promise<{ team: string }> };

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { team } = await params;
  const known = NFL_TEAMS.find(([abbr]) => abbr === team.toLowerCase());
  if (!known) return { title: "NFL Team Schedule" };
  const shortName = known[1].split(" ").slice(-1)[0];
  return pageMetadata({
    title: `Do the ${shortName} Play Today? Next Game & TV`,
    description: `Do the ${known[1]} play today? See their next game, kickoff time, TV channel, current record, and last game score.`,
    path: `/teams/${known[0]}`,
    keywords: [
      `do the ${shortName.toLowerCase()} play today`,
      `${known[1]} game today`,
      `${known[1]} next game`,
      `${known[1]} schedule`,
      `${known[1]} game time and channel`,
    ],
  });
}

export function generateStaticParams() {
  return NFL_TEAMS.map(([team]) => ({ team }));
}

export default async function TeamPage({ params }: PageProps) {
  const { team } = await params;
  if (!NFL_TEAMS.some(([abbr]) => abbr === team.toLowerCase())) notFound();
  return <TeamLive code={team.toLowerCase()} />;
}
