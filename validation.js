"use strict";

/**
 * validation.js — Input validation module for Dallas Mortgage Calculator
 * Exports: Validation (global namespace)
 */
var Validation = (function () {
  var rules = {
    loanAmount:   { min: 1000,  max: 10000000, required: true,  integer: false, label: "Loan Amount" },
    interestRate: { min: 0,     max: 25,       required: true,  integer: false, label: "Interest Rate" },
    loanTerm:     { min: 1,     max: 50,       required: true,  integer: true,  label: "Loan Term" },
    extraPayment: { min: 0,     max: 1000000,  required: false, integer: false, label: "Extra Payment" },
    propertyTax:  { min: 0,     max: 500000,   required: false, integer: false, label: "Property Tax" },
    insurance:    { min: 0,     max: 100000,   required: false, integer: false, label: "Insurance" }
  };

  function parseNum(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : NaN;
  }

  /**
   * Validate a single field by ID.
   * Updates DOM error message and input styling.
   * Returns true if valid.
   */
  function validateField(id) {
    var rule = rules[id];
    if (!rule) return true;

    var input = document.getElementById(id);
    var errEl = document.getElementById(id + "Error");
    if (!input || !errEl) return true;

    var raw = input.value.trim();
    var val = parseNum(raw);

    errEl.textContent = "";
    input.classList.remove("input-error");

    if (rule.required && (raw === "" || isNaN(val))) {
      errEl.textContent = rule.label + " is required.";
      input.classList.add("input-error");
      return false;
    }
    if (raw !== "" && isNaN(val)) {
      errEl.textContent = "Enter a valid number.";
      input.classList.add("input-error");
      return false;
    }
    if (raw === "" && !rule.required) return true;
    if (val < rule.min) {
      errEl.textContent = "Minimum is " + rule.min + ".";
      input.classList.add("input-error");
      return false;
    }
    if (val > rule.max) {
      errEl.textContent = "Maximum is " + rule.max + ".";
      input.classList.add("input-error");
      return false;
    }
    if (rule.integer && val !== Math.floor(val)) {
      errEl.textContent = "Must be a whole number.";
      input.classList.add("input-error");
      return false;
    }
    return true;
  }

  /**
   * Validate all fields. Returns true if ALL valid.
   * Also updates the calculate button disabled state.
   */
  function validateAll(calcBtnId) {
    var valid = true;
    var keys = Object.keys(rules);
    for (var i = 0; i < keys.length; i++) {
      if (!validateField(keys[i])) valid = false;
    }
    var btn = document.getElementById(calcBtnId || "calcBtn");
    if (btn) btn.disabled = !valid;
    return valid;
  }

  function getFieldIds() {
    return Object.keys(rules);
  }

  return {
    validateField: validateField,
    validateAll: validateAll,
    getFieldIds: getFieldIds,
    parseNum: parseNum
  };
})();
