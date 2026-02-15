"use strict";

/**
 * main.js — DOM bindings, event listeners, rendering
 * Depends on: Validation (validation.js), Calculation (calculation.js)
 */
(function () {

  /* --- UTILITY --- */
  function fmt(n) {
    if (!isFinite(n)) return "0.00";
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /* --- DOM REFS --- */
  var els = {
    loanAmount:    document.getElementById("loanAmount"),
    interestRate:  document.getElementById("interestRate"),
    loanTerm:      document.getElementById("loanTerm"),
    extraPayment:  document.getElementById("extraPayment"),
    propertyTax:   document.getElementById("propertyTax"),
    insurance:     document.getElementById("insurance"),
    calcBtn:       document.getElementById("calcBtn"),
    form:          document.getElementById("calcForm"),
    resultsPanel:  document.getElementById("resultsPanel"),
    resMonthly:    document.getElementById("resMonthly"),
    resTotalInterest: document.getElementById("resTotalInterest"),
    resTotalPayment:  document.getElementById("resTotalPayment"),
    amortBody:     document.getElementById("amortBody"),
    downloadCsv:   document.getElementById("downloadCsv"),
    extraInfo:     document.getElementById("extraInfo"),
    resSaved:      document.getElementById("resSaved"),
    resSavedMonths:document.getElementById("resSavedMonths")
  };

  var lastSchedule = null;

  /* --- RENDERING --- */
  function renderResults(data, monthlyBase, propTax, ins, extra, totalMonths) {
    els.resMonthly.textContent = "$" + fmt(monthlyBase + (propTax / 12) + (ins / 12));
    els.resTotalInterest.textContent = "$" + fmt(data.totalInterest);
    els.resTotalPayment.textContent = "$" + fmt(data.totalPayment + ((propTax + ins) / 12) * data.monthsUsed);

    if (extra > 0 && data.monthsUsed < totalMonths) {
      var P = Validation.parseNum(els.loanAmount.value);
      var rate = Validation.parseNum(els.interestRate.value);
      var years = Validation.parseNum(els.loanTerm.value);
      var noExtraData = Calculation.computeAmortization(P, rate, years, 0);
      var saved = noExtraData.totalInterest - data.totalInterest;
      var savedMonths = totalMonths - data.monthsUsed;
      els.resSaved.textContent = "$" + fmt(saved);
      els.resSavedMonths.textContent = String(savedMonths);
      els.extraInfo.style.display = "block";
    } else {
      els.extraInfo.style.display = "none";
    }

    lastSchedule = data.schedule;
    renderTable(data.schedule);
    els.resultsPanel.classList.add("visible");
    els.resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderTable(schedule) {
    var len = schedule.length;
    if (len === 0) {
      els.amortBody.innerHTML = "<tr><td colspan='5'>No data</td></tr>";
      return;
    }
    var chunks = [];
    for (var i = 0; i < len; i++) {
      var r = schedule[i];
      chunks.push(
        "<tr><td>" + r.month +
        "</td><td>$" + fmt(r.payment) +
        "</td><td>$" + fmt(r.principal) +
        "</td><td>$" + fmt(r.interest) +
        "</td><td>$" + fmt(r.balance) +
        "</td></tr>"
      );
    }
    els.amortBody.innerHTML = chunks.join("");
  }

  /* --- CSV DOWNLOAD --- */
  function downloadCSV() {
    if (!lastSchedule || lastSchedule.length === 0) return;
    var lines = ["Month,Payment,Principal,Interest,Remaining Balance"];
    for (var i = 0; i < lastSchedule.length; i++) {
      var r = lastSchedule[i];
      lines.push(
        r.month + "," +
        r.payment.toFixed(2) + "," +
        r.principal.toFixed(2) + "," +
        r.interest.toFixed(2) + "," +
        r.balance.toFixed(2)
      );
    }
    var csv = lines.join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "dallas_amortization_schedule.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* --- ACCORDION --- */
  function initAccordion() {
    var items = document.querySelectorAll(".accordion-item");
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var btn = item.querySelector(".accordion-btn");
        if (!btn) return;
        btn.addEventListener("click", function () {
          var isActive = item.classList.contains("active");
          var siblings = item.parentElement.querySelectorAll(".accordion-item");
          for (var j = 0; j < siblings.length; j++) {
            siblings[j].classList.remove("active");
            siblings[j].querySelector(".accordion-btn").setAttribute("aria-expanded", "false");
          }
          if (!isActive) {
            item.classList.add("active");
            btn.setAttribute("aria-expanded", "true");
          }
        });
      })(items[i]);
    }
  }

  /* --- EVENT BINDINGS --- */
  function init() {
    var fieldIds = Validation.getFieldIds();
    for (var i = 0; i < fieldIds.length; i++) {
      (function (key) {
        var el = document.getElementById(key);
        if (!el) return;
        el.addEventListener("input", function () { Validation.validateAll("calcBtn"); });
        el.addEventListener("blur", function () { Validation.validateField(key); });
      })(fieldIds[i]);
    }

    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!Validation.validateAll("calcBtn")) return;
      try {
        var P       = Validation.parseNum(els.loanAmount.value);
        var rate    = Validation.parseNum(els.interestRate.value);
        var years   = Validation.parseNum(els.loanTerm.value);
        var extra   = Validation.parseNum(els.extraPayment.value) || 0;
        var propTax = Validation.parseNum(els.propertyTax.value) || 0;
        var ins     = Validation.parseNum(els.insurance.value) || 0;
        var totalMonths = Math.round(years * 12);
        var monthlyBase = Calculation.computeMonthlyPayment(P, rate, years);
        var data = Calculation.computeAmortization(P, rate, years, extra);
        renderResults(data, monthlyBase, propTax, ins, extra, totalMonths);
      } catch (err) {
        els.resultsPanel.classList.remove("visible");
      }
    });

    els.form.addEventListener("reset", function () {
      setTimeout(function () {
        els.resultsPanel.classList.remove("visible");
        els.calcBtn.disabled = false;
        var errEls = document.querySelectorAll(".error-msg");
        for (var i = 0; i < errEls.length; i++) errEls[i].textContent = "";
        var inputs = document.querySelectorAll(".input-error");
        for (var j = 0; j < inputs.length; j++) inputs[j].classList.remove("input-error");
        lastSchedule = null;
      }, 0);
    });

    els.downloadCsv.addEventListener("click", downloadCSV);
    initAccordion();
    Validation.validateAll("calcBtn");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
