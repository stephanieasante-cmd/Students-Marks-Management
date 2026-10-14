# Student Marks Management System

A web page version of the Python marks program. Enter each student's mark and the page works out the total, class average, highest and lowest mark. Built with HTML, CSS and JavaScript only. No installation is needed.

## How to run

Open `index.html` in a browser.

## What it does

- Add a mark from 0 to 100 (a name is optional; without one the student is called "Student 1", "Student 2" and so on). Marks outside 0-100 are rejected with the same message as the Python program.
- Total, class average, highest and lowest mark update straight away.
- A mark ranges chart shows how many students fall in each range.
- A report table shows every student's mark with a bar. Edit or delete any mark, search by name, and sort by name or mark.
- "Download report" saves a text file laid out like the Python program's printout.
- Data is saved in the browser, so it is still there after a refresh.
- "Load sample marks" adds fictional demo data. "Clear all" empties the list.

## From Python to the web page

| Python program | Web page (`script.js`) |
|---|---|
| `marks = []` | `students` array (each item holds a name and a mark) |
| `marks.append(score)` | `students.push(...)` |
| `if 0 <= score <= 100` | mark check in `readForm` |
| `sum(marks)` | loop in `getStatistics` |
| `max(marks)` and `min(marks)` | same loop finds the highest and lowest |
| `total / len(marks)` | average in `getStatistics` |
| `for i, score in enumerate(marks, start=1)` | loop that builds the report table |

The web page also lets you edit and delete marks. Deleting uses `splice`, and finding a record uses a linear search (`findIndexById`).

## Notes

The sample students are fictional.
