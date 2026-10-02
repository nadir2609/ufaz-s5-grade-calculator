(function () {
  "use strict";

  var STORAGE_KEY = "ufaz-s5-grades";
  var semester = Grades.SEMESTER_5;
  var inputs = {};

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function loadSaved() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === "object" ? saved : {};
    } catch (e) {
      return {};
    }
  }

  function save() {
    var raw = {};
    Object.keys(inputs).forEach(function (id) {
      if (inputs[id].value !== "") raw[id] = inputs[id].value;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch (e) {
      // Storage unavailable: the page still works, it just won't remember.
    }
  }

  function buildResult(id, withStatus) {
    var result = el("div", "result");
    var avg = el("span", "avg", "—");
    avg.id = "avg-" + id;
    result.appendChild(avg);
    if (withStatus) {
      var status = el("span", "status");
      status.id = "status-" + id;
      result.appendChild(status);
    }
    return result;
  }

  function buildField(a, saved) {
    var field = el("div", "field");

    var label = el("label", "", a.name + " ");
    label.htmlFor = a.id;
    label.appendChild(el("span", "coef", "× " + a.coef));

    var input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.placeholder = "0–20";
    input.id = a.id;
    input.setAttribute("aria-describedby", "err-" + a.id);
    if (typeof saved[a.id] === "string") input.value = saved[a.id];
    inputs[a.id] = input;

    var error = el("span", "error", "Enter a number from 0 to 20");
    error.id = "err-" + a.id;
    error.hidden = true;

    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(error);
    return field;
  }

  function buildForm(container, saved) {
    semester.ues.forEach(function (ue) {
      var card = el("section", "ue");

      var head = el("div", "ue-head");
      head.appendChild(el("h2", "", ue.name));
      head.appendChild(el("span", "coef", "coef. " + ue.coef));
      head.appendChild(buildResult(ue.id, true));
      card.appendChild(head);

      ue.subjects.forEach(function (subject) {
        var block = el("div", "subject");

        var subjectHead = el("div", "subject-head");
        subjectHead.appendChild(el("h3", "", subject.name));
        subjectHead.appendChild(el("span", "coef", "coef. " + subject.coef));
        subjectHead.appendChild(buildResult(subject.id, false));
        block.appendChild(subjectHead);

        var fields = el("div", "fields");
        subject.assessments.forEach(function (a) {
          fields.appendChild(buildField(a, saved));
        });
        block.appendChild(fields);

        card.appendChild(block);
      });

      container.appendChild(card);
    });
  }

  function showAverage(id, average) {
    document.getElementById("avg-" + id).textContent = Grades.formatGrade(average);
    var status = document.getElementById("status-" + id);
    if (!status) return;
    if (average === null) {
      status.textContent = "";
      status.className = "status";
    } else if (Grades.isValidated(average)) {
      status.textContent = "Validated";
      status.className = "status ok";
    } else {
      status.textContent = "Not validated";
      status.className = "status ko";
    }
  }

  function update() {
    var grades = {};
    Object.keys(inputs).forEach(function (id) {
      var input = inputs[id];
      var value = Grades.parseGrade(input.value);
      var invalid = value !== null && isNaN(value);
      input.classList.toggle("invalid", invalid);
      input.setAttribute("aria-invalid", String(invalid));
      document.getElementById("err-" + id).hidden = !invalid;
      if (value !== null && !invalid) grades[id] = value;
    });

    var result = Grades.compute(semester, grades);
    showAverage("semester", result.average);
    result.ues.forEach(function (ue) {
      showAverage(ue.id, ue.average);
      ue.subjects.forEach(function (subject) {
        showAverage(subject.id, subject.average);
      });
    });
    document.getElementById("progress").textContent =
      result.entered + " of " + result.total + " grades entered";
  }

  var container = document.getElementById("ues");
  buildForm(container, loadSaved());

  container.addEventListener("input", function () {
    save();
    update();
  });

  document.getElementById("reset").addEventListener("click", function () {
    if (!window.confirm("Clear all grades?")) return;
    Object.keys(inputs).forEach(function (id) {
      inputs[id].value = "";
    });
    save();
    update();
  });

  update();
})();
