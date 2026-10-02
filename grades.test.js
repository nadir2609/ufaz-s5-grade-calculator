"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Grades = require("./grades.js");

test("parseGrade returns null for empty input", () => {
  assert.equal(Grades.parseGrade(""), null);
  assert.equal(Grades.parseGrade("   "), null);
  assert.equal(Grades.parseGrade(null), null);
  assert.equal(Grades.parseGrade(undefined), null);
});

test("parseGrade accepts dot and comma decimals", () => {
  assert.equal(Grades.parseGrade("14.5"), 14.5);
  assert.equal(Grades.parseGrade("14,5"), 14.5);
  assert.equal(Grades.parseGrade(" 7 "), 7);
  assert.equal(Grades.parseGrade(".5"), 0.5);
});

test("parseGrade accepts the 0 and 20 boundaries", () => {
  assert.equal(Grades.parseGrade("0"), 0);
  assert.equal(Grades.parseGrade("20"), 20);
  assert.equal(Grades.parseGrade("20.0"), 20);
});

test("parseGrade accepts a value still being typed", () => {
  assert.equal(Grades.parseGrade("14."), 14);
  assert.equal(Grades.parseGrade("14,"), 14);
});

test("parseGrade rejects out-of-range values", () => {
  assert.ok(Number.isNaN(Grades.parseGrade("-1")));
  assert.ok(Number.isNaN(Grades.parseGrade("20.01")));
  assert.ok(Number.isNaN(Grades.parseGrade("25")));
});

test("parseGrade rejects number-like junk", () => {
  for (const text of ["abc", "1e1", "+5", "Infinity", "0x10", "1 2", "1.2.3", "1,2,3", ".", ","]) {
    assert.ok(Number.isNaN(Grades.parseGrade(text)), "should reject " + JSON.stringify(text));
  }
});

test("weightedAverage returns null for an empty list", () => {
  assert.equal(Grades.weightedAverage([]), null);
});

test("weightedAverage with equal coefficients is the plain mean", () => {
  assert.equal(Grades.weightedAverage([{ value: 12, coef: 1 }, { value: 14, coef: 1 }]), 13);
});

test("weightedAverage weights by coefficient", () => {
  assert.equal(Grades.weightedAverage([{ value: 16, coef: 2 }, { value: 11, coef: 3 }]), 13);
});

test("roundGrade rounds to two decimals and keeps null", () => {
  assert.equal(Grades.roundGrade(12.4142857), 12.41);
  assert.equal(Grades.roundGrade(12.416), 12.42);
  assert.equal(Grades.roundGrade(9.996), 10);
  assert.equal(Grades.roundGrade(null), null);
});

test("formatGrade shows two decimals, or a dash for null", () => {
  assert.equal(Grades.formatGrade(13), "13.00");
  assert.equal(Grades.formatGrade(12.4142857), "12.41");
  assert.equal(Grades.formatGrade(null), "—");
});

test("isValidated agrees with the displayed value", () => {
  assert.equal(Grades.isValidated(10), true);
  assert.equal(Grades.isValidated(9.996), true);
  assert.equal(Grades.isValidated(9.99), false);
  assert.equal(Grades.isValidated(0), false);
  assert.equal(Grades.isValidated(null), false);
});

const S5 = Grades.SEMESTER_5;

function allAssessments() {
  const list = [];
  for (const ue of S5.ues) {
    for (const subject of ue.subjects) {
      for (const a of subject.assessments) list.push(a);
    }
  }
  return list;
}

function uniform(value) {
  const grades = {};
  for (const a of allAssessments()) grades[a.id] = value;
  return grades;
}

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, actual + " is not close to " + expected);
}

// Worked example, calculated by hand:
//   CS 5a: Parallel 13, Cloud 13, Certification 10            -> 12
//   CS 5b: OS 86/7, Mobile 13, CPS 12.8                       -> 1242/98
//   Language 5: 12        Professional Preparation 2: 13
//   Semester: (10*12 + 14*(1242/98) + 3*12 + 3*13) / 30       -> 2607/210
const EXAMPLE = {
  "parallel-practical": 12, "parallel-written": 14,
  "cloud-practical": 10, "cloud-written": 16,
  "cert-practical": 8, "cert-written": 12,
  "os-practical": 15, "os-written1": 10, "os-written2": 12,
  "mobile-practical": 16, "mobile-written": 11,
  "cps-written1": 9, "cps-written2": 13, "cps-quiz": 18,
  "lang-oral": 14, "lang-production": 12, "lang-written": 10,
  "sciwrite-written1": 11, "sciwrite-written2": 13, "sciwrite-written3": 15
};

test("SEMESTER_5 matches the structure in the regulations", () => {
  assert.deepEqual(S5.ues.map((ue) => [ue.id, ue.coef]), [["cs5a", 10], ["cs5b", 14], ["lang5", 3], ["pp2", 3]]);
  assert.equal(S5.ues.reduce((sum, ue) => sum + ue.coef, 0), 30);
  const subjects = S5.ues.flatMap((ue) => ue.subjects);
  assert.equal(subjects.length, 8);
  assert.equal(allAssessments().length, 20);
});

