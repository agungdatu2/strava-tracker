import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BADGES = [
  // Milestone
  { slug: "first_activity",  name: "First Steps",      description: "Log your first activity",             icon: "🎉", category: "MILESTONE", criteria: { type: "total_count", min: 1 },                          sortOrder: 1 },
  { slug: "10_activities",   name: "Getting Going",     description: "Complete 10 activities",              icon: "🔟", category: "MILESTONE", criteria: { type: "total_count", min: 10 },                         sortOrder: 2 },
  { slug: "50_activities",   name: "Committed",         description: "Complete 50 activities",              icon: "💪", category: "MILESTONE", criteria: { type: "total_count", min: 50 },                         sortOrder: 3 },
  { slug: "100_activities",  name: "Century Club",      description: "Complete 100 activities",             icon: "💯", category: "MILESTONE", criteria: { type: "total_count", min: 100 },                        sortOrder: 4 },

  // Distance
  { slug: "run_5k",          name: "5K Runner",         description: "Run 5 km in a single activity",       icon: "🏃", category: "DISTANCE",  criteria: { type: "single_distance", sport: "Run", min: 5000 },    sortOrder: 10 },
  { slug: "run_10k",         name: "10K Runner",        description: "Run 10 km in a single activity",      icon: "🏃", category: "DISTANCE",  criteria: { type: "single_distance", sport: "Run", min: 10000 },   sortOrder: 11 },
  { slug: "half_marathon",   name: "Half Marathoner",   description: "Run 21.1 km in a single activity",    icon: "🥈", category: "DISTANCE",  criteria: { type: "single_distance", sport: "Run", min: 21097 },   sortOrder: 12 },
  { slug: "marathon",        name: "Marathoner",        description: "Run a full marathon",                 icon: "🥇", category: "DISTANCE",  criteria: { type: "single_distance", sport: "Run", min: 42195 },   sortOrder: 13 },
  { slug: "century_ride",    name: "Century Rider",     description: "Ride 100 km in a single activity",    icon: "🚴", category: "DISTANCE",  criteria: { type: "single_distance", sport: "Ride", min: 100000 }, sortOrder: 14 },
  { slug: "total_100km",     name: "100 km Total",      description: "Accumulate 100 km across all runs",   icon: "📍", category: "DISTANCE",  criteria: { type: "cumulative_distance", sport: "Run", min: 100000 },  sortOrder: 15 },
  { slug: "total_1000km",    name: "1,000 km Club",     description: "Accumulate 1,000 km across all runs", icon: "🌍", category: "DISTANCE",  criteria: { type: "cumulative_distance", sport: "Run", min: 1000000 }, sortOrder: 16 },

  // Speed
  { slug: "sub_6_pace",      name: "Speed Demon",       description: "Run at sub 6:00/km pace",             icon: "⚡", category: "SPEED",     criteria: { type: "pace", sport: "Run", maxSecPerKm: 360 },         sortOrder: 20 },
  { slug: "sub_5_pace",      name: "Sub-5 Pacer",       description: "Run at sub 5:00/km pace",             icon: "🔥", category: "SPEED",     criteria: { type: "pace", sport: "Run", maxSecPerKm: 300 },         sortOrder: 21 },

  // Elevation
  { slug: "hill_climber",    name: "Hill Climber",      description: "Climb 500m elevation in one activity",icon: "⛰️", category: "ELEVATION", criteria: { type: "single_elevation", min: 500 },                   sortOrder: 30 },
  { slug: "everest",         name: "Everesting",        description: "Accumulate 8,848m total elevation",   icon: "🏔️", category: "ELEVATION", criteria: { type: "cumulative_elevation", min: 8848 },               sortOrder: 31 },

  // Streak
  { slug: "streak_3",        name: "Hat Trick",         description: "Activity 3 days in a row",            icon: "3️⃣",  category: "STREAK",    criteria: { type: "streak_days", min: 3 },                         sortOrder: 40 },
  { slug: "streak_7",        name: "Week Warrior",      description: "Activity 7 days in a row",            icon: "7️⃣",  category: "STREAK",    criteria: { type: "streak_days", min: 7 },                         sortOrder: 41 },
  { slug: "streak_30",       name: "Monthly Monster",   description: "Activity 30 days in a row",           icon: "🗓️", category: "STREAK",    criteria: { type: "streak_days", min: 30 },                        sortOrder: 42 },

  // Special
  { slug: "early_bird",      name: "Early Bird",        description: "Complete an activity before 6 AM",    icon: "🌅", category: "SPECIAL",   criteria: { type: "start_hour", maxHour: 6 },                       sortOrder: 50 },
  { slug: "night_owl",       name: "Night Owl",         description: "Complete an activity after 9 PM",     icon: "🦉", category: "SPECIAL",   criteria: { type: "start_hour", minHour: 21 },                      sortOrder: 51 },
  { slug: "multi_sport",     name: "Multi-Sport",       description: "Log 3 different sport types",         icon: "🎯", category: "SPECIAL",   criteria: { type: "unique_sports", min: 3 },                        sortOrder: 52 },
];

async function main() {
  console.log("Seeding badges...");
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: { ...badge, criteria: JSON.stringify(badge.criteria) },
      create: { ...badge, criteria: JSON.stringify(badge.criteria) },
    });
  }
  console.log(`Seeded ${BADGES.length} badges.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
