package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"os"
	"sort"
	"time"
)

type Task struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Link        string `json:"link"`
	Description string `json:"description"`
	Done        bool   `json:"done"`
}

var tasksByDate = make(map[string][]Task)

func loadData() error {
	data, err := os.ReadFile("data.json")
	if err != nil {
		// Create empty file if not exists
		return os.WriteFile("data.json", []byte("{}"), 0644)
	}
	return json.Unmarshal(data, &tasksByDate)
}

func saveData() error {
	data, err := json.MarshalIndent(tasksByDate, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("data.json", data, 0644)
}

func getSortedDates() []string {
	dates := make([]string, 0, len(tasksByDate))
	for date := range tasksByDate {
		dates = append(dates, date)
	}
	sort.Slice(dates, func(i, j int) bool {
		t1, _ := time.Parse("2006-01-02", dates[i])
		t2, _ := time.Parse("2006-01-02", dates[j])
		return t1.Before(t2)
	})
	return dates
}

func main() {
	if err := loadData(); err != nil {
		fmt.Println("Error loading data:", err)
	}

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/add", addTaskHandler)
	http.HandleFunc("/edit", editTaskHandler)
	http.HandleFunc("/toggle", toggleDoneHandler)

	fmt.Println("🚀 Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("static/index.html"))
	data := struct {
		TasksByDate map[string][]Task
		SortedDates []string
	}{
		TasksByDate: tasksByDate,
		SortedDates: getSortedDates(),
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

	task := Task{
		ID:          fmt.Sprintf("task-%d", time.Now().UnixNano()),
		Title:       r.FormValue("title"),
		Link:        r.FormValue("link"),
		Description: r.FormValue("description"),
		Done:        false,
	}

	tasksByDate[date] = append(tasksByDate[date], task)
	saveData()
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func editTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	date := r.FormValue("date")
	id := r.FormValue("id")

	for i, t := range tasksByDate[date] {
		if t.ID == id {
			tasksByDate[date][i].Title = r.FormValue("title")
			tasksByDate[date][i].Link = r.FormValue("link")
			tasksByDate[date][i].Description = r.FormValue("description")
			break
		}
	}
	saveData()
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func toggleDoneHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	date := r.FormValue("date")
	id := r.FormValue("id")

	for i, t := range tasksByDate[date] {
		if t.ID == id {
			tasksByDate[date][i].Done = !tasksByDate[date][i].Done
			break
		}
	}
	saveData()
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