test("SEMESTER_5 ids are unique", () => {
  const ids = ["semester"];
  for (const ue of S5.ues) {
    ids.push(ue.id);
    for (const subject of ue.subjects) {
      ids.push(subject.id);
      for (const a of subject.assessments) ids.push(a.id);
    }
  }
  assert.equal(new Set(ids).size, ids.length);
});

test("SEMESTER_5 subject and assessment coefficients match the regulations", () => {
  const shape = {};
  for (const ue of S5.ues) {
    for (const subject of ue.subjects) {
      shape[subject.id] = [subject.coef, subject.assessments.map((a) => a.coef)];
    }
  }
  assert.deepEqual(shape, {
    parallel: [1, [1, 1]],
    cloud: [1, [1, 1]],
    cert: [1, [1, 1]],
    os: [5, [2, 2, 3]],
    mobile: [4, [2, 3]],
    cps: [5, [3, 5, 2]],
    lang: [1, [3, 2, 3]],
    sciwrite: [1, [1, 1, 1]]
  });
});

test("compute matches the hand-calculated worked example", () => {
  const result = Grades.compute(S5, EXAMPLE);
  assert.equal(result.entered, 20);
  assert.equal(result.total, 20);
  close(result.average, 2607 / 210);
  assert.equal(Grades.formatGrade(result.average), "12.41");

  const byId = {};
  for (const ue of result.ues) {
    byId[ue.id] = ue.average;
    for (const subject of ue.subjects) byId[subject.id] = subject.average;
  }
  close(byId.parallel, 13);
  close(byId.cloud, 13);
  close(byId.cert, 10);
  close(byId.cs5a, 12);
  close(byId.os, 86 / 7);
  close(byId.mobile, 13);
  close(byId.cps, 12.8);
  close(byId.cs5b, 1242 / 98);
  close(byId.lang, 12);
  close(byId.lang5, 12);
  close(byId.sciwrite, 13);
  close(byId.pp2, 13);
});

test("compute gives 20 for all 20s and 0 for all 0s", () => {
  close(Grades.compute(S5, uniform(20)).average, 20);
  close(Grades.compute(S5, uniform(0)).average, 0);
});

test("compute does not drift on uniform decimal grades", () => {
  const result = Grades.compute(S5, uniform(13.7));
  assert.equal(Grades.formatGrade(result.average), "13.70");
  for (const ue of result.ues) {
    assert.equal(Grades.formatGrade(ue.average), "13.70");
    for (const subject of ue.subjects) assert.equal(Grades.formatGrade(subject.average), "13.70");
  }
});

test("compute with no grades gives null everywhere", () => {
  for (const grades of [{}, undefined, null]) {
    const result = Grades.compute(S5, grades);
    assert.equal(result.average, null);
    assert.equal(result.entered, 0);
    assert.equal(result.total, 20);
    for (const ue of result.ues) {
      assert.equal(ue.average, null);
      for (const subject of ue.subjects) assert.equal(subject.average, null);
    }
  }
});

test("compute uses only the entered assessments of a subject", () => {
  // OS: practical 15 (coef 2) and second written 12 (coef 3); first written missing.
  const result = Grades.compute(S5, { "os-practical": 15, "os-written2": 12 });
  const cs5b = result.ues.find((ue) => ue.id === "cs5b");
  close(cs5b.subjects.find((s) => s.id === "os").average, (15 * 2 + 12 * 3) / 5);
  assert.equal(result.entered, 2);
});

test("compute excludes a subject with no grades from its UE", () => {
  // CS 5b with OS = 10 (coef 5) and Mobile = 16 (coef 4); CPS empty.
  const result = Grades.compute(S5, {
    "os-practical": 10, "os-written1": 10, "os-written2": 10,
    "mobile-practical": 16, "mobile-written": 16
  });
  const cs5b = result.ues.find((ue) => ue.id === "cs5b");
  assert.equal(cs5b.subjects.find((s) => s.id === "cps").average, null);
  close(cs5b.average, (10 * 5 + 16 * 4) / 9);
});

test("compute excludes a UE with no grades from the semester", () => {
  // Language 5 = 8 (coef 3) and Professional Preparation 2 = 14 (coef 3).
  const result = Grades.compute(S5, {
    "lang-oral": 8, "lang-production": 8, "lang-written": 8,
    "sciwrite-written1": 14, "sciwrite-written2": 14, "sciwrite-written3": 14
  });
  assert.equal(result.ues.find((ue) => ue.id === "cs5a").average, null);
  assert.equal(result.ues.find((ue) => ue.id === "cs5b").average, null);
  close(result.average, 11);
});

test("compute ignores values that are not valid grades and unknown ids", () => {
  const result = Grades.compute(S5, {
    "parallel-practical": NaN,
    "parallel-written": "14",
    "cloud-practical": 25,
    "cloud-written": -1,
    "cert-practical": Infinity,
    "no-such-assessment": 12,
    "cert-written": 9
  });
  assert.equal(result.entered, 1);
  close(result.average, 9);
});
