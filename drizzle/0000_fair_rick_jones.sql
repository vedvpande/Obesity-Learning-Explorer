CREATE TABLE "countries" (
	"code" char(3) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obesity_rates" (
	"country_code" char(3) NOT NULL,
	"year" smallint NOT NULL,
	"rate_percent" numeric NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "obesity_rates_country_code_year_pk" PRIMARY KEY("country_code","year"),
	CONSTRAINT "obesity_rates_year_range" CHECK ("obesity_rates"."year" BETWEEN 1990 AND 2022),
	CONSTRAINT "obesity_rates_rate_range" CHECK ("obesity_rates"."rate_percent" >= 0 AND "obesity_rates"."rate_percent" <= 100)
);
--> statement-breakpoint
CREATE TABLE "saved_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"country_code" char(3) NOT NULL,
	"year" smallint NOT NULL,
	"rate_percent" numeric NOT NULL,
	"source" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_facts_year_range" CHECK ("saved_facts"."year" BETWEEN 1990 AND 2022),
	CONSTRAINT "saved_facts_rate_range" CHECK ("saved_facts"."rate_percent" >= 0 AND "saved_facts"."rate_percent" <= 100),
	CONSTRAINT "saved_facts_note_length" CHECK (char_length("saved_facts"."note") <= 280)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
ALTER TABLE "obesity_rates" ADD CONSTRAINT "obesity_rates_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_facts" ADD CONSTRAINT "saved_facts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_facts" ADD CONSTRAINT "saved_facts_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "obesity_rates_year_idx" ON "obesity_rates" USING btree ("year");--> statement-breakpoint
CREATE INDEX "saved_facts_user_created_idx" ON "saved_facts" USING btree ("user_id","created_at" DESC NULLS LAST);