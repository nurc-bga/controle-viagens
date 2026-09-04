CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripDate` timestamp NOT NULL,
	`vehicleId` int,
	`vehiclePlate` varchar(16) NOT NULL,
	`vehicleModel` varchar(120),
	`driverName` varchar(160) NOT NULL,
	`origin` varchar(160),
	`destination` varchar(160),
	`purpose` varchar(180),
	`distanceKm` int NOT NULL DEFAULT 0,
	`durationMinutes` int NOT NULL DEFAULT 0,
	`status` enum('Concluída','Em andamento','Cancelada') NOT NULL DEFAULT 'Concluída',
	`notes` text,
	`importedFile` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plate` varchar(16) NOT NULL,
	`model` varchar(120),
	`category` varchar(80),
	`year` int,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_plate_unique` UNIQUE(`plate`)
);
