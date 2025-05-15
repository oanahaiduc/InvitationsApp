USE Formula1;


-- Create the versioning table to track changes
CREATE TABLE DatabaseVersion (
    VersionID INT PRIMARY KEY IDENTITY(1,1),
    VersionNumber INT NOT NULL,
    AppliedDate DATETIME DEFAULT GETDATE()
);


-- Stored Procedure to modify the column type (Example Task 1)
CREATE PROCEDURE Apply_ModifyColumnType
AS
BEGIN
    ALTER TABLE Circuits ALTER COLUMN Length DECIMAL(10, 2);
    INSERT INTO DatabaseVersion (VersionNumber) VALUES (1);
END;

EXEC Apply_ModifyColumnType;


-- Stored Procedure to revert the modification (Revert Task 1)
CREATE PROCEDURE Revert_ModifyColumnType
AS
BEGIN
    ALTER TABLE Circuits ALTER COLUMN Length FLOAT;
    DELETE FROM DatabaseVersion WHERE VersionNumber = 1;
END;

EXEC Revert_ModifyColumnType;


-- Stored Procedure to add a default constraint (Example Task 2)
CREATE PROCEDURE Apply_AddDefaultConstraint
AS
BEGIN
    ALTER TABLE Teams ADD CONSTRAINT DF_Teams_FoundedYear DEFAULT 1950 FOR FoundedYear;
    INSERT INTO DatabaseVersion (VersionNumber) VALUES (2);
END;

EXEC Apply_AddDefaultConstraint;


-- Stored Procedure to remove the default constraint (Revert Task 2)
CREATE PROCEDURE Revert_AddDefaultConstraint
AS
BEGIN
    ALTER TABLE Teams DROP CONSTRAINT DF_Teams_FoundedYear;
    DELETE FROM DatabaseVersion WHERE VersionNumber = 2;
END;

EXEC Revert_AddDefaultConstraint;


-- Stored Procedure to add a column (Example Task 3)
CREATE PROCEDURE Apply_AddColumn
AS
BEGIN
    ALTER TABLE Teams ADD Budget DECIMAL(18, 2);
    INSERT INTO DatabaseVersion (VersionNumber) VALUES (3);
END;

EXEC Apply_AddColumn;


-- Stored Procedure to remove the added column (Revert Task 3)
CREATE PROCEDURE Revert_AddColumn
AS
BEGIN
    ALTER TABLE Teams DROP COLUMN Budget;
    DELETE FROM DatabaseVersion WHERE VersionNumber = 3;
END;

EXEC Revert_AddColumn;


-- Stored Procedure to create a table (Example Task 4)
CREATE PROCEDURE Apply_CreateTable
AS
BEGIN
    CREATE TABLE Sponsors (
        SponsorID INT PRIMARY KEY IDENTITY(1,1),
        SponsorName NVARCHAR(100),
        ContractValue DECIMAL(18, 2)
    );
    INSERT INTO DatabaseVersion (VersionNumber) VALUES (4);
END;

EXEC Apply_CreateTable;


-- Stored Procedure to drop the created table (Revert Task 4)
CREATE PROCEDURE Revert_CreateTable
AS
BEGIN
    DROP TABLE Sponsors;
    DELETE FROM DatabaseVersion WHERE VersionNumber = 4;
END;

EXEC Revert_CreateTable;


-- Stored Procedure to add a foreign key (Example Task 5)
CREATE PROCEDURE Apply_AddForeignKey
AS
BEGIN
    ALTER TABLE Drivers ADD CONSTRAINT FK_Drivers_Team FOREIGN KEY (TeamID) REFERENCES Teams(TeamID);
    INSERT INTO DatabaseVersion (VersionNumber) VALUES (5);
END;

EXEC Apply_AddForeignKey;


-- Stored Procedure to remove the foreign key (Revert Task 5)
CREATE PROCEDURE Revert_AddForeignKey
AS
BEGIN
    ALTER TABLE Drivers DROP CONSTRAINT FK_Drivers_Team;
    DELETE FROM DatabaseVersion WHERE VersionNumber = 5;
END;

EXEC Revert_AddForeignKey;


-- Stored Procedure to transition to a specified version
CREATE PROCEDURE SetDatabaseVersion
    @TargetVersion INT
AS
BEGIN
    DECLARE @CurrentVersion INT;
	SELECT @CurrentVersion = ISNULL(MAX(VersionNumber), 0) FROM DatabaseVersion;
   
    IF @TargetVersion = @CurrentVersion
    BEGIN
        PRINT 'The database is already at the target version.';
        RETURN;
    END;

    IF @TargetVersion < 0 OR @TargetVersion > 5
    BEGIN
        PRINT 'Invalid target version. Target version must be between 1 and 5.';
       	RETURN;
    END;

    WHILE @CurrentVersion < @TargetVersion
    BEGIN
        SET @CurrentVersion = @CurrentVersion + 1;
        IF @CurrentVersion = 1 EXEC Apply_ModifyColumnType;
        ELSE IF @CurrentVersion = 2 EXEC Apply_AddDefaultConstraint;
        ELSE IF @CurrentVersion = 3 EXEC Apply_AddColumn;
        ELSE IF @CurrentVersion = 4 EXEC Apply_CreateTable;
        ELSE IF @CurrentVersion = 5 EXEC Apply_AddForeignKey;
    END

    WHILE @CurrentVersion > @TargetVersion
    BEGIN
        IF @CurrentVersion = 5 EXEC Revert_AddForeignKey;
        ELSE IF @CurrentVersion = 4 EXEC Revert_CreateTable;
        ELSE IF @CurrentVersion = 3 EXEC Revert_AddColumn;
        ELSE IF @CurrentVersion = 2 EXEC Revert_AddDefaultConstraint;
        ELSE IF @CurrentVersion = 1 EXEC Revert_ModifyColumnType;
        SET @CurrentVersion = @CurrentVersion - 1;
    END
END;

EXEC SetDatabaseVersion @TargetVersion = 0;
EXEC SetDatabaseVersion @TargetVersion = 4;
EXEC SetDatabaseVersion @TargetVersion = 1;
EXEC SetDatabaseVersion @TargetVersion = 100;

SELECT * FROM DatabaseVersion;