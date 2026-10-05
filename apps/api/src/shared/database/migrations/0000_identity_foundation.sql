CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_family_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"device_context" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"replaced_by_session_id" uuid,
	"rotated_at" timestamp with time zone,
	CONSTRAINT "user_sessions_refresh_token_hash_ck" CHECK ("user_sessions"."refresh_token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "user_sessions_revocation_reason_ck" CHECK ("user_sessions"."revocation_reason" IS NULL OR "user_sessions"."revocation_reason" IN ('ROTATED','SUPERSEDED','REPLAY_REPLACED','LOGOUT','LOGOUT_ALL','REUSE_DETECTED','ACCOUNT_ACTION')),
	CONSTRAINT "user_sessions_revocation_consistency_ck" CHECK (("user_sessions"."revoked_at" IS NULL) = ("user_sessions"."revocation_reason" IS NULL)),
	CONSTRAINT "user_sessions_rotation_consistency_ck" CHECK (("user_sessions"."revocation_reason" IS NOT DISTINCT FROM 'ROTATED') = ("user_sessions"."rotated_at" IS NOT NULL)),
	CONSTRAINT "user_sessions_rotation_link_ck" CHECK ("user_sessions"."rotated_at" IS NULL OR "user_sessions"."replaced_by_session_id" IS NOT NULL),
	CONSTRAINT "user_sessions_not_self_replaced_ck" CHECK ("user_sessions"."replaced_by_session_id" <> "user_sessions"."id"),
	CONSTRAINT "user_sessions_expiry_ck" CHECK ("user_sessions"."expires_at" > "user_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_e164" varchar(20) NOT NULL,
	"phone_verified_at" timestamp with time zone NOT NULL,
	"date_of_birth" date NOT NULL,
	"account_status" text DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"onboarding_status" text NOT NULL,
	"onboarding_step" text NOT NULL,
	"discoverable" boolean DEFAULT false NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_e164_format_ck" CHECK ("users"."phone_e164" ~ '^\+[1-9][0-9]{6,14}$'),
	CONSTRAINT "users_account_status_ck" CHECK ("users"."account_status" IN ('ACTIVE','PENDING_VERIFICATION','LIMITED','UNDER_REVIEW','SUSPENDED','BANNED','DEACTIVATED','DELETION_PENDING','DELETED')),
	CONSTRAINT "users_onboarding_status_ck" CHECK ("users"."onboarding_status" IN ('NOT_STARTED','IN_PROGRESS','COMPLETE')),
	CONSTRAINT "users_onboarding_step_ck" CHECK ("users"."onboarding_step" IN ('AGE','PHONE','NAME','GENDER','LOCATION','INTENT','LANGUAGE','INTERESTS','PHOTO','ABOUT','VERIFICATION','NOTIFICATIONS','COMPLETE')),
	CONSTRAINT "users_date_of_birth_floor_ck" CHECK ("users"."date_of_birth" >= DATE '1900-01-01'),
	CONSTRAINT "users_minimum_age_at_creation_ck" CHECK ("users"."date_of_birth" <= (("users"."created_at" AT TIME ZONE 'Etc/GMT+12')::date - INTERVAL '18 years')::date)
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" uuid,
	"action_code" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"reason_code" text,
	"correlation_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_actor_type_ck" CHECK ("audit_events"."actor_type" IN ('USER','ADMIN','SYSTEM','SERVICE'))
);
--> statement-breakpoint
CREATE TABLE "gender_options" (
	"code" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(50),
	"gender_code" text,
	"gender_self_description" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_first_name_not_blank_ck" CHECK ("user_profiles"."first_name" IS NULL OR length(btrim("user_profiles"."first_name")) > 0),
	CONSTRAINT "user_profiles_gender_self_description_ck" CHECK ("user_profiles"."gender_self_description" IS NULL OR ("user_profiles"."gender_code" IS NOT NULL AND "user_profiles"."gender_code" = 'SELF_DESCRIBE'))
);
--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_replaced_by_session_id_user_sessions_id_fk" FOREIGN KEY ("replaced_by_session_id") REFERENCES "public"."user_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_gender_code_gender_options_code_fk" FOREIGN KEY ("gender_code") REFERENCES "public"."gender_options"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_uq" ON "user_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_token_family_id_idx" ON "user_sessions" USING btree ("token_family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_e164_not_deleted_uq" ON "users" USING btree ("phone_e164") WHERE "users"."account_status" <> 'DELETED';--> statement-breakpoint
-- MANUALLY ADDED (reviewed seed, not generated by drizzle-kit):
-- DATA-MODEL §gender_options initial codes; labels per SFS O02.
INSERT INTO "gender_options" ("code", "label", "display_order") VALUES
	('WOMAN', 'Woman', 1),
	('MAN', 'Man', 2),
	('NON_BINARY', 'Non-binary', 3),
	('SELF_DESCRIBE', 'Prefer to self-describe', 4),
	('PREFER_NOT_TO_SAY', 'Prefer not to say', 5);
