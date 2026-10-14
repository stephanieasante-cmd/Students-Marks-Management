'use strict';

/* =====================================================================
   Student Marks Management System

   THE MAIN ARRAY
   `students` holds every record. Each item is one object: { id, name, mark }
   The total, average, highest and lowest are all worked out by looping
   through this array, just like the original Python program did with its
   `marks` list.
   ===================================================================== */

const STORAGE_KEY = 'student-marks-management-system.v1';

// Mark ranges. Each range has a matching counter in the array built by getRangeCounts().
const RANGES = [
  { label: 'Below 50', min: 0,  max: 49.999, cls: 'f' },
  { label: '50 - 59',  min: 50, max: 59.999, cls: 'd' },
  { label: '60 - 69',  min: 60, max: 69.999, cls: 'c' },
  { label: '70 - 79',  min: 70, max: 79.999, cls: 'b' },
  { label: '80 - 100', min: 80, max: 100,    cls: 'a' }
];

let students = [];      // the main array
let nextId = 1;         // the next unused record id
let editingId = null;   // id of the record being edited, or null when adding

const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------------
   Array operations
   --------------------------------------------------------------------- */

/** LINEAR SEARCH: check each item from the start until the id matches. Returns the index or -1. */
function findIndexById(id) {
  for (let i = 0; i < students.length; i++) {
    if (students[i].id === id) return i;
  }
  return -1;
}

/** Name shown for a student: their own name, or "Student 1", "Student 2" ... by position. */
function labelFor(student, position) {
  return student.name !== '' ? student.name : `Student ${position}`;
}

/** Same as the Python version: add up the marks, find the highest and the lowest. */
function getStatistics(list) {
  if (list.length === 0) return null;
  let total = 0;
  let highest = 0;     // index of the highest mark
  let lowest = 0;      // index of the lowest mark
  for (let i = 0; i < list.length; i++) {
    total += list[i].mark;
    if (list[i].mark > list[highest].mark) highest = i;
    if (list[i].mark < list[lowest].mark) lowest = i;
  }
  total = Math.round(total * 100) / 100;
  return { total, average: total / list.length, highest, lowest };
}

/** An array of 5 counters, one for each mark range. */
function getRangeCounts(list) {
  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < list.length; i++) {
    for (let r = 0; r < RANGES.length; r++) {
      if (list[i].mark >= RANGES[r].min && list[i].mark <= RANGES[r].max) { counts[r]++; break; }
    }
  }
  return counts;
}

/** The report rows: each student with their position, after searching and sorting. */
function getVisibleRows() {
  const term = $('search').value.trim().toLowerCase();
  const rows = [];
  for (let i = 0; i < students.length; i++) {          // keep students whose name matches the search
    const label = labelFor(students[i], i + 1);
    if (term === '' || label.toLowerCase().includes(term)) {
      rows.push({ student: students[i], number: i + 1, label });
    }
  }
  const sortBy = $('sort').value;                       // sorting the new list keeps the original order safe
  if (sortBy === 'name') rows.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  else if (sortBy === 'mark-desc') rows.sort((a, b) => b.student.mark - a.student.mark || a.number - b.number);
  else if (sortBy === 'mark-asc') rows.sort((a, b) => a.student.mark - b.student.mark || a.number - b.number);
  return rows;
}

/* ---------------------------------------------------------------------
   Saving in the browser
   --------------------------------------------------------------------- */

function saveStudents() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ students, nextId })); } catch (error) { /* storage unavailable */ }
}

function loadStudents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.students)) {
      const loaded = [];
      for (let i = 0; i < saved.students.length; i++) {
        const s = saved.students[i];
        if (s && Number.isInteger(s.id) && typeof s.name === 'string' && typeof s.mark === 'number' && s.mark >= 0 && s.mark <= 100) {
          loaded.push({ id: s.id, name: s.name, mark: s.mark });
        }
      }
      students = loaded;
      let highestId = 0;
      for (let i = 0; i < students.length; i++) if (students[i].id > highestId) highestId = students[i].id;
      nextId = Math.max(highestId + 1, Number.isInteger(saved.nextId) ? saved.nextId : 1);
    }
  } catch (error) { students = []; }
}

/* ---------------------------------------------------------------------
   Form: validation, add, edit, delete
   --------------------------------------------------------------------- */

function clearErrors() {
  $('error-name').textContent = '';
  $('error-mark').textContent = '';
}

