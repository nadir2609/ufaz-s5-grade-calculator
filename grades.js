(function (root) {
  "use strict";

  // Digits with an optional dot or comma decimal part. A trailing separator
  // ("14.") is allowed so a field is not flagged while the user is typing.
  var GRADE_PATTERN = /^(\d+[.,]?\d*|[.,]\d+)$/;

  function parseGrade(text) {
    var s = String(text == null ? "" : text).trim();
    if (s === "") return null;
    if (!GRADE_PATTERN.test(s)) return NaN;
    var n = Number(s.replace(",", "."));
    return n <= 20 ? n : NaN;
  }

  function weightedAverage(items) {
    var sum = 0;
    var coefs = 0;
    items.forEach(function (item) {
      sum += item.value * item.coef;
      coefs += item.coef;
    });
    return coefs === 0 ? null : sum / coefs;
  }

  function roundGrade(n) {
    if (n === null) return null;
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function formatGrade(n) {
    return n === null ? "—" : roundGrade(n).toFixed(2);
  }

  // Decided on the rounded value so the marker never contradicts the
  // number shown next to it.
  function isValidated(n) {
    return n !== null && roundGrade(n) >= 10;
  }

  function assessment(id, name, coef) {
    return { id: id, name: name, coef: coef };
  }

  // Semester 5 of "MCC Licence 3 Informatique - Computer Sciences (UFAZ)",
  // 2026-2027, pages 8-9.
  var SEMESTER_5 = {
    name: "Semester 5",
    ues: [
      {
        id: "cs5a", name: "Computer Sciences 5a", coef: 10,
        subjects: [
          {
            id: "parallel", name: "Parallel Programming", coef: 1,
            assessments: [
              assessment("parallel-practical", "Practical work / Project", 1),
              assessment("parallel-written", "Written exam", 1)
            ]
          },
          {
            id: "cloud", name: "Cloud Computing", coef: 1,
            assessments: [
              assessment("cloud-practical", "Practical work / Project", 1),
              assessment("cloud-written", "Written exam", 1)
            ]
          },
          {
            id: "cert", name: "Software Certification", coef: 1,
            assessments: [
              assessment("cert-practical", "Practical work / Project", 1),
              assessment("cert-written", "Written exam", 1)
            ]
          }
        ]
      },
      {
        id: "cs5b", name: "Computer Sciences 5b", coef: 14,
        subjects: [
          {
            id: "os", name: "Operating Systems Architectures", coef: 5,
            assessments: [
              assessment("os-practical", "Practical work / Project", 2),
              assessment("os-written1", "First written exam", 2),
              assessment("os-written2", "Second written exam", 3)
            ]
          },
          {
            id: "mobile", name: "Mobile Application Development", coef: 4,
            assessments: [
              assessment("mobile-practical", "Practical work / Project", 2),
              assessment("mobile-written", "Written exam", 3)
            ]
          },
          {
            id: "cps", name: "Combinatorics, Probabilities, Statistics", coef: 5,
            assessments: [
              assessment("cps-written1", "First written exam", 3),
              assessment("cps-written2", "Second written exam", 5),
              assessment("cps-quiz", "Quiz", 2)
            ]
          }
        ]
      },
      {
        id: "lang5", name: "Language 5", coef: 3,
        subjects: [
          {
            id: "lang", name: "English or French", coef: 1,
            assessments: [
              assessment("lang-oral", "Oral evaluation", 3),
              assessment("lang-production", "Written production", 2),
              assessment("lang-written", "Written exam", 3)
            ]
          }
        ]
      },
      {
        id: "pp2", name: "Professional Preparation 2", coef: 3,
        subjects: [
          {
            id: "sciwrite", name: "Scientific Writing", coef: 1,
            assessments: [
              assessment("sciwrite-written1", "First written exam", 1),
              assessment("sciwrite-written2", "Second written exam", 1),
              assessment("sciwrite-written3", "Third written exam", 1)
            ]
          }
        ]
      }
    ]
  };

  function isGrade(value) {
    return typeof value === "number" && isFinite(value) && value >= 0 && value <= 20;
  }

  // Weighted average of the nodes whose result has an average; nodes with
  // nothing entered are left out rather than counted as zero.
  function averageOfEntered(nodes, results) {
    var items = [];
    nodes.forEach(function (node, i) {
      if (results[i].average !== null) {
        items.push({ value: results[i].average, coef: node.coef });
      }
    });
    return weightedAverage(items);
  }

  function compute(semester, grades) {
    grades = grades || {};
    var entered = 0;
    var total = 0;

    var ues = semester.ues.map(function (ue) {
      var subjects = ue.subjects.map(function (subject) {
        var items = [];
        subject.assessments.forEach(function (a) {
          total += 1;
          if (isGrade(grades[a.id])) {
            entered += 1;
            items.push({ value: grades[a.id], coef: a.coef });
          }
        });
        return { id: subject.id, average: weightedAverage(items) };
      });
      return { id: ue.id, average: averageOfEntered(ue.subjects, subjects), subjects: subjects };
    });

    return {
      average: averageOfEntered(semester.ues, ues),
      entered: entered,
      total: total,
      ues: ues
    };
  }

  var api = {
    SEMESTER_5: SEMESTER_5,
    parseGrade: parseGrade,
    weightedAverage: weightedAverage,
    roundGrade: roundGrade,
    formatGrade: formatGrade,
    isValidated: isValidated,
    compute: compute
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.Grades = api;
  }
})(typeof window !== "undefined" ? window : this);
