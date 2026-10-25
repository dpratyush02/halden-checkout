(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Store configuration
     ------------------------------------------------------------------ */

  const PRODUCT = {
    sku: "HS-RL28-MOS",
    name: "Ridgeline 28L Rolltop Pack",
    variant: "Moss green, waxed canvas",
    unitPrice: 148.0,
  };

  const SHIPPING_FLAT_RATE = 9.5;
  const FREE_SHIPPING_THRESHOLD = 250;
  const MIN_QUANTITY = 1;
  const MAX_QUANTITY = 10;
  const MOCK_PROCESSING_MS = 900;

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ZIP_PATTERN = /^\d{5}(?:-\d{4})?$/;

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

  const state = {
    quantity: MIN_QUANTITY,
    isSubmitting: false,
  };

  /* ------------------------------------------------------------------
     Elements
     ------------------------------------------------------------------ */

  const byId = (id) => document.getElementById(id);

  const els = {
    checkoutView: byId("checkout-view"),
    confirmationView: byId("confirmation-view"),
    form: byId("checkout-form"),
    formAlert: byId("form-alert"),
    formAlertText: byId("form-alert-text"),
    placeOrder: byId("place-order"),
    placeOrderLabel: byId("place-order-label"),
    placeOrderSpinner: byId("place-order-spinner"),
    buttonTotal: byId("button-total"),

    unitPrice: byId("unit-price"),
    quantityInput: byId("quantity"),
    decrease: byId("qty-decrease"),
    increase: byId("qty-increase"),
    lineTotal: byId("line-total"),
    subtotal: byId("subtotal"),
    shipping: byId("shipping"),
    total: byId("total"),
    shipMessage: byId("ship-message"),
    shipBar: byId("ship-bar"),

    confirmationTitle: byId("confirmation-title"),
    confFirstName: byId("conf-first-name"),
    confOrderNumber: byId("conf-order-number"),
    confQuantity: byId("conf-quantity"),
    confLineTotal: byId("conf-line-total"),
    confSubtotal: byId("conf-subtotal"),
    confShipping: byId("conf-shipping"),
    confTotal: byId("conf-total"),
    confShipTo: byId("conf-ship-to"),
    confEmail: byId("conf-email"),
    confDelivery: byId("conf-delivery"),
    newOrder: byId("new-order"),
  };

  /* ------------------------------------------------------------------
     Pricing
     ------------------------------------------------------------------ */

  function roundCurrency(value) {
    return Math.round(value * 100) / 100;
  }

  function calculateTotals(quantity) {
    const subtotal = roundCurrency(PRODUCT.unitPrice * quantity);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
    return {
      subtotal,
      shipping,
      total: roundCurrency(subtotal + shipping),
    };
  }

  function formatShipping(amount) {
    return amount === 0 ? "Free" : money.format(amount);
  }

  function renderSummary() {
    const totals = calculateTotals(state.quantity);

    els.unitPrice.textContent = money.format(PRODUCT.unitPrice);
    els.lineTotal.textContent = money.format(totals.subtotal);
    els.subtotal.textContent = money.format(totals.subtotal);
    els.shipping.textContent = formatShipping(totals.shipping);
    els.total.textContent = money.format(totals.total);
    els.buttonTotal.textContent = money.format(totals.total);

    const remaining = roundCurrency(FREE_SHIPPING_THRESHOLD - totals.subtotal);
    const progress = Math.min(totals.subtotal / FREE_SHIPPING_THRESHOLD, 1);
    els.shipBar.style.width = `${progress * 100}%`;
    els.shipMessage.textContent =
      remaining > 0
        ? `Add ${money.format(remaining)} more to get free shipping.`
        : "You’ve unlocked free shipping.";

    els.decrease.disabled = state.quantity <= MIN_QUANTITY;
    els.increase.disabled = state.quantity >= MAX_QUANTITY;
  }

  /* ------------------------------------------------------------------
     Quantity
     ------------------------------------------------------------------ */

  function clampQuantity(value) {
    return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value));
  }

  function setQuantity(value) {
    state.quantity = clampQuantity(value);
    els.quantityInput.value = String(state.quantity);
    renderSummary();
  }

  els.decrease.addEventListener("click", () => setQuantity(state.quantity - 1));
  els.increase.addEventListener("click", () => setQuantity(state.quantity + 1));

  // Update live while typing, but only for values already in range.
  els.quantityInput.addEventListener("input", () => {
    const value = Number.parseInt(els.quantityInput.value, 10);
    if (Number.isInteger(value) && value >= MIN_QUANTITY && value <= MAX_QUANTITY) {
      state.quantity = value;
      renderSummary();
    }
  });

  // On commit, clamp out-of-range values and restore the last good value if empty.
  els.quantityInput.addEventListener("change", () => {
    const value = Number.parseInt(els.quantityInput.value, 10);
    setQuantity(Number.isInteger(value) ? value : state.quantity);
  });

  /* ------------------------------------------------------------------
     Validation
     ------------------------------------------------------------------ */

  const validators = {
    fullName(value) {
      if (!value) return "Enter your full name.";
      if (value.length < 2) return "Full name must be at least 2 characters.";
      return "";
    },
    email(value) {
      if (value && !EMAIL_PATTERN.test(value)) {
        return "Enter an email address like name@example.com.";
      }
      return "";
    },
    address(value) {
      if (!value) return "Enter your street address.";
      if (value.length < 5) return "Enter a complete street address.";
      return "";
    },
    city(value) {
      if (!value) return "Enter your city.";
      if (value.length < 2) return "City must be at least 2 characters.";
      return "";
    },
    zip(value) {
      if (!value) return "Enter your ZIP code.";
      if (!ZIP_PATTERN.test(value)) return "Enter a 5-digit ZIP code, like 97202.";
      return "";
    },
  };

  const fields = Object.keys(validators).map((name) => els.form.elements.namedItem(name));

  function showFieldError(field, message) {
    const errorEl = byId(`${field.id}-error`);
    errorEl.textContent = message;
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  function validateField(field) {
    const message = validators[field.name](field.value.trim());
    showFieldError(field, message);
    return message === "";
  }

  function showFormAlert(invalidCount) {
    els.formAlertText.textContent =
      invalidCount === 1
        ? "Fix 1 field to place your order."
        : `Fix ${invalidCount} fields to place your order.`;
    els.formAlert.hidden = false;
  }

  function hideFormAlert() {
    els.formAlert.hidden = true;
    els.formAlertText.textContent = "";
  }

  function refreshFormAlert() {
    if (els.formAlert.hidden) return;
    const invalidCount = fields.filter((field) => field.getAttribute("aria-invalid") === "true").length;
    if (invalidCount === 0) {
      hideFormAlert();
    } else {
      showFormAlert(invalidCount);
    }
  }

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      field.dataset.dirty = "true";
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
        refreshFormAlert();
      }
    });

    field.addEventListener("blur", () => {
      if (field.dataset.dirty === "true") {
        validateField(field);
        refreshFormAlert();
      }
    });
  });

  /* ------------------------------------------------------------------
     Submission
     ------------------------------------------------------------------ */

  function collectCustomer() {
    const data = {};
    fields.forEach((field) => {
      data[field.name] = field.value.trim();
    });
    return data;
  }

  function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    els.placeOrder.disabled = isSubmitting;
    els.placeOrder.setAttribute("aria-busy", String(isSubmitting));
    els.placeOrderSpinner.hidden = !isSubmitting;
    els.buttonTotal.hidden = isSubmitting;
    els.placeOrderLabel.textContent = isSubmitting ? "Placing order…" : "Place order";
  }

  function generateOrderNumber() {
    return `HS-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  function addBusinessDays(date, days) {
    const result = new Date(date.getTime());
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added += 1;
    }
    return result;
  }

  function renderConfirmation(order) {
    const { customer, totals } = order;

    els.confFirstName.textContent = customer.fullName.split(/\s+/)[0];
    els.confOrderNumber.textContent = order.number;
    els.confQuantity.textContent = String(order.quantity);
    els.confLineTotal.textContent = money.format(totals.subtotal);
    els.confSubtotal.textContent = money.format(totals.subtotal);
    els.confShipping.textContent = formatShipping(totals.shipping);
    els.confTotal.textContent = money.format(totals.total);

    const addressLines = [customer.fullName, customer.address, `${customer.city} ${customer.zip}`];
    els.confShipTo.replaceChildren(
      ...addressLines.map((line) => {
        const span = document.createElement("span");
        span.textContent = line;
        return span;
      })
    );

    els.confEmail.textContent = customer.email;

    const earliest = addBusinessDays(order.placedAt, 4);
    const latest = addBusinessDays(order.placedAt, 7);
    els.confDelivery.textContent = `${dayFormat.format(earliest)} to ${dayFormat.format(latest)}`;
  }

  function showView(view) {
    const showConfirmation = view === "confirmation";
    els.checkoutView.hidden = showConfirmation;
    els.confirmationView.hidden = !showConfirmation;
    window.scrollTo(0, 0);
  }

  function submitOrder(customer) {
    setSubmitting(true);

    const order = {
      number: generateOrderNumber(),
      sku: PRODUCT.sku,
      quantity: state.quantity,
      totals: calculateTotals(state.quantity),
      customer,
      placedAt: new Date(),
    };

    // Simulates a network round trip. No data leaves the browser.
    window.setTimeout(() => {
      renderConfirmation(order);
      setSubmitting(false);
      showView("confirmation");
      els.confirmationTitle.focus();
    }, MOCK_PROCESSING_MS);
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.isSubmitting) return;

    const invalidFields = fields.filter((field) => !validateField(field));

    if (invalidFields.length > 0) {
      showFormAlert(invalidFields.length);
      invalidFields[0].focus();
      return;
    }

    hideFormAlert();
    submitOrder(collectCustomer());
  });

  els.newOrder.addEventListener("click", () => {
    els.form.reset();
    fields.forEach((field) => {
      showFieldError(field, "");
      delete field.dataset.dirty;
    });
    hideFormAlert();
    setQuantity(MIN_QUANTITY);
    showView("checkout");
    fields[0].focus();
  });

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */

  setQuantity(MIN_QUANTITY);
})();