/** Check the form. The mark must be a number from 0 to 100, as in the Python program. */
function readForm() {
  clearErrors();
  const name = $('student-name').value.trim().replace(/\s+/g, ' ');
  const raw = $('student-mark').value.trim();
  const mark = Number(raw);
  let valid = true;
  if (raw === '' || !Number.isFinite(mark)) { $('error-mark').textContent = 'Enter a mark.'; valid = false; }
  else if (mark < 0 || mark > 100) { $('error-mark').textContent = 'Invalid mark. Enter a score between 0 and 100.'; valid = false; }
  return { valid, name, mark: Math.round(mark * 100) / 100 };
}

function resetForm() {
  $('mark-form').reset();
  editingId = null;
  $('form-title').textContent = "Add a student's mark";
  $('save-btn').textContent = 'Add mark';
  $('cancel-btn').hidden = true;
  clearErrors();
}

function handleSubmit(event) {
  event.preventDefault();
  const result = readForm();
  if (!result.valid) { $('student-mark').focus(); return; }
  if (editingId !== null) {
    const index = findIndexById(editingId);             // find the slot, then replace the item
    if (index !== -1) students[index] = { id: editingId, name: result.name, mark: result.mark };
    showToast('Mark updated.');
  } else {
    students.push({ id: nextId, name: result.name, mark: result.mark });   // push adds to the end
    nextId++;
    showToast('Mark added.');
  }
  saveStudents();
  resetForm();
  render();
  $('student-name').focus();
}

