import { pgTable, text, integer, boolean, timestamp, date, serial, varchar, jsonb } from "drizzle-orm/pg-core"

// ── Existing tables ────────────────────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 10 }).notNull().default("medium"),
  status: varchar("status", { length: 20 }).notNull().default("todo"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).notNull().default("blue"),
  frequency: varchar("frequency", { length: 10 }).notNull().default("daily"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  completedDate: date("completed_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  noteDate: date("note_date").notNull().unique(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetDate: date("target_date"),
  progress: integer("progress").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── New family tables ──────────────────────────────────────────────────────────

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "adult" | "kid" | "pet"
  birthdate: date("birthdate"),
  school: varchar("school", { length: 200 }),
  grade: varchar("grade", { length: 20 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 200 }),
  avatarColor: varchar("avatar_color", { length: 20 }).notNull().default("terracotta"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  mealDate: date("meal_date").notNull(),
  mealType: varchar("meal_type", { length: 20 }).notNull().default("dinner"), // breakfast/lunch/dinner
  mealName: varchar("meal_name", { length: 200 }).notNull(),
  prepNotes: text("prep_notes"),
  ingredients: text("ingredients"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  quantity: varchar("quantity", { length: 50 }),
  store: varchar("store", { length: 100 }),
  category: varchar("category", { length: 50 }).default("other"),
  isBought: boolean("is_bought").notNull().default(false),
  addedAt: timestamp("added_at").defaultNow().notNull(),
})

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  amount: varchar("amount", { length: 20 }),
  dueDate: date("due_date"),
  isAutopay: boolean("is_autopay").notNull().default(false),
  frequency: varchar("frequency", { length: 20 }).notNull().default("monthly"),
  category: varchar("category", { length: 50 }).default("other"),
  isPaid: boolean("is_paid").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const travelPlans = pgTable("travel_plans", {
  id: serial("id").primaryKey(),
  travelerName: varchar("traveler_name", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 200 }).notNull(),
  departDate: date("depart_date").notNull(),
  returnDate: date("return_date"),
  tripType: varchar("trip_type", { length: 30 }).default("personal"), // personal/work/family
  status: varchar("status", { length: 20 }).default("planned"),
  notes: text("notes"),
  packingDone: boolean("packing_done").default(false),
  petCareSorted: boolean("pet_care_sorted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const socialEvents = pgTable("social_events", {
  id: serial("id").primaryKey(),
  personName: varchar("person_name", { length: 100 }).notNull(),
  eventType: varchar("event_type", { length: 30 }).notNull(), // birthday/anniversary/rsvp/visit
  eventDate: date("event_date").notNull(),
  giftStatus: varchar("gift_status", { length: 20 }).default("none"), // none/needed/bought/sent
  rsvpStatus: varchar("rsvp_status", { length: 20 }).default("pending"), // pending/yes/no
  rsvpDeadline: date("rsvp_deadline"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const healthRecords = pgTable("health_records", {
  id: serial("id").primaryKey(),
  memberName: varchar("member_name", { length: 100 }).notNull(),
  recordType: varchar("record_type", { length: 30 }).notNull(), // appointment/vaccination/prescription/checkup
  provider: varchar("provider", { length: 200 }),
  scheduledDate: date("scheduled_date"),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const familySettings = pgTable("family_settings", {
  id: serial("id").primaryKey(),
  city: varchar("city", { length: 100 }),
  homeAddress: text("home_address"),
  familyName: varchar("family_name", { length: 100 }),
  partnerName: varchar("partner_name", { length: 100 }),
  groceryService: varchar("grocery_service", { length: 100 }),
  setupCompleted: boolean("setup_completed").default(false),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 10 }).notNull(), // user/assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── Types ──────────────────────────────────────────────────────────────────────

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Habit = typeof habits.$inferSelect
export type NewHabit = typeof habits.$inferInsert
export type HabitLog = typeof habitLogs.$inferSelect
export type Note = typeof notes.$inferSelect
export type Goal = typeof goals.$inferSelect
export type NewGoal = typeof goals.$inferInsert
export type FamilyMember = typeof familyMembers.$inferSelect
export type Meal = typeof meals.$inferSelect
export type GroceryItem = typeof groceryItems.$inferSelect
export type Bill = typeof bills.$inferSelect
export type TravelPlan = typeof travelPlans.$inferSelect
export type SocialEvent = typeof socialEvents.$inferSelect
export type HealthRecord = typeof healthRecords.$inferSelect
export type FamilySettings = typeof familySettings.$inferSelect
export type ChatMessage = typeof chatMessages.$inferSelect
