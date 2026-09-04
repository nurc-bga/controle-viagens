ALTER TABLE `trips` MODIFY COLUMN `vehiclePlate` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` MODIFY COLUMN `plate` varchar(80) NOT NULL;