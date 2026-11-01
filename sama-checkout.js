/* Sama Al-Kut Nursery - Checkout */
(function () {
  "use strict";

  const originalRender = window.renderCart;
  if (typeof originalRender !== "function") return;

  const get = id => document.getElementById(id);
  const value = id => (get(id)?.value || "").trim();
  const saved = { name: "", phone: "", area: "", note: "" };
  let busy = false;

  function saveFields() {
    if (get("custName")) saved.name = value("custName");
    if (get("custPhone")) saved.phone = value("custPhone");
    if (get("custArea")) saved.area = value("custArea");
    if (get("custNote")) saved.note = value("custNote");
  }

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

  window.renderCart = function () {
    saveFields();
    originalRender();

    const content = get("cartContent");
    const fields = content?.querySelector(".fields");
    const whatsapp = get("sendOrder");
    if (!fields || !whatsapp) return;

    const name = get("custName");
    name.placeholder = "الاسم الكامل (مطلوب لتأكيد الطلب)";
    name.autocomplete = "name";

    const phone = document.createElement("input");
    phone.id = "custPhone";
    phone.type = "tel";
    phone.inputMode = "tel";
    phone.autocomplete = "tel";
    phone.placeholder = "رقم الهاتف (مطلوب لتأكيد الطلب)";
    name.after(phone);

    name.value = saved.name;
    phone.value = saved.phone;
    get("custArea").value = saved.area;
    get("custNote").value = saved.note;

    [name, phone, get("custArea"), get("custNote")].forEach(el =>
      el.addEventListener("input", saveFields)
    );

    const confirm = document.createElement("button");
    confirm.id = "confirmOrder";
    confirm.className = "btn primary";
    confirm.style.cssText = "width:100%;padding:13px;border-radius:11px";
    confirm.textContent = "تأكيد الطلب";
    confirm.onclick = confirmOrder;
    whatsapp.before(confirm);

    whatsapp.textContent = "الطلب أو الاستفسار عبر واتساب ↗";
    whatsapp.style.width = "100%";

    const note = content.querySelector(".summary .note");
    if (note) {
      note.textContent =
        "تأكيد الطلب يسجّله لدى المشتل ويعرض رقم الطلب ورمز التتبع. واتساب للاستفسار أو إرسال تفاصيل السلة فقط، ولا يسجّل طلباً إلكترونياً. أجور التوصيل تُحدّد لاحقاً.";
    }

    whatsapp.onclick = () => {
      saveFields();
      const entries = Object.entries(cart)
        .map(([id, qty]) => ({ p: byId(id), qty }))
        .filter(x => x.p);
      if (!entries.length) return;

      const money = n => Number(n || 0).toLocaleString("en-US") + " د.ع";
      const total = entries.reduce(
        (sum, x) => sum + Number(x.p.price || 0) * x.qty, 0
      );
      const lines = [
        "🌿 *استفسار / طلب عبر واتساب - مشتل سما الكوت*",
        "",
        ...entries.map((x, i) =>
          `${i + 1}. ${x.p.name}\nالكمية: ${x.qty}\nسعر القطعة: ${money(x.p.price)}`
        ),
        "",
        `المجموع: ${money(total)}`
      ];

      if (saved.name) lines.push("الاسم: " + saved.name);
      if (saved.phone) lines.push("الهاتف: " + saved.phone);
      if (saved.area) lines.push("العنوان: " + saved.area);
      if (saved.note) lines.push("ملاحظات: " + saved.note);
      lines.push("", "يرجى تأكيد التوفر وأجور التوصيل.");

      window.open(
        "https://wa.me/9647726506022?text=" +
          encodeURIComponent(lines.join("\n")),
        "_blank",
        "noopener"
      );
    };
  };

  async function confirmOrder() {
    if (busy) return;
    saveFields();

    if (!saved.name) {
      alert("يرجى إدخال الاسم لتأكيد الطلب.");
      get("custName")?.focus();
      return;
    }

    if (saved.phone.replace(/\D/g, "").length < 10) {
      alert("يرجى إدخال رقم هاتف صحيح.");
      get("custPhone")?.focus();
      return;
    }

    const items = Object.entries(cart).map(([id, qty]) => ({
      product_id: Number(id),
      quantity: Number(qty)
    }));

    if (
      !items.length ||
      items.length > 50 ||
      items.some(x =>
        !Number.isSafeInteger(x.product_id) ||
        x.product_id <= 0 ||
        !Number.isSafeInteger(x.quantity) ||
        x.quantity < 1 ||
        x.quantity > 100
      )
    ) {
      alert("يرجى مراجعة المنتجات والكميات في السلة.");
      return;
    }

    const config = window.SAMA_CONFIG;
    if (!config?.url || !config?.key) {
      alert("إعدادات الاتصال غير متوفرة.");
      return;
    }

    const button = get("confirmOrder");
    busy = true;
    button.disabled = true;
    button.textContent = "جارٍ تسجيل الطلب...";

    try {
      const response = await fetch(
        config.url.replace(/\/$/, "") + "/functions/v1/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.key,
            Authorization: "Bearer " + config.key
          },
          body: JSON.stringify({
            customer_name: saved.name,
            customer_phone: saved.phone,
            customer_area: saved.area,
            customer_note: saved.note,
            items
          })
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.error || "تعذّر تسجيل الطلب.");
      }

      const panel = document.createElement("div");
      panel.style.cssText =
        "background:#edf2eb;border:1px solid #d5e2d2;border-radius:14px;padding:18px;line-height:2;text-align:center";

      panel.innerHTML = `
        <h3 style="color:#173f2b;margin:0 0 10px">
          ✓ تم تسجيل طلبك بنجاح
        </h3>
        <div>رقم الطلب:
          <strong>${escapeHtml(data.order_number ?? "غير متوفر")}</strong>
        </div>
        <div>رمز التتبع:
          <strong>${escapeHtml(data.tracking_code ?? "غير متوفر")}</strong>
        </div>
        <div>المجموع:
          <strong>${Number(data.total || 0).toLocaleString("en-US")} د.ع</strong>
        </div>
        <p style="font-size:13px">
          احتفظ برقم الطلب ورمز التتبع للاستفسار عن طلبك.
          أجور التوصيل يتم تأكيدها مع المشتل.
        </p>
      `;

      get("cartContent").replaceChildren(panel);
      cart = {};
      countCart();
      saved.name = saved.phone = saved.area = saved.note = "";

    } catch (err) {
      alert(
        "لم نتمكن من تأكيد تسجيل الطلب: " + err.message +
        "\nإذا حاولت مسبقاً، تواصل مع المشتل قبل إعادة الطلب لتجنّب التكرار."
      );
    } finally {
      busy = false;
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = "تأكيد الطلب";
      }
    }
  }
})();
