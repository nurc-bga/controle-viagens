CREATE TABLE `appSettings` (
	`key` varchar(80) NOT NULL,
	`value` varchar(255) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_key` PRIMARY KEY(`key`)
);
