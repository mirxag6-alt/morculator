"use strict";

/**
 * calculation.js — Pure calculation functions for mortgage amortization
 * Exports: Calculation (global namespace)
 *
 * AMORTIZATION FORMULA:
 *   M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *   Where:
 *     M = monthly payment
 *     P = principal (loan amount)
 *     r = monthly interest rate (annual rate / 100 / 12)
 *     n = total number of monthly payments (years * 12)
 *   When r = 0: M = P / n
 */
var Calculation = (function () {

  /**
   * Compute fixed monthly payment (principal & interest only).
   * Handles 0% interest edge case.
   * Returns 0 if inputs are invalid.
   */
  function computeMonthlyPayment(P, annualRate, years) {
    if (P <= 0 || years <= 0) return 0;
    var n = Math.round(years * 12);
    if (n <= 0) return 0;

    /* 0% interest edge case */
    if (annualRate === 0) return P / n;

    var r = annualRate / 100 / 12;
    var factor = Math.pow(1 + r, n);

    /* Guard against Infinity or factor === 1 (would cause division by zero) */
    if (!isFinite(factor) || factor === 1) return P / n;

    return P * (r * factor) / (factor - 1);
  }

  /**
   * Generate full amortization schedule.
   * Handles extra payments, 0% interest, and floating point drift.
   * Returns { schedule: [], totalInterest, totalPayment, monthsUsed }
   */
  function computeAmortization(P, annualRate, years, extra) {
    var schedule = [];
    var result = { schedule: schedule, totalInterest: 0, totalPayment: 0, monthsUsed: 0 };

    if (P <= 0 || years <= 0) return result;

    var n = Math.round(years * 12);
    if (n <= 0) return result;

    extra = Math.max(0, extra || 0);
    var r = annualRate === 0 ? 0 : annualRate / 100 / 12;
    var basePayment = computeMonthlyPayment(P, annualRate, years);

    if (!isFinite(basePayment) || basePayment <= 0) return result;

    var balance = P;
    var totalInterest = 0;
    var totalPayment = 0;
    var maxIter = n + 1; /* safety: never exceed expected months + 1 */
    var month = 0;

    while (balance > 0.005 && month < maxIter) {
      month++;

      var interestPart = balance * r;
      /* Correct floating point drift */
      interestPart = Math.round(interestPart * 100) / 100;

      var payment = basePayment + extra;
      /* Final payment adjustment */
      if (payment > balance + interestPart) {
        payment = balance + interestPart;
      }

      var principalPart = payment - interestPart;
      principalPart = Math.round(principalPart * 100) / 100;

      balance = balance - principalPart;
      if (balance < 0.005) balance = 0;
      balance = Math.round(balance * 100) / 100;

      totalInterest += interestPart;
      totalPayment += payment;

      schedule.push({
        month: month,
        payment: payment,
        principal: principalPart,
        interest: interestPart,
        balance: balance
      });

      /* Hard safety cap: 600 months (50 years) */
      if (month > 600) break;
    }

    result.totalInterest = totalInterest;
    result.totalPayment = totalPayment;
    result.monthsUsed = month;
    return result;
  }

  return {
    computeMonthlyPayment: computeMonthlyPayment,
    computeAmortization: computeAmortization
  };
})();
