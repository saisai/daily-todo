package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"text/template"
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

func main() {
	if err := loadData(); err != nil {
		fmt.Println("Error loading data:", err)
		return
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl := template.Must(template.ParseFiles("static/index.html"))
		tmpl.Execute(w, tasksByDate)
	})

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
