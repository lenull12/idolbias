-- Migration 0004: Add feed, cosmo, subscriptions and gem_purchases tables
CREATE TABLE IF NOT EXISTS `feed_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `member_id` text NOT NULL,
  `group_id` text NOT NULL,
  `image_url` text NOT NULL,
  `caption` text,
  `created_at` integer NOT NULL
);
CREATE TABLE IF NOT EXISTS `feed_likes` (
  `id` text PRIMARY KEY NOT NULL,
  `post_id` text NOT NULL,
  `user_id` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX IF NOT EXISTS `feed_unique_like` ON `feed_likes` (`post_id`,`user_id`);
CREATE TABLE IF NOT EXISTS `feed_comments` (
  `id` text PRIMARY KEY NOT NULL,
  `post_id` text NOT NULL,
  `user_id` text,
  `author_name` text NOT NULL,
  `content` text NOT NULL,
  `is_official` integer DEFAULT false NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS `cosmo_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `member_id` text NOT NULL,
  `content` text NOT NULL,
  `image_url` text,
  `created_at` integer NOT NULL
);
CREATE TABLE IF NOT EXISTS `cosmo_replies` (
  `id` text PRIMARY KEY NOT NULL,
  `post_id` text NOT NULL,
  `user_id` text NOT NULL,
  `author_name` text NOT NULL,
  `content` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`post_id`) REFERENCES `cosmo_posts`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS `cosmo_featured_responses` (
  `id` text PRIMARY KEY NOT NULL,
  `post_id` text NOT NULL,
  `reply_id` text NOT NULL,
  `response_content` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`post_id`) REFERENCES `cosmo_posts`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`reply_id`) REFERENCES `cosmo_replies`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS `feed_subscriptions` (
  `player_id` text NOT NULL,
  `group_id` text NOT NULL,
  `member_id` text NOT NULL,
  `created_at` integer NOT NULL,
  PRIMARY KEY (`player_id`, `member_id`)
);
CREATE TABLE IF NOT EXISTS `gem_purchases` (
  `id` text PRIMARY KEY NOT NULL,
  `player_id` text NOT NULL,
  `stripe_session_id` text NOT NULL,
  `package_id` text NOT NULL,
  `gems_credited` integer NOT NULL,
  `amount_paid` integer NOT NULL,
  `currency` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer NOT NULL,
  `completed_at` integer,
  FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX IF NOT EXISTS `gem_purchases_session_idx` ON `gem_purchases` (`stripe_session_id`);
