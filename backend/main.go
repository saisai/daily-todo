package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

// Todo represents a todo item
type Todo struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Completed   bool      `json:"completed"`
	Priority    string    `json:"priority"` // low, medium, high
	Date        string    `json:"date"`      // YYYY-MM-DD
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateTodoRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
	Date        string `json:"date"`
}

type UpdateTodoRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Completed   *bool   `json:"completed"`
	Priority    *string `json:"priority"`
	Date        *string `json:"date"`
}

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./todos.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	createTable := `
	CREATE TABLE IF NOT EXISTS todos (
		id          INTEGER PRIMARY KEY AUTOINCREMENT,
		title       TEXT NOT NULL,
		description TEXT DEFAULT '',
		completed   BOOLEAN DEFAULT FALSE,
		priority    TEXT DEFAULT 'medium',
		date        TEXT DEFAULT '',
		created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err = db.Exec(createTable); err != nil {
		log.Fatal("Failed to create table:", err)
	}

	fmt.Println("Database initialized successfully")
}

func getTodos(c *gin.Context) {
	date := c.Query("date")
	completed := c.Query("completed")

	query := "SELECT id, title, description, completed, priority, date, created_at, updated_at FROM todos WHERE 1=1"
	args := []interface{}{}

	if date != "" {
		query += " AND date = ?"
		args = append(args, date)
	}
	if completed != "" {
		query += " AND completed = ?"
		args = append(args, completed == "true")
	}

	query += " ORDER BY created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	todos := []Todo{}
	for rows.Next() {
		var t Todo
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Completed, &t.Priority, &t.Date, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		todos = append(todos, t)
	}

	c.JSON(http.StatusOK, gin.H{"todos": todos, "count": len(todos)})
}

func getTodo(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var t Todo
	err = db.QueryRow("SELECT id, title, description, completed, priority, date, created_at, updated_at FROM todos WHERE id = ?", id).
		Scan(&t.ID, &t.Title, &t.Description, &t.Completed, &t.Priority, &t.Date, &t.CreatedAt, &t.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, t)
}

func createTodo(c *gin.Context) {
	var req CreateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Priority == "" {
		req.Priority = "medium"
	}
	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
	}

	result, err := db.Exec(
		"INSERT INTO todos (title, description, priority, date) VALUES (?, ?, ?, ?)",
		req.Title, req.Description, req.Priority, req.Date,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	var t Todo
	db.QueryRow("SELECT id, title, description, completed, priority, date, created_at, updated_at FROM todos WHERE id = ?", id).
		Scan(&t.ID, &t.Title, &t.Description, &t.Completed, &t.Priority, &t.Date, &t.CreatedAt, &t.UpdatedAt)

	c.JSON(http.StatusCreated, t)
}

func updateTodo(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build dynamic update query
	query := "UPDATE todos SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if req.Title != nil {
		query += ", title = ?"
		args = append(args, *req.Title)
	}
	if req.Description != nil {
		query += ", description = ?"
		args = append(args, *req.Description)
	}
	if req.Completed != nil {
		query += ", completed = ?"
		args = append(args, *req.Completed)
	}
	if req.Priority != nil {
		query += ", priority = ?"
		args = append(args, *req.Priority)
	}
	if req.Date != nil {
		query += ", date = ?"
		args = append(args, *req.Date)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	result, err := db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	var t Todo
	db.QueryRow("SELECT id, title, description, completed, priority, date, created_at, updated_at FROM todos WHERE id = ?", id).
		Scan(&t.ID, &t.Title, &t.Description, &t.Completed, &t.Priority, &t.Date, &t.CreatedAt, &t.UpdatedAt)

	c.JSON(http.StatusOK, t)
}

func deleteTodo(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := db.Exec("DELETE FROM todos WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todo deleted successfully"})
}

func getStats(c *gin.Context) {
	date := c.Query("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	var total, completed, pending int
	db.QueryRow("SELECT COUNT(*) FROM todos WHERE date = ?", date).Scan(&total)
	db.QueryRow("SELECT COUNT(*) FROM todos WHERE date = ? AND completed = TRUE", date).Scan(&completed)
	pending = total - completed

	c.JSON(http.StatusOK, gin.H{
		"date":      date,
		"total":     total,
		"completed": completed,
		"pending":   pending,
	})
}

func main() {
	initDB()
	defer db.Close()

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := r.Group("/api/v1")
	{
		api.GET("/todos", getTodos)
		api.GET("/todos/:id", getTodo)
		api.POST("/todos", createTodo)
		api.PATCH("/todos/:id", updateTodo)
		api.DELETE("/todos/:id", deleteTodo)
		api.GET("/stats", getStats)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	fmt.Println("Server running on http://localhost:8080")
	r.Run(":8080")
}
