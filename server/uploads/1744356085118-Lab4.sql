use Library
-- User defined Function, check if the price is alright a)
CREATE FUNCTION ValidatePrice (@Price FLOAT)
RETURNS BIT
AS
BEGIN
    -- Ensure price is positive, also is there a book that would cost more than 1000?
    IF @Price > 0 AND @Price < 1000
        RETURN 1; -- Valid
    RETURN 0; -- Invalid
END;

--The Procedure
CREATE PROCEDURE InsertAuthorAndBook
    @AuthorName NVARCHAR(100),
    @BirthDate DATE,
    @Name NVARCHAR(200),
    @Price FLOAT,
    @PublicationDate DATE
AS
BEGIN
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Insert into Author
        INSERT INTO Author (AuthorName, BirthDate)
        VALUES (@AuthorName, @BirthDate);

        -- Get the AuthorId of the newly inserted author
        DECLARE @AuthorId INT = SCOPE_IDENTITY();

        -- Validate the book's price using the user-defined function
        IF dbo.ValidatePrice(@Price) = 0
        BEGIN
            THROW 50001, 'Invalid book price.', 1;
        END;

        -- Insert into Book
        INSERT INTO Book (Name, Price, AuthorId, PublicationDate)
        VALUES (@Name, @Price, @AuthorId, @PublicationDate);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        -- Rethrow the error
        THROW;
    END CATCH;
END;

--Test
EXEC InsertAuthorAndBook 
    @AuthorName = 'J.K. Rowling', 
    @BirthDate = '1965-07-31',
    @Name = 'Harry Potter and the Sorcerer''s Stone',
    @Price = 120,
    @PublicationDate = '1997-01-01';

-- verifica
	SELECT 
    A.AuthorName AS Author,
    B.Name AS Book,
    B.PublicationDate,
    B.Pages,
    B.Price,
    B.Language,
    B.Stock
FROM 
    Author A
JOIN 
    Book B
ON 
    A.AuthorId = B.AuthorId
WHERE A.AuthorName='J.K. Rowling'
ORDER BY 
    A.AuthorName, B.Name;

--sterge modificarea anterioara, delete from book
DELETE FROM Book
WHERE Name = 'Harry Potter and the Sorcerer''s Stone'
AND Price = 120
AND PublicationDate = '1997-01-01';

-- delete the author
DELETE FROM Author
WHERE AuthorName = 'J.K. Rowling'
AND BirthDate = '1965-07-31';


--VIEW b)
CREATE VIEW BookDetailsView AS
SELECT 
    b.BookId,
    b.Name AS BookName,
    b.PublicationDate,
    b.Pages,
    b.Price,
    b.Language,
    b.Stock,
    a.AuthorName,
    ISNULL(p.Name, 'Unknown Publisher') AS PublisherName -- trebuie sa bag asta pentru ca in Entry uri doar la una singura am un Publisher bagat si altfel n ar fi mers
FROM 
    Book b
    INNER JOIN Author a ON b.AuthorId = a.AuthorId
    INNER JOIN Publisher p ON b.PublisherId = p.PublisherId;


--Test
SELECT 
    BookName,
    AuthorName,
    PublisherName,
    Price,
    Stock
FROM 
    BookDetailsView
WHERE 
    Stock > 0 AND Language = 'English'  
ORDER BY 
    Price DESC;

SELECT * FROM Book

-- Log Table c)
CREATE TABLE LogTable (
    LogId INT PRIMARY KEY IDENTITY(1,1),
    LogDateTime DATETIME NOT NULL,
    ActionType NVARCHAR(10) NOT NULL,
    TableName NVARCHAR(50) NOT NULL,
    AffectedCount INT NOT NULL
);


--Trigger for Book table
CREATE TRIGGER trg_Book_Operations
ON Book
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActionType NVARCHAR(10);
    DECLARE @AffectedCount INT;

    -- Determines the type of acction
    IF EXISTS (SELECT 1 FROM INSERTED) AND EXISTS (SELECT 1 FROM DELETED)
        SET @ActionType = 'UPDATE';
    ELSE IF EXISTS (SELECT 1 FROM INSERTED)
        SET @ActionType = 'INSERT';
    ELSE IF EXISTS (SELECT 1 FROM DELETED)
        SET @ActionType = 'DELETE';

    -- Determines how many rows were affected
    IF @ActionType = 'INSERT'
        SELECT @AffectedCount = COUNT(*) FROM INSERTED;
    ELSE IF @ActionType = 'UPDATE'
        SELECT @AffectedCount = COUNT(*) FROM INSERTED;
    ELSE IF @ActionType = 'DELETE'
        SELECT @AffectedCount = COUNT(*) FROM DELETED;

    -- Adds a new entry into LogTable
    INSERT INTO LogTable (LogDateTime, ActionType, TableName, AffectedCount)
    VALUES (GETDATE(), @ActionType, 'Book', @AffectedCount);
END;


-- Test INSERT
INSERT INTO Book (Name, PublicationDate, Pages, Price, Language, Stock, AuthorId, PublisherId)
VALUES ('New Book', '2023-10-01', 300, 35.50, 'English', 10, 1, NULL);
Select * FROM Book

-- Test UPDATE
UPDATE Book
SET Price = 40.00
WHERE Name = 'New Book';
Select * FROM Book

-- Test DELETE
DELETE FROM Book
WHERE Name = 'New Book';
Select * FROM Book

-- Verify the LogTable
SELECT * FROM LogTable;
DELETE FROM LogTable; -- si l stergem la loc



-- d)
-- Clustered index on BookId (deja e primary key)
CREATE CLUSTERED INDEX IX_Book_BookId ON Book(BookId);

-- Nonclustered index on Price
CREATE NONCLUSTERED INDEX IX_Book_Price ON Book(Price);
--test pentru clustered index
SELECT 
    BookId, 
    Name, 
    Price 
FROM 
    Book
WHERE 
    BookId = 1; --clustered index seek pentru a gasi un rand specific

-- Test pt nonclustered index
SELECT 
    Name, 
    Price 
FROM 
    Book
WHERE 
    Price > 20; -- mai multe carti >20  produce nonclustered index scan

