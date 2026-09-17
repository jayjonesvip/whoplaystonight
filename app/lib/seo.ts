import type { Metadata } from "next";

export const SITE_NAME = "Who Plays Tonight";
export const SITE_URL = "https://whoplaystonight.com";
export const SITE_DESCRIPTION =
  "Find today's NFL games, kickoff times, TV channels, streaming options, and every team's next game.";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function pageMetadata({ title, description, path, keywords = [] }: PageMetadataOptions): Metadata {
  const canonical = new URL(path, SITE_URL).toString();
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: canonical,
    },
    twitter: { card: "summary", title: socialTitle, description },
  };
}
