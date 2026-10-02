import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const collegeBriefings = sqliteTable("college_briefings", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  briefingData: text("briefing_data").notNull(),
  model: text("model").notNull(),
  generatedAt: text("generated_at").notNull(),
});