function startEdit(id) {
  const index = findIndexById(id);
  if (index === -1) return;
  editingId = id;
  $('student-name').value = students[index].name;
  $('student-mark').value = students[index].mark;
  $('form-title').textContent = `Edit ${labelFor(students[index], index + 1)}`;
  $('save-btn').textContent = 'Save changes';
  $('cancel-btn').hidden = false;
  clearErrors();
  $('mark-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('student-mark').focus();
}

function deleteStudent(id) {
  const index = findIndexById(id);
  if (index === -1) return;
  const label = labelFor(students[index], index + 1);
  if (!window.confirm(`Delete the mark for ${label}?`)) return;
  students.splice(index, 1);                            // splice removes one item and closes the gap
  if (editingId === id) resetForm();
  saveStudents();
  render();
  showToast(`${label} deleted.`);
}

/* ---------------------------------------------------------------------
   Showing things on the page
   --------------------------------------------------------------------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatMark(value) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

function rangeClassFor(mark) {
  for (let r = 0; r < RANGES.length; r++) {
    if (mark >= RANGES[r].min && mark <= RANGES[r].max) return RANGES[r].cls;
  }
  return 'f';
}

function renderStats() {
  const stats = getStatistics(students);
  $('stat-count').textContent = students.length;
  $('stat-count-note').textContent = students.length === 0 ? 'No marks yet' : (students.length === 1 ? 'student recorded' : 'students recorded');
  if (!stats) {
    ['stat-total', 'stat-avg', 'stat-high', 'stat-low'].forEach((id) => { $(id).textContent = '\u2014'; });
    $('stat-high-name').textContent = '\u00a0';
    $('stat-low-name').textContent = '\u00a0';
    return;
  }
  $('stat-total').textContent = formatMark(stats.total);
  $('stat-avg').textContent = stats.average.toFixed(2);
  $('stat-high').textContent = formatMark(students[stats.highest].mark);
  $('stat-high-name').textContent = labelFor(students[stats.highest], stats.highest + 1);
  $('stat-low').textContent = formatMark(students[stats.lowest].mark);
  $('stat-low-name').textContent = labelFor(students[stats.lowest], stats.lowest + 1);
}

function renderDistribution() {
  const counts = getRangeCounts(students);
  let biggest = 0;
  for (let i = 0; i < counts.length; i++) if (counts[i] > biggest) biggest = counts[i];
  const box = $('distribution');
  box.replaceChildren();
  for (let i = RANGES.length - 1; i >= 0; i--) {          // show the highest range first
    const row = el('div', 'dist-row');
    row.append(el('span', 'range-label grade-' + RANGES[i].cls, RANGES[i].label));
    const track = el('div', 'dist-track');
    const bar = el('div', 'dist-bar grade-bar-' + RANGES[i].cls);
    bar.style.width = biggest === 0 ? '0%' : Math.round((counts[i] / biggest) * 100) + '%';
    track.append(bar);
    row.append(track, el('span', 'dist-count', String(counts[i])));
    box.append(row);
  }
  const passed = students.length - counts[0];
  $('distribution-note').textContent = students.length === 0
    ? 'How many students fall in each range.'
    : `${passed} of ${students.length} students scored 50 or more.`;
}

function renderTable() {
  const rows = getVisibleRows();
  const body = $('mark-table');
  body.replaceChildren();
  for (let i = 0; i < rows.length; i++) {
    const { student, number, label } = rows[i];
    const tr = el('tr');
    tr.append(el('td', 'muted', String(number)), el('td', 'name-cell', label));

    const markCell = el('td', 'mark-cell');
    const line = el('div', 'mark-line');
    const track = el('div', 'mark-track');
    const fill = el('div', 'mark-fill grade-bar-' + rangeClassFor(student.mark));
    fill.style.width = student.mark + '%';
    track.append(fill);
    line.append(track, el('strong', '', formatMark(student.mark)));
    markCell.append(line);
    tr.append(markCell);

    const actions = el('td', 'actions-col');
    const edit = el('button', 'link-btn', 'Edit');
    edit.type = 'button';
    edit.setAttribute('aria-label', `Edit ${label}`);
    edit.addEventListener('click', () => startEdit(student.id));
    const remove = el('button', 'link-btn danger', 'Delete');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${label}`);
    remove.addEventListener('click', () => deleteStudent(student.id));
    actions.append(edit, remove);
    tr.append(actions);
    body.append(tr);
  }

  // Totals row at the bottom of the report
  const foot = $('mark-foot');
  foot.replaceChildren();
  const stats = getStatistics(students);
  if (stats) {
    const tr = el('tr', 'table-foot');
    tr.append(el('td', '', ''), el('td', '', 'Total / Average'), el('td', '', `${formatMark(stats.total)}  /  ${stats.average.toFixed(2)}`), el('td', '', ''));
    foot.append(tr);
  }

  $('results-count').textContent = `Showing ${rows.length} of ${students.length} student${students.length === 1 ? '' : 's'}`;
  $('empty-state').hidden = rows.length > 0;
  if (rows.length === 0) {
    if (students.length === 0) {
      $('empty-title').textContent = 'No marks yet';
      $('empty-text').textContent = 'Add a mark with the form above, or load a few sample marks to try it out.';
    } else {
      $('empty-title').textContent = 'No matching students';
      $('empty-text').textContent = 'Try a different name.';
    }
  }
}

function render() {
  renderStats();
  renderDistribution();
  renderTable();
}

let toastTimer;
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------------------------------------------------------------------
   Report download (same layout as the printout in the Python program)
   --------------------------------------------------------------------- */

function buildReportText() {
  const stats = getStatistics(students);
  let text = '--- STUDENT MARKS REPORT ---\n\n';
  for (let i = 0; i < students.length; i++) {
    text += `${labelFor(students[i], i + 1)}: ${formatMark(students[i].mark)}\n`;
  }
  text += `\nTotal Marks: ${formatMark(stats.total)}\n`;
  text += `Class Average: ${stats.average.toFixed(2)}\n`;
  text += `Highest Mark: ${formatMark(students[stats.highest].mark)}\n`;
  text += `Lowest Mark: ${formatMark(students[stats.lowest].mark)}\n`;
  return text;
}

function downloadReport() {
  if (students.length === 0) { showToast('Add some marks first.'); return; }
  const blob = new Blob([buildReportText()], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'student-marks-report.txt';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

/* ---------------------------------------------------------------------
   Sample data and clearing
   --------------------------------------------------------------------- */

// Fictional students for demonstration only.
const SAMPLE_STUDENTS = [
  ['Ama Mensah', 88], ['Kwame Boateng', 74.5], ['Efua Owusu', 93], ['Yaw Asante', 58],
  ['Abena Sarpong', 81], ['Kofi Darko', 42], ['Akosua Frimpong', 67], ['Nana Addo Quaye', 76]
];

function loadSamples() {
  for (let i = 0; i < SAMPLE_STUDENTS.length; i++) {
    students.push({ id: nextId, name: SAMPLE_STUDENTS[i][0], mark: SAMPLE_STUDENTS[i][1] });
    nextId++;
  }
  saveStudents();
  render();
  showToast(`${SAMPLE_STUDENTS.length} sample marks added.`);
}

function clearAll() {
  if (students.length === 0) { showToast('There is nothing to clear.'); return; }
  if (!window.confirm(`Remove all ${students.length} marks? This cannot be undone.`)) return;
  students = [];                                         // an empty array starts the list again
  nextId = 1;
  saveStudents();
  resetForm();
  render();
  showToast('All marks removed.');
}

/* ---------------------------------------------------------------------
   Start
   --------------------------------------------------------------------- */

$('mark-form').addEventListener('submit', handleSubmit);
$('cancel-btn').addEventListener('click', resetForm);
$('search').addEventListener('input', renderTable);
$('sort').addEventListener('change', renderTable);
$('sample-btn').addEventListener('click', loadSamples);
$('clear-btn').addEventListener('click', clearAll);
$('download-btn').addEventListener('click', downloadReport);

loadStudents();
render();
