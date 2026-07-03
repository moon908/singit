import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/singit?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database...");

  // Clean up
  await prisma.listeningStats.deleteMany({});
  await prisma.history.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.playlistItem.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.user.deleteMany({});

  // Create demo user
  const hashedPassword = hashPassword("password123");
  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@singit.com",
      password: hashedPassword,
      settings: {
        create: {
          theme: "dark",
          language: "en",
          playbackQuality: "high",
          autoplay: true,
          notifications: true,
        },
      },
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // Create standard playlists
  const playlist1 = await prisma.playlist.create({
    data: {
      name: "Chill Vibes",
      description: "Smooth tracks to wind down to",
      coverImage: "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
      isPublic: true,
      userId: user.id,
      items: {
        create: [
          {
            trackId: "1888483",
            title: "Temptation",
            artistName: "The Woods",
            albumName: "The Woods",
            coverUrl: "https://img.jamendo.com/albums/s1/1234/covers/1.100.jpg",
            duration: 180,
            audioUrl: "https://mp3d.jamendo.com/download/track/1888483/mp32/",
            position: 0,
          },
          {
            trackId: "1914102",
            title: "Summer Rain",
            artistName: "Acoustic Sun",
            albumName: "Acoustic Sun",
            coverUrl: "https://img.jamendo.com/albums/s2/2345/covers/1.100.jpg",
            duration: 210,
            audioUrl: "https://mp3d.jamendo.com/download/track/1914102/mp32/",
            position: 1,
          },
        ],
      },
    },
  });

  const playlist2 = await prisma.playlist.create({
    data: {
      name: "My Favorites",
      description: "My absolute favorite songs",
      coverImage: "https://img.jamendo.com/albums/s3/3456/covers/1.300.jpg",
      isPublic: false,
      userId: user.id,
    },
  });

  console.log(`Created playlists: ${playlist1.name}, ${playlist2.name}`);

  // Create favorites
  await prisma.favorite.createMany({
    data: [
      {
        userId: user.id,
        type: "TRACK",
        itemId: "1888483",
        name: "Temptation",
        imageUrl: "https://img.jamendo.com/albums/s1/1234/covers/1.300.jpg",
        subText: "The Woods",
        audioUrl: "https://mp3d.jamendo.com/download/track/1888483/mp32/",
        duration: 180,
      },
      {
        userId: user.id,
        type: "ARTIST",
        itemId: "354432",
        name: "The Woods",
        imageUrl: "https://img.jamendo.com/artists/s1/354432/covers/1.300.jpg",
      },
    ],
  });

  console.log("Created favorites");

  // Create history (listening stats)
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  await prisma.history.createMany({
    data: [
      {
        userId: user.id,
        trackId: "1888483",
        title: "Temptation",
        artistName: "The Woods",
        coverUrl: "https://img.jamendo.com/albums/s1/1234/covers/1.100.jpg",
        duration: 180,
        audioUrl: "https://mp3d.jamendo.com/download/track/1888483/mp32/",
        playedAt: today,
      },
      {
        userId: user.id,
        trackId: "1914102",
        title: "Summer Rain",
        artistName: "Acoustic Sun",
        coverUrl: "https://img.jamendo.com/albums/s2/2345/covers/1.100.jpg",
        duration: 210,
        audioUrl: "https://mp3d.jamendo.com/download/track/1914102/mp32/",
        playedAt: yesterday,
      },
      {
        userId: user.id,
        trackId: "1888483",
        title: "Temptation",
        artistName: "The Woods",
        coverUrl: "https://img.jamendo.com/albums/s1/1234/covers/1.100.jpg",
        duration: 180,
        audioUrl: "https://mp3d.jamendo.com/download/track/1888483/mp32/",
        playedAt: twoDaysAgo,
      },
    ],
  });

  console.log("Created listening history");

  // Create listening stats
  await prisma.listeningStats.createMany({
    data: [
      {
        userId: user.id,
        date: today,
        listeningTime: 540,
        trackCount: 3,
      },
      {
        userId: user.id,
        date: yesterday,
        listeningTime: 420,
        trackCount: 2,
      },
      {
        userId: user.id,
        date: twoDaysAgo,
        listeningTime: 180,
        trackCount: 1,
      },
    ],
  });

  console.log("Created listening statistics");
  console.log("Seeding completed successfully!");
  
  await pool.end();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
