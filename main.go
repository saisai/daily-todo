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
	Title       string `json:"title"`
	Link        string `json:"link"`
	Description string `json:"description"`
}

var tasksByDate = make(map[string][]Task)

func loadData() error {
	data, err := os.ReadFile("data.json")
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &tasksByDate)
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
		return
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl := template.Must(template.ParseFiles("static/index.html"))
		data := struct {
			TasksByDate map[string][]Task
			SortedDates []string
		}{
			TasksByDate: tasksByDate,
			SortedDates: getSortedDates(),
		}
		tmpl.Execute(w, data)
	})

	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
