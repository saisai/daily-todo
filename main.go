package main

import (
	"database/sql"
	"fmt"
	"html/template"
	"net/http"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Task struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Link        string `json:"link"`
	Description string `json:"description"`
	Done        bool   `json:"done"`
	Date        string `json:"date"`
}

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "todos.db")
	if err != nil {
		panic(err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS tasks (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL,
			title TEXT NOT NULL,
			link TEXT,
			description TEXT,
			done BOOLEAN DEFAULT 0
		)
	`)
	if err != nil {
		panic(err)
	}
}

func getSortedDates() []string {
	rows, err := db.Query("SELECT DISTINCT date FROM tasks ORDER BY date ASC")
	if err != nil {
		return []string{}
	}
	defer rows.Close()

	var dates []string
	for rows.Next() {
		var date string
		rows.Scan(&date)
		dates = append(dates, date)
	}
	return dates
}

func getTasksByDate(date string) []Task {
	rows, err := db.Query("SELECT id, title, link, description, done FROM tasks WHERE date = ? ORDER BY id", date)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var t Task
		t.Date = date
		rows.Scan(&t.ID, &t.Title, &t.Link, &t.Description, &t.Done)
		tasks = append(tasks, t)
	}
	return tasks
}

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/add", addTaskHandler)
	http.HandleFunc("/toggle", toggleDoneHandler)
	http.HandleFunc("/edit", editTaskHandler)

	fmt.Println("🚀 Server running on http://localhost:8080")
	fmt.Println("Database: todos.db")
	http.ListenAndServe(":8080", nil)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	dates := getSortedDates()
	tasksByDate := make(map[string][]Task)

	for _, date := range dates {
		tasksByDate[date] = getTasksByDate(date)
	}

	tmpl := template.Must(template.ParseFiles("static/index.html"))
	data := struct {
		TasksByDate map[string][]Task
		SortedDates []string
	}{
		TasksByDate: tasksByDate,
		SortedDates: dates,
	}
	tmpl.Execute(w, data)
}

func addTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	date := r.FormValue("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	_, err := db.Exec(`
		INSERT INTO tasks (id, date, title, link, description, done)
		VALUES (?, ?, ?, ?, ?, 0)
	`, fmt.Sprintf("task-%d", time.Now().UnixNano()),
		date,
		r.FormValue("title"),
		r.FormValue("link"),
		r.FormValue("description"))

	if err != nil {
		fmt.Println("Error adding task:", err)
	}

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func toggleDoneHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	id := r.FormValue("id")
	_, err := db.Exec("UPDATE tasks SET done = NOT done WHERE id = ?", id)
	if err != nil {
		fmt.Println("Error toggling task:", err)
	}

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func editTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	id := r.FormValue("id")
	date := r.FormValue("date")

	_, err := db.Exec(`
		UPDATE tasks 
		SET title = ?, link = ?, description = ?, date = ?
		WHERE id = ?
	`, r.FormValue("title"), r.FormValue("link"), r.FormValue("description"), date, id)

	if err != nil {
		fmt.Println("Error editing task:", err)
	}

	http.Redirect(w, r, "/", http.StatusSeeOther)
}
