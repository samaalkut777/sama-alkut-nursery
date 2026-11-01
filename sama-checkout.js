/* Sama Al-Kut Nursery - Checkout */
(function () {
  "use strict";

  const originalRender = window.renderCart;
  if (typeof originalRender !== "function") return;

  const get = id => document.getElementById(id);
  const value = id => (get(id)?.value || "").trim();
  const saved = { name: "", phone: "", area: "", note: "" };
  let busy = false;
  
  const LAST_ORDER_KEY = "sama_nursery_last_order";

  function saveLastOrder(data) {
    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({
        order_number: data.order_number,
        tracking_code: data.tracking_code
      }));
    } catch (error) {
      console.warn("تعذر حفظ بيانات التتبع");
    }
  }
  

function showTrackingPanel(status, orderNumber) {
  document.getElementById("samaTrackingPanel")?.remove();

  const stages = [
    { key: "pending", label: "قيد التجهيز" },
    { key: "prepared", label: "تم التجهيز" },
    { key: "received", label: "تم الاستلام" }
  ];

  const current = stages.findIndex(stage => stage.key === status);
  if (current === -1) return;

  const overlay = document.createElement("div");
  overlay.id = "samaTrackingPanel";
  overlay.style.cssText = "position:fixed;inset:0;z-index:10000;background:#0007;display:flex;justify-content:flex-end;direction:rtl";

  const panel = document.createElement("div");
  panel.style.cssText = "width:min(390px,92vw);height:100%;background:#fff;padding:24px;box-sizing:border-box;box-shadow:0 0 25px #0002;overflow-y:auto;font-family:inherit";

  const heading = document.createElement("h2");
  heading.textContent = "📦 متابعة طلبك";
  heading.style.cssText = "color:#173f2b;margin:0 0 12px";

  const number = document.createElement("p");
  number.textContent = "رقم الطلب: " + orderNumber;
  number.style.cssText = "font-size:14px;overflow-wrap:anywhere;color:#555";

  const close = document.createElement("button");
  close.textContent = "✕ إغلاق";
  close.style.cssText = "border:0;background:#edf2eb;padding:10px 16px;border-radius:10px;cursor:pointer;margin-bottom:24px";
  close.onclick = () => overlay.remove();

  panel.append(heading, number, close);

  stages.forEach((stage, index) => {
    const completed = index <= current;

    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:15px;min-height:105px";

    const indicator = document.createElement("div");
    indicator.style.cssText = "display:flex;flex-direction:column;align-items:center";

    const circle = document.createElement("div");
    circle.textContent = completed ? "✓" : String(index + 1);
    circle.style.cssText = "width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:bold;flex-shrink:0;background:" + (completed ? "#18864b;color:white" : "#e5e9e5;color:#777");

    indicator.append(circle);

    if (index < stages.length - 1) {
      const line = document.createElement("div");
      line.style.cssText = "width:4px;flex:1;min-height:55px;border-radius:4px;background:" + (index < current ? "#18864b" : "#e5e9e5");
      indicator.append(line);
    }

    const label = document.createElement("div");
    label.textContent = stage.label;
    label.style.cssText = "padding-top:7px;font-size:18px;font-weight:bold;color:" + (completed ? "#173f2b" : "#999");

    row.append(indicator, label);
    panel.append(row);
  });

  overlay.append(panel);
  overlay.onclick = event => {
    if (event.target === overlay) overlay.remove();
  };
  document.body.append(overlay);
}
  
function showFloatingTrackingButton() {
  let lastOrder;
  try {
    lastOrder = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || "null");
  } catch (error) {
    return;
  }

  if (!lastOrder?.order_number || !lastOrder?.tracking_code) return;
  if (document.getElementById("samaFloatingTracking")) return;

  const button = document.createElement("button");
  button.id = "samaFloatingTracking";
  button.type = "button";
  button.textContent = "📦 متابعة طلبك";
  button.style.cssText = "position:fixed;right:12px;bottom:20px;z-index:9999;background:#173f2b;color:white;border:0;border-radius:30px;padding:13px 17px;font-size:15px;font-weight:bold;box-shadow:0 3px 12px #0003;cursor:pointer;max-width:calc(100vw - 24px)";

  button.onclick = async () => {
    button.disabled = true;
    button.textContent = "جاري التتبع...";
    try {
      const config = window.SAMA_CONFIG;
      const response = await fetch(
        config.url.replace(/\/$/, "") + "/functions/v1/track-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.key
          },
          body: JSON.stringify(lastOrder)
        }
      );

      if (!response.ok) throw new Error("Tracking failed");
      const result = await response.json();
      const labels = {
        pending: "قيد التجهيز",
        prepared: "تم التجهيز",
        received: "تم الاستلام"
      };

      showTrackingPanel(result.status, lastOrder.order_number);
    } catch (error) {
      alert("تعذر جلب حالة الطلب. حاول مرة أخرى.");
    } finally {
      button.disabled = false;
      button.textContent = "📦 متابعة طلبك";
    }
  };

  document.body.appendChild(button);
}

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
    
    

   const followButton = document.getElementById("followLastOrder"); 

    

    if (followButton) {
      followButton.onclick = async () => {
        followButton.disabled = true;
        followButton.textContent = "جاري جلب حالة الطلب...";

        try {
          const lastOrder = JSON.parse(localStorage.getItem(LAST_ORDER_KEY));
          const config = window.SAMA_CONFIG;

          const response = await fetch(
            config.url.replace(/\/$/, "") + "/functions/v1/track-order",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": config.key
              },
              body: JSON.stringify(lastOrder)
            }
          );

          const result = await response.json();
          if (!response.ok) throw new Error("تعذر التتبع");

          const labels = {
            pending: "قيد التجهيز",
            prepared: "تم التجهيز",
            received: "تم الاستلام"
          };

          followButton.textContent =
            "📦 حالة طلبك: " + (labels[result.status] || "غير معروفة");
        } catch (error) {
          followButton.textContent = "تعذر التتبع، اضغط للمحاولة مجدداً";
        } finally {
          followButton.disabled = false;
        }
      };
    }

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
        
<button type="button" id="trackMyOrder" style="display:block;width:100%;margin-top:16px;padding:14px;border:0;border-radius:11px;background:#173f2b;color:white;font-weight:bold;font-size:16px;cursor:pointer">
  📦 تتبع طلبي
</button>
<div id="trackingResult" style="margin-top:12px"></div>

      `;


      
    saveLastOrder(data);
      showFloatingTrackingButton();
      get("cartContent").replaceChildren(panel);
      
    const trackButton = panel.querySelector("#trackMyOrder");
    const trackingResult = panel.querySelector("#trackingResult");

    trackButton.onclick = async () => {
      trackButton.disabled = true;
      trackingResult.textContent = "جاري جلب حالة طلبك...";

      try {
        const config = window.SAMA_CONFIG;
        const response = await fetch(
          config.url.replace(/\/$/, "") + "/functions/v1/track-order",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": config.key
            },
            body: JSON.stringify({
              order_number: data.order_number,
              tracking_code: data.tracking_code
            })
          }
        );

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "تعذر تتبع الطلب");

        const labels = {
          pending: "قيد التجهيز",
          prepared: "تم التجهيز",
          received: "تم الاستلام"
        };

        trackingResult.textContent =
          "📦 حالة طلبك: " + (labels[result.status] || "غير معروفة");
      } catch (error) {
        trackingResult.textContent = "تعذر جلب حالة الطلب. حاول مرة ثانية.";
      } finally {
        trackButton.disabled = false;
      }
    };
      
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
  
showFloatingTrackingButton();
  
})();
