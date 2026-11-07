/* =========================================================
   Gts-IQ — inner pages: contact form, payment + receipt upload, admin review
   Static mockup: requests are kept in localStorage, so the payment page and
   the admin page (#admin) talk to each other in the same browser.
   Swap the `store` object for API calls when a backend is added.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const L = () => (root.lang === "en" ? "en" : "ar");
  const WA = "https://wa.me/9647722228718";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => (L() === "en" ? `IQD ${(+n).toLocaleString("en")}` : `${(+n).toLocaleString("en")} د.ع`);
  const when = t => new Date(t).toLocaleString(L() === "en" ? "en-GB" : "ar-IQ-u-nu-latn", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const digits = s => String(s).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\D/g, "");

  const TRIPS = {
    istanbul: { ar: "إسطنبول، تركيا", en: "Istanbul, Türkiye", price: 1495000 },
    dubai: { ar: "دبي، الإمارات", en: "Dubai, UAE", price: 1260000 },
    maldives: { ar: "جزر المالديف", en: "Maldives", price: 3275000 },
    bali: { ar: "بالي، إندونيسيا", en: "Bali, Indonesia", price: 2100000 },
    paris: { ar: "باريس، فرنسا", en: "Paris, France", price: 2690000 },
    swiss: { ar: "سويسرا", en: "Switzerland", price: 3530000 },
    kl: { ar: "كوالالمبور، ماليزيا", en: "Kuala Lumpur, Malaysia", price: 1645000 },
    other: { ar: "رحلة أخرى / خدمة أخرى", en: "Another trip / service" }
  };
  const METHODS = { zaincash: { ar: "زين كاش", en: "ZainCash" }, ki: { ar: "ماستر كارد / كي كارد", en: "MasterCard / Ki Card" }, nbi: { ar: "مصرف NBI", en: "NBI Bank" }, tbi: { ar: "مصرف TBI العراقي التجاري", en: "TBI Iraqi Commercial Bank" } };
  const TYPES = {
    trip: { ar: "رحلة خاصة", en: "Private trip" }, flight: { ar: "تذاكر طيران", en: "Flight tickets" },
    hotel: { ar: "حجز فنادق", en: "Hotel booking" }, visa: { ar: "تأشيرات", en: "Visas" },
    payment: { ar: "استفسار عن الدفع", en: "Payment question" }, other: { ar: "أخرى", en: "Other" }
  };
  const WHO = { couple: { ar: "شخصين", en: "Couple" }, family: { ar: "عائلة", en: "Family" }, solo: { ar: "مسافر واحد", en: "Solo" }, friends: { ar: "مجموعة أصدقاء", en: "Friends" } };
  const routeParams = () => (window.GTS_route ? window.GTS_route().params : new URLSearchParams(location.search));
  const name = (map, k) => (map[k] ? map[k][L()] : k || "—");

  const STR = {
    ar: {
      copied: "تم النسخ",
      errName: "يرجى كتابة الاسم الكامل.",
      errPhone: "يرجى كتابة رقم هاتف صحيح.",
      errAmount: "يرجى كتابة المبلغ المدفوع.",
      errImg: "يرجى إرفاق لقطة شاشة الدفع.",
      errType: "الملف يجب أن يكون صورة (PNG أو JPG).",
      errBig: "حجم الصورة كبير جداً (الحد 15 ميغابايت).",
      errStore: "تعذّر حفظ الطلب — مساحة المتصفح ممتلئة.",
      sending: "جارٍ الإرسال…",
      order: "رقم الطلب",
      pendingT: "بانتظار موافقة الإدارة",
      pendingP: "تم إرسال لقطة شاشة الدفع إلى إدارة Gts-IQ. ستتحدّث هذه الصفحة تلقائياً فور مراجعة الإيصال — لا حاجة لإعادة تحميلها.",
      approvedT: "تمت الموافقة — حجزك مؤكد",
      approvedP: "راجعت إدارة Gts-IQ إيصال الدفع ووافقت عليه. سيتواصل معك مستشارك لإكمال تفاصيل الرحلة.",
      rejectedT: "لم تتم الموافقة على الإيصال",
      rejectedP: "لم تتمكن الإدارة من تأكيد هذا الدفع. يمكنك إعادة رفع لقطة شاشة أوضح أو التواصل معنا.",
      adminNote: "ملاحظة الإدارة",
      name: "الاسم", phone: "الهاتف", trip: "الرحلة", amount: "المبلغ", method: "طريقة الدفع", sent: "وقت الإرسال", ref: "رقم الحجز", note: "ملاحظة", decided: "وقت المراجعة",
      receipt: "لقطة شاشة الدفع",
      print: "طباعة التأكيد",
      retry: "إعادة رفع الإيصال",
      newPay: "دفعة جديدة",
      waAsk: "تواصل على واتساب",
      demo: "نسخة تجريبية: افتح <a href=\"#admin\" target=\"_blank\" rel=\"noopener\">لوحة الإدارة</a> في تبويب جديد ووافق على الطلب لترى التحديث هنا مباشرة.",
      notFound: "لم يتم العثور على طلب بهذا الرقم.",
      liveApproved: "تم تأكيد دفعتك ✓",
      liveRejected: "تمت مراجعة دفعتك",
      waPay: id => `مرحباً Gts-IQ، أستفسر عن الدفعة رقم ${id}`,
      // contact
      doneT: "تم استلام طلبك",
      doneP: (n, p) => `شكراً ${n}! سيتواصل معك أحد مستشارينا قريباً على الرقم ${p}.`,
      doneWa: "أكمل المحادثة على واتساب",
      doneNew: "إرسال طلب آخر",
      waMsg: (m) => `مرحباً Gts-IQ 👋\nالاسم: ${m.name}\nالطلب: ${name(TYPES, m.type)}${m.dest ? `\nالوجهة: ${m.dest}` : ""}${m.date ? `\nالتاريخ: ${m.date}` : ""}\nالمسافرون: ${name(WHO, m.who)}${m.msg ? `\n${m.msg}` : ""}`,
      // admin
      badPin: "رمز الدخول غير صحيح.",
      approve: "موافقة",
      reject: "رفض",
      undo: "إعادة إلى المراجعة",
      notePh: "ملاحظة للعميل (اختياري)",
      empty: { pending: "لا توجد طلبات بانتظار المراجعة.", all: "لا توجد طلبات دفع بعد.", approved: "لا توجد طلبات مقبولة.", rejected: "لا توجد طلبات مرفوضة.", messages: "لا توجد رسائل بعد." },
      emptyHint: "جرّب إرسال دفعة من <a href=\"#payment\" target=\"_blank\" rel=\"noopener\">صفحة الدفع</a>.",
      st: { pending: "بانتظار المراجعة", approved: "تمت الموافقة", rejected: "مرفوض" },
      newReq: "وصل طلب دفع جديد",
      clearAsk: "حذف كل الطلبات والرسائل التجريبية؟",
      type: "نوع الطلب", dest: "الوجهة", date: "تاريخ السفر", who: "المسافرون", msg: "الرسالة",
      del: "حذف", call: "اتصال", noImg: "الصورة غير متوفرة"
    },
    en: {
      copied: "Copied",
      errName: "Please enter your full name.",
      errPhone: "Please enter a valid phone number.",
      errAmount: "Please enter the amount you paid.",
      errImg: "Please attach your payment screenshot.",
      errType: "The file must be an image (PNG or JPG).",
      errBig: "The image is too large (15 MB max).",
      errStore: "Couldn’t save the request — browser storage is full.",
      sending: "Sending…",
      order: "Request number",
      pendingT: "Waiting for admin approval",
      pendingP: "Your payment screenshot has been sent to the Gts-IQ team. This page updates automatically as soon as it’s reviewed — no need to reload.",
      approvedT: "Approved — your booking is confirmed",
      approvedP: "The Gts-IQ team has reviewed your receipt and approved it. Your advisor will contact you to finalize the trip details.",
      rejectedT: "Receipt not approved",
      rejectedP: "Our team couldn’t confirm this payment. You can upload a clearer screenshot or contact us.",
      adminNote: "Note from the team",
      name: "Name", phone: "Phone", trip: "Trip", amount: "Amount", method: "Payment method", sent: "Sent", ref: "Booking number", note: "Note", decided: "Reviewed",
      receipt: "Payment screenshot",
      print: "Print confirmation",
      retry: "Upload the receipt again",
      newPay: "New payment",
      waAsk: "Contact us on WhatsApp",
      demo: "Demo: open the <a href=\"#admin\" target=\"_blank\" rel=\"noopener\">admin panel</a> in a new tab and approve the request to see this page update live.",
      notFound: "No request found with this number.",
      liveApproved: "Your payment is confirmed ✓",
      liveRejected: "Your payment has been reviewed",
      waPay: id => `Hello Gts-IQ, I have a question about payment ${id}`,
      doneT: "We’ve received your request",
      doneP: (n, p) => `Thank you, ${n}! One of our advisors will contact you shortly on ${p}.`,
      doneWa: "Continue on WhatsApp",
      doneNew: "Send another request",
      waMsg: (m) => `Hello Gts-IQ 👋\nName: ${m.name}\nRequest: ${name(TYPES, m.type)}${m.dest ? `\nDestination: ${m.dest}` : ""}${m.date ? `\nDate: ${m.date}` : ""}\nTravelers: ${name(WHO, m.who)}${m.msg ? `\n${m.msg}` : ""}`,
      badPin: "Incorrect access code.",
      approve: "Approve",
      reject: "Reject",
      undo: "Back to review",
      notePh: "Note to the client (optional)",
      empty: { pending: "No requests waiting for review.", all: "No payment requests yet.", approved: "No approved requests.", rejected: "No rejected requests.", messages: "No messages yet." },
      emptyHint: "Try sending a payment from the <a href=\"#payment\" target=\"_blank\" rel=\"noopener\">payment page</a>.",
      st: { pending: "Waiting for review", approved: "Approved", rejected: "Rejected" },
      newReq: "New payment request received",
      clearAsk: "Delete all demo requests and messages?",
      type: "Request type", dest: "Destination", date: "Travel date", who: "Travelers", msg: "Message",
      del: "Delete", call: "Call", noImg: "Image not available"
    }
  };
  const S = () => STR[L()];

  /* ---------- Store (localStorage; replace with an API later) ---------- */
  const PAY = "gts-payments", MSG = "gts-messages", REV = "gts-rev";
  const store = {
    read(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
    write(k, list) {
      localStorage.setItem(k, JSON.stringify(list));
      localStorage.setItem(REV, String(Date.now()) + Math.random());
    },
    payments() { return this.read(PAY); },
    messages() { return this.read(MSG); },
    get(id) { return this.payments().find(r => r.id === id); },
    addPayment(r) {
      const list = [r, ...this.payments()].slice(0, 40);
      for (;;) {
        try { this.write(PAY, list); return true; } catch (e) {
          // storage full: drop the oldest reviewed receipt images first
          const i = list.map(x => x.status !== "pending" && !!x.img).lastIndexOf(true);
          if (i < 0) return false;
          list[i].img = null;
        }
      }
    },
    update(id, patch) {
      const list = this.payments(), r = list.find(x => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      this.write(PAY, list);
      return r;
    },
    addMessage(m) { this.write(MSG, [m, ...this.messages()].slice(0, 60)); },
    removeMessage(id) { this.write(MSG, this.messages().filter(m => m.id !== id)); },
    clear() { localStorage.removeItem(PAY); localStorage.removeItem(MSG); localStorage.setItem(REV, String(Date.now())); }
  };
  // fires when another tab (e.g. the admin panel) changes the data; polling covers file:// pages
  const onStoreChange = fn => {
    let last = localStorage.getItem(REV);
    const check = () => { const now = localStorage.getItem(REV); if (now !== last) { last = now; fn(); } };
    window.addEventListener("storage", e => { if (!e.key || e.key === REV) check(); });
    setInterval(check, 1500);
    return () => { last = localStorage.getItem(REV); }; // call after own writes
  };
  const newId = p => p + "-" + (Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 4)).toUpperCase();

  const toast = (() => {
    let el, timer;
    return (text, kind = "") => {
      if (!el) { el = $("#toast") || Object.assign(document.createElement("div"), { className: "toast", role: "status" }); if (!el.isConnected) document.body.appendChild(el); }
      el.className = "toast " + (kind ? "toast--" + kind : "");
      el.innerHTML = text;
      el.hidden = false;
      requestAnimationFrame(() => el.classList.add("is-on"));
      clearTimeout(timer);
      timer = setTimeout(() => { el.classList.remove("is-on"); setTimeout(() => { el.hidden = true; }, 400); }, 3800);
    };
  })();

  const showError = (el, msg) => { if (!el) return; el.textContent = msg || ""; el.hidden = !msg; };
  const copyText = (text, btn) => {
    const done = () => { const s = $("span", btn); if (!s) return; const old = s.textContent; s.textContent = S().copied; btn.classList.add("is-done"); setTimeout(() => { s.textContent = old; btn.classList.remove("is-done"); }, 1600); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done);
    else { const t = Object.assign(document.createElement("textarea"), { value: text }); document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) { /* ignore */ } t.remove(); done(); }
  };
  document.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copyText(b.dataset.copy, b); });

  /* ---------- Contact form ---------- */
  const cForm = $("#contactForm");
  if (cForm) {
    const wrap = $("#contactFormWrap"), done = $("#contactDone"), err = $("#contactError");
    const q = routeParams().get("type");
    if (q && TYPES[q]) $("#cType").value = q;
    const cDate = $("#cDate");
    if (cDate) cDate.min = new Date().toISOString().slice(0, 10);
    let lastMsg = null;

    const renderDone = () => {
      if (!lastMsg) return;
      const s = S();
      done.innerHTML = `
        <span class="done-ico"><svg><use href="#i-check"/></svg></span>
        <h2>${s.doneT}</h2>
        <p>${esc(s.doneP(lastMsg.name, lastMsg.phone))}</p>
        <div class="done-actions">
          <a class="btn btn-wa" href="${WA}?text=${encodeURIComponent(s.waMsg(lastMsg))}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg> ${s.doneWa}</a>
          <button type="button" class="btn btn-outline" id="contactAgain">${s.doneNew}</button>
        </div>`;
      $("#contactAgain").addEventListener("click", () => { lastMsg = null; cForm.reset(); done.hidden = true; wrap.hidden = false; });
    };

    cForm.addEventListener("submit", e => {
      e.preventDefault();
      const m = {
        id: newId("MSG"), name: $("#cName").value.trim(), phone: $("#cPhone").value.trim(), type: $("#cType").value,
        dest: $("#cDest").value.trim(), date: $("#cDate").value, who: $("#cWho").value, msg: $("#cMsg").value.trim(), at: Date.now()
      };
      if (m.name.length < 2) { showError(err, S().errName); $("#cName").focus(); return; }
      if (digits(m.phone).length < 10) { showError(err, S().errPhone); $("#cPhone").focus(); return; }
      showError(err, "");
      try { store.addMessage(m); } catch (e2) { /* storage unavailable — the WhatsApp hand-off still works */ }
      lastMsg = m;
      renderDone();
      wrap.hidden = true;
      done.hidden = false;
    });
    document.addEventListener("gts:lang", renderDone);
    document.addEventListener("gts:view", e => {
      const t = routeParams().get("type");
      if (e.detail === "contact" && t && TYPES[t]) $("#cType").value = t;
    });
  }

  /* ---------- Payment page ---------- */
  const payForm = $("#payForm");
  if (payForm) {
    const statusEl = $("#payStatus"), err = $("#payError");
    const fTrip = $("#payTrip"), fAmount = $("#payAmount"), fFile = $("#payFile");
    const dz = $("#dropzone"), dzPreview = $("#dzPreview"), dzPick = $("#dzPick");
    let image = null, current = null, lastStatus = null;
    const CUR = "gts-current-payment";

    // prefill from the planner (?pkg=istanbul&amount=1495000)
    const qs = routeParams();
    const pkg = qs.get("pkg");
    if (pkg && TRIPS[pkg]) fTrip.value = pkg;
    const qAmount = digits(qs.get("amount") || "");
    if (qAmount) fAmount.value = (+qAmount).toLocaleString("en");
    else if (pkg && TRIPS[pkg] && TRIPS[pkg].price) fAmount.value = TRIPS[pkg].price.toLocaleString("en");

    const method = () => ($("input[name=payMethod]:checked") || {}).value || "zaincash";
    const summary = () => {
      $("#sumTrip").textContent = name(TRIPS, fTrip.value);
      $("#sumMethod").textContent = name(METHODS, method());
      const a = +digits(fAmount.value);
      $("#sumAmount").textContent = a ? money(a) : "—";
    };
    const showMethod = () => {
      $$(".pm-details").forEach(d => { d.hidden = d.dataset.for !== method(); });
      summary();
    };
    $$("input[name=payMethod]").forEach(r => r.addEventListener("change", showMethod));
    fTrip.addEventListener("change", () => {
      const t = TRIPS[fTrip.value];
      if (t && t.price && !digits(fAmount.value)) fAmount.value = t.price.toLocaleString("en");
      summary();
    });
    // keep the amount readable: 1495000 → 1,495,000
    fAmount.addEventListener("input", () => {
      const d = digits(fAmount.value);
      fAmount.value = d ? (+d).toLocaleString("en") : "";
      summary();
    });
    showMethod();

    /* receipt screenshot: pick, drag & drop or paste */
    const setImage = async file => {
      if (!file) return;
      if (!/^image\//.test(file.type)) { showError(err, S().errType); return; }
      if (file.size > 15 * 1024 * 1024) { showError(err, S().errBig); return; }
      showError(err, "");
      image = { data: await compress(file), name: file.name || "screenshot.png" };
      $("#dzImg").src = image.data;
      $("#dzName").textContent = image.name;
      dzPreview.hidden = false;
      dzPick.hidden = true;
      dz.classList.add("has-file");
    };
    const compress = file => new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        const x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
      img.src = url;
    });
    dzPick.addEventListener("click", () => fFile.click());
    $("#dzChange").addEventListener("click", () => fFile.click());
    fFile.addEventListener("change", () => { setImage(fFile.files[0]).catch(() => showError(err, S().errType)); fFile.value = ""; });
    ["dragenter", "dragover"].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.add("is-drag"); }));
    ["dragleave", "drop"].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.remove("is-drag"); }));
    dz.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; setImage(f).catch(() => showError(err, S().errType)); });
    document.addEventListener("paste", e => {
      if (payForm.hidden) return;
      const item = [...(e.clipboardData || {}).items || []].find(i => i.type.startsWith("image/"));
      if (item) { e.preventDefault(); setImage(item.getAsFile()).catch(() => showError(err, S().errType)); }
    });

    /* status card */
    const renderStatus = () => {
      const r = current && store.get(current);
      if (!r) return;
      const s = S(), st = r.status;
      const ico = st === "approved" ? "i-check" : st === "rejected" ? "i-x" : "i-clock";
      const changed = lastStatus && lastStatus !== st;
      statusEl.className = `pay-card status-card status-card--${st}${changed ? " is-changed" : ""}`;
      statusEl.innerHTML = `
        <div class="sc-head">
          <span class="sc-ico"><svg><use href="#${ico}"/></svg></span>
          <div>
            <span class="badge badge--${st}">${s.st[st]}</span>
            <h2>${s[st + "T"]}</h2>
            <p>${s[st + "P"]}</p>
          </div>
        </div>
        ${r.adminNote ? `<div class="sc-note"><b>${s.adminNote}</b><p>${esc(r.adminNote)}</p></div>` : ""}
        <div class="sc-id"><span>${s.order}</span><b dir="ltr">${r.id}</b><button type="button" class="copy-btn" data-copy="${r.id}"><svg><use href="#i-copy"/></svg><span>${L() === "en" ? "Copy" : "نسخ"}</span></button></div>
        <div class="sc-body">
          <dl class="sc-dl">
            <div><dt>${s.name}</dt><dd>${esc(r.name)}</dd></div>
            <div><dt>${s.phone}</dt><dd dir="ltr">${esc(r.phone)}</dd></div>
            <div><dt>${s.trip}</dt><dd>${esc(name(TRIPS, r.trip))}</dd></div>
            <div><dt>${s.method}</dt><dd>${name(METHODS, r.method)}</dd></div>
            <div><dt>${s.amount}</dt><dd><b>${money(r.amount)}</b></dd></div>
            ${r.ref ? `<div><dt>${s.ref}</dt><dd dir="auto">${esc(r.ref)}</dd></div>` : ""}
            <div><dt>${s.sent}</dt><dd>${when(r.at)}</dd></div>
            ${r.decidedAt ? `<div><dt>${s.decided}</dt><dd>${when(r.decidedAt)}</dd></div>` : ""}
          </dl>
          <figure class="sc-receipt">${r.img ? `<img src="${r.img}" alt="${s.receipt}">` : `<span>${s.noImg}</span>`}<figcaption>${s.receipt}</figcaption></figure>
        </div>
        <div class="sc-actions">
          ${st === "approved" ? `<button type="button" class="btn btn-primary" id="scPrint"><svg><use href="#i-print"/></svg> ${s.print}</button>` : ""}
          ${st === "rejected" ? `<button type="button" class="btn btn-primary" id="scRetry"><svg><use href="#i-upload"/></svg> ${s.retry}</button>` : ""}
          <a class="btn btn-outline" href="${WA}?text=${encodeURIComponent(s.waPay(r.id))}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg> ${s.waAsk}</a>
          <button type="button" class="btn btn-ghost-dark" id="scNew">${s.newPay}</button>
        </div>
        ${st === "pending" ? `<p class="demo-hint">${s.demo}</p>` : ""}`;
      if (changed) {
        toast(st === "approved" ? s.liveApproved : s.liveRejected, st);
        setTimeout(() => statusEl.classList.remove("is-changed"), 1600);
      }
      lastStatus = st;
      const print = $("#scPrint"); if (print) print.addEventListener("click", () => window.print());
      const retry = $("#scRetry"); if (retry) retry.addEventListener("click", () => openForm(r));
      $("#scNew").addEventListener("click", () => openForm());
    };

    const showStatus = (id, scroll) => {
      current = id;
      lastStatus = null;
      try { localStorage.setItem(CUR, id); } catch (e) { /* ignore */ }
      payForm.hidden = true;
      statusEl.hidden = false;
      renderStatus();
      if (scroll && statusEl.getBoundingClientRect().top < 80) statusEl.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const openForm = prefill => {
      current = null; lastStatus = null;
      try { localStorage.removeItem(CUR); } catch (e) { /* ignore */ }
      payForm.reset();
      image = null; dzPreview.hidden = true; dzPick.hidden = false; dz.classList.remove("has-file");
      if (prefill) {
        $("#payName").value = prefill.name; $("#payPhone").value = prefill.phone; fTrip.value = prefill.trip;
        fAmount.value = (+prefill.amount).toLocaleString("en"); $("#payRef").value = prefill.ref || "";
        const m = $(`input[name=payMethod][value="${prefill.method}"]`); if (m) m.checked = true;
      }
      showMethod();
      statusEl.hidden = true;
      payForm.hidden = false;
      if (payForm.getBoundingClientRect().top < 80) payForm.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const synced = onStoreChange(() => { if (current) renderStatus(); });

    payForm.addEventListener("submit", e => {
      e.preventDefault();
      const s = S();
      const r = {
        id: newId("GTS"), name: $("#payName").value.trim(), phone: $("#payPhone").value.trim(), trip: fTrip.value,
        amount: +digits(fAmount.value), method: method(), ref: $("#payRef").value.trim(), note: $("#payNote").value.trim(),
        img: image && image.data, imgName: image && image.name, status: "pending", at: Date.now(), lang: L()
      };
      if (r.name.length < 2) { showError(err, s.errName); $("#payName").focus(); return; }
      if (digits(r.phone).length < 10) { showError(err, s.errPhone); $("#payPhone").focus(); return; }
      if (!r.amount) { showError(err, s.errAmount); fAmount.focus(); return; }
      if (!r.img) { showError(err, s.errImg); dz.classList.add("is-missing"); setTimeout(() => dz.classList.remove("is-missing"), 900); return; }
      showError(err, "");
      const btn = $("#paySubmit"), label = $("span", btn), old = label.textContent;
      btn.disabled = true; label.textContent = s.sending;
      setTimeout(() => {
        btn.disabled = false; label.textContent = old;
        if (!store.addPayment(r)) { showError(err, s.errStore); return; }
        synced();
        showStatus(r.id, true);
      }, 900);
    });

    $("#trackForm").addEventListener("submit", e => {
      e.preventDefault();
      const id = $("#trackId").value.trim().toUpperCase();
      const tErr = $("#trackError");
      if (!id) return;
      if (!store.get(id)) { showError(tErr, S().notFound); return; }
      showError(tErr, "");
      $("#trackId").value = "";
      showStatus(id, true);
    });

    // returning visitor: show the last request's status (unless they came to pay for a package)
    let saved = null;
    try { saved = localStorage.getItem(CUR); } catch (e) { /* ignore */ }
    if (saved && !pkg && store.get(saved)) showStatus(saved);

    // arriving from a package / the planner (#payment?pkg=dubai&amount=…)
    document.addEventListener("gts:view", e => {
      const q = routeParams(), k = q.get("pkg");
      if (e.detail !== "payment" || !k || !TRIPS[k]) return;
      if (!statusEl.hidden) openForm();
      fTrip.value = k;
      const a = digits(q.get("amount") || "") || TRIPS[k].price;
      fAmount.value = a ? (+a).toLocaleString("en") : "";
      summary();
    });
    document.addEventListener("gts:lang", () => { summary(); if (current) { const ls = lastStatus; renderStatus(); lastStatus = ls; } });
  }

  /* ---------- Admin panel ---------- */
  const adminApp = $("#adminApp");
  if (adminApp) {
    const PIN = "1234"; // demo only — real authentication belongs on the server
    const login = $("#adminLogin"), list = $("#adminList"), logout = $("#adminLogout");
    let filter = "pending", known = null;

    const enter = () => { login.hidden = true; adminApp.hidden = false; logout.hidden = false; render(); };
    $("#loginForm").addEventListener("submit", e => {
      e.preventDefault();
      if ($("#adminPin").value.trim() !== PIN) { showError($("#loginError"), S().badPin); return; }
      showError($("#loginError"), "");
      sessionStorage.setItem("gts-admin", "1");
      enter();
    });
    logout.addEventListener("click", () => { sessionStorage.removeItem("gts-admin"); location.reload(); });

    const row = (k, v, attrs = "") => (v ? `<div><dt>${k}</dt><dd ${attrs}>${v}</dd></div>` : "");

    const render = () => {
      if (adminApp.hidden) return;
      const s = S(), pays = store.payments(), msgs = store.messages();
      // notify about requests that arrived while the panel is open
      const pendingIds = pays.filter(p => p.status === "pending").map(p => p.id);
      if (known && pendingIds.some(id => !known.has(id))) toast(s.newReq, "pending");
      known = new Set(pays.map(p => p.id));

      $("#cntPending").textContent = pendingIds.length;
      $("#cntApproved").textContent = pays.filter(p => p.status === "approved").length;
      $("#cntRejected").textContent = pays.filter(p => p.status === "rejected").length;
      $("#cntMsg").textContent = msgs.length;
      $$(".admin-tabs button").forEach(b => b.classList.toggle("is-active", b.dataset.filter === filter));

      // keep notes the admin is typing
      const drafts = {};
      $$(".req-note", list).forEach(t => { if (t.value) drafts[t.dataset.id] = t.value; });

      if (filter === "messages") {
        list.innerHTML = msgs.length ? msgs.map(m => `
          <article class="req req--msg">
            <div class="req-body">
              <header><b class="req-id">${esc(m.name)}</b><span class="badge badge--msg">${name(TYPES, m.type)}</span><time>${when(m.at)}</time></header>
              <dl class="req-meta">
                ${row(s.phone, esc(m.phone), 'dir="ltr"')}
                ${row(s.dest, esc(m.dest))}
                ${row(s.date, esc(m.date), 'dir="ltr"')}
                ${row(s.who, name(WHO, m.who))}
              </dl>
              ${m.msg ? `<p class="req-msg">${esc(m.msg)}</p>` : ""}
              <div class="req-actions">
                <a class="btn btn-sm btn-wa" href="https://wa.me/${digits(m.phone).replace(/^0/, "964")}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg> WhatsApp</a>
                <a class="btn btn-sm btn-outline" href="tel:${esc(m.phone)}"><svg><use href="#i-phone"/></svg> ${s.call}</a>
                <button type="button" class="btn btn-sm btn-ghost-dark" data-del="${m.id}">${s.del}</button>
              </div>
            </div>
          </article>`).join("") : `<p class="admin-empty">${s.empty.messages}</p>`;
        return;
      }

      const shown = filter === "all" ? pays : pays.filter(p => p.status === filter);
      list.innerHTML = shown.length ? shown.map(p => `
        <article class="req req--${p.status}">
          <button type="button" class="req-thumb" ${p.img ? `data-img="${p.id}"` : "disabled"} aria-label="${s.receipt}">
            ${p.img ? `<img src="${p.img}" alt="">` : `<span>${s.noImg}</span>`}
          </button>
          <div class="req-body">
            <header><b class="req-id" dir="ltr">${p.id}</b><span class="badge badge--${p.status}">${s.st[p.status]}</span><time>${when(p.at)}</time></header>
            <dl class="req-meta">
              ${row(s.name, esc(p.name))}
              ${row(s.phone, esc(p.phone), 'dir="ltr"')}
              ${row(s.trip, esc(name(TRIPS, p.trip)))}
              ${row(s.method, name(METHODS, p.method))}
              ${row(s.amount, `<b>${money(p.amount)}</b>`)}
              ${row(s.ref, esc(p.ref), 'dir="auto"')}
            </dl>
            ${p.note ? `<p class="req-msg"><b>${s.note}:</b> ${esc(p.note)}</p>` : ""}
            ${p.status === "pending" ? `
              <div class="req-actions">
                <input type="text" class="req-note" data-id="${p.id}" placeholder="${s.notePh}" value="${esc(drafts[p.id] || "")}">
                <button type="button" class="btn btn-sm btn-success" data-act="approved" data-id="${p.id}"><svg><use href="#i-check"/></svg> ${s.approve}</button>
                <button type="button" class="btn btn-sm btn-danger" data-act="rejected" data-id="${p.id}"><svg><use href="#i-close"/></svg> ${s.reject}</button>
              </div>` : `
              <div class="req-actions req-actions--done">
                <span class="req-decided">${s.st[p.status]} · ${when(p.decidedAt)}${p.adminNote ? ` · «${esc(p.adminNote)}»` : ""}</span>
                <button type="button" class="btn btn-sm btn-ghost-dark" data-act="pending" data-id="${p.id}">${s.undo}</button>
              </div>`}
          </div>
        </article>`).join("") : `<p class="admin-empty">${s.empty[filter]}<br><small>${s.emptyHint}</small></p>`;
    };

    const synced = onStoreChange(render);

    $$(".admin-tabs button").forEach(b => b.addEventListener("click", () => { filter = b.dataset.filter; render(); }));
    list.addEventListener("click", e => {
      const act = e.target.closest("[data-act]");
      if (act) {
        const id = act.dataset.id, st = act.dataset.act;
        const noteEl = $(`.req-note[data-id="${id}"]`, list);
        const patch = st === "pending" ? { status: "pending", decidedAt: null, adminNote: "" } : { status: st, decidedAt: Date.now(), adminNote: noteEl ? noteEl.value.trim() : "" };
        const card = act.closest(".req");
        card.classList.add("is-leaving");
        setTimeout(() => { store.update(id, patch); synced(); render(); }, filter === "all" ? 0 : 260);
        return;
      }
      const del = e.target.closest("[data-del]");
      if (del) { store.removeMessage(del.dataset.del); synced(); render(); return; }
      const th = e.target.closest("[data-img]");
      if (th) {
        const p = store.get(th.dataset.img);
        if (!p || !p.img) return;
        $("#imgFull").src = p.img;
        $("#imgModal").hidden = false;
        document.body.style.overflow = "hidden";
      }
    });
    const closeImg = () => { $("#imgModal").hidden = true; document.body.style.overflow = ""; };
    $("#imgClose").addEventListener("click", closeImg);
    $("#imgModal").addEventListener("click", e => { if (e.target.id === "imgModal") closeImg(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#imgModal").hidden) closeImg(); });
    $("#adminClear").addEventListener("click", () => { if (confirm(S().clearAsk)) { store.clear(); synced(); render(); } });
    document.addEventListener("gts:lang", render);
    if (sessionStorage.getItem("gts-admin") === "1") enter();
  }
})();
