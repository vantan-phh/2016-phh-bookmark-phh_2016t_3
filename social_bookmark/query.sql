CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(16) NOT NULL,
  `mail` varchar(255) NOT NULL,
  `salt` char(8) NOT NULL,
  `hash` char(64) NOT NULL,
  `nick_name` varchar(32) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `introduction` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `mail` (`mail`),
  UNIQUE KEY `user_id` (`user_id`)
);

CREATE TABLE `organizations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `introduction` varchar(128) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
);

CREATE TABLE `organization_memberships` (
  `user_id` int(11) NOT NULL,
  `org_id` int(11) NOT NULL,
  `is_admin` tinyint(1) DEFAULT NULL
);

CREATE TABLE `bookmarks` (
  `bookmark_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `org_id` int(11) DEFAULT NULL,
  `title` varchar(32) NOT NULL,
  `url` varchar(2083) NOT NULL,
  `description` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`bookmark_id`),
  UNIQUE KEY `bookmark_id` (`bookmark_id`)
);

CREATE TABLE `comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `bookmark_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `body` varchar(128) NOT NULL,
  PRIMARY KEY (`comment_id`),
  UNIQUE KEY `comment_id` (`comment_id`)
);

CREATE TABLE `sessions` (
  `session_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text COLLATE utf8_bin,
  PRIMARY KEY (`session_id`)
);
