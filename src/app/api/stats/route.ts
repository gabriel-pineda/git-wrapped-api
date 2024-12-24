import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const runtime = "edge";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  throw new Error("Missing GITHUB_TOKEN environment variable");
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
}

interface GitHubStats {
  longestStreak: number;
  totalCommits: number;
  commitRank: string;
  calendarData: ContributionDay[];
  mostActiveDay: {
    name: string;
    commits: number;
  };
  mostActiveMonth: {
    name: string;
    commits: number;
  };
  starsEarned: number;
  topLanguages: string[];
}

/**
 * Determines the user's commit rank based on their total number of contributions
 * These thresholds are approximations based on general GitHub activity patterns
 */
function getCommitRank(totalCommits: number): string {
  if (totalCommits >= 5000) return "Top 0.5%-1%";
  if (totalCommits >= 2000) return "Top 1%-3%";
  if (totalCommits >= 1000) return "Top 5%-10%";
  if (totalCommits >= 500) return "Top 10%-15%";
  if (totalCommits >= 200) return "Top 25%-30%";
  if (totalCommits >= 50) return "Median 50%";
  return "Bottom 30%";
}

// Constants for date formatting
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * GitHub Stats API endpoint
 * Fetches and processes a user's GitHub statistics including:
 * - Contribution data
 * - Commit patterns
 * - Repository stars
 * - Programming languages
 *
 * @param request - Incoming HTTP request with 'username' query parameter
 * @returns JSON response with processed GitHub statistics
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Extract username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 }
      );
    }

    // GraphQL query to fetch user's GitHub data
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
          repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
            nodes {
              stargazerCount
              primaryLanguage {
                name
              }
            }
          }
        }
      }
    `;

    const graphqlResponse = (await octokit.graphql(query, { username })) as any;
    const userData = graphqlResponse.user;

    // Process contribution data for the current year
    const contributionDays =
      userData.contributionsCollection.contributionCalendar.weeks
        .flatMap((week: any) => week.contributionDays)
        .filter((day: any) => new Date(day.date) >= new Date("2024-01-01"));

    // Calculate monthly contribution statistics
    const monthlyCommits: Record<string, number> = {};
    contributionDays.forEach((day: ContributionDay) => {
      const month = new Date(day.date).getMonth() + 1;
      const monthKey = month.toString().padStart(2, "0");
      monthlyCommits[monthKey] =
        (monthlyCommits[monthKey] || 0) + day.contributionCount;
    });

    // Calculate daily contribution patterns
    const dailyCommits: Record<string, number> = {};
    contributionDays.forEach((day: ContributionDay) => {
      dailyCommits[day.weekday] =
        (dailyCommits[day.weekday] || 0) + day.contributionCount;
    });

    // Find peak activity periods
    const [mostActiveMonth] = Object.entries(monthlyCommits).sort(
      ([, a], [, b]) => b - a
    );

    const [mostActiveDay] = Object.entries(dailyCommits).sort(
      ([, a], [, b]) => b - a
    );

    // Calculate repository statistics
    const totalStars = userData.repositories.nodes.reduce(
      (acc: number, repo: any) => acc + repo.stargazerCount,
      0
    );

    // Process programming language statistics
    const languages = userData.repositories.nodes.reduce(
      (acc: Record<string, number>, repo: any) => {
        if (repo.primaryLanguage?.name) {
          acc[repo.primaryLanguage.name] =
            (acc[repo.primaryLanguage.name] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    const topLanguages = Object.entries(languages)
      .sort(([, a], [, b]): number => (b as number) - (a as number))
      .slice(0, 3)
      .map(([lang]) => lang);

    // Calculate contribution streaks
    let currentStreak = 0;
    let maxStreak = 0;
    for (const day of contributionDays) {
      if (day.contributionCount > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const totalCommits =
      userData.contributionsCollection.contributionCalendar.totalContributions;

    // Prepare and return the final statistics
    const stats: GitHubStats = {
      longestStreak: maxStreak,
      totalCommits,
      commitRank: getCommitRank(totalCommits),
      calendarData: contributionDays,
      mostActiveDay: {
        name: WEEKDAY_NAMES[parseInt(mostActiveDay[0])],
        commits: Math.round(mostActiveDay[1] / (contributionDays.length / 7)), // Average per day
      },
      mostActiveMonth: {
        name: MONTH_NAMES[parseInt(mostActiveMonth[0]) - 1],
        commits: mostActiveMonth[1],
      },
      starsEarned: totalStars,
      topLanguages,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching GitHub stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch GitHub statistics" },
      { status: 500 }
    );
  }
} 