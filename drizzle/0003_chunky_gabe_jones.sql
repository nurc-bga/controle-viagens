CREATE TABLE `departureArrivalRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordedAt` timestamp NOT NULL,
	`respondentName` varchar(160),
	`employeeId` varchar(80),
	`vehiclePlate` varchar(80) NOT NULL,
	`event` varchar(80),
	`kmInitial` int NOT NULL DEFAULT 0,
	`kmFinal` int NOT NULL DEFAULT 0,
	`serviceType` varchar(220),
	`summary` text,
	`fuelLevel` varchar(80),
	`vehicleCondition` varchar(120),
	`irregularity` text,
	`email` varchar(320),
	`declaration` text,
	`importedFile` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departureArrivalRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `trips` ADD `sourceSheet` varchar(80);