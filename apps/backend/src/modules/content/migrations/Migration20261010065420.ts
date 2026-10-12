import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261010065420 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "content_banner" ("id" text not null, "placement" text check ("placement" in ('hero', 'promo', 'announcement')) not null default 'hero', "title" text not null, "subtitle" text null, "eyebrow" text null, "image_url" text null, "mobile_image_url" text null, "cta_label" text null, "cta_url" text null, "theme" text check ("theme" in ('dark', 'light')) not null default 'dark', "rank" integer not null default 0, "is_active" boolean not null default true, "starts_at" timestamptz null, "ends_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "content_banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_content_banner_deleted_at" ON "content_banner" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_content_banner_placement_is_active_rank" ON "content_banner" ("placement", "is_active", "rank") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "content_banner" cascade;`);
  }

}
