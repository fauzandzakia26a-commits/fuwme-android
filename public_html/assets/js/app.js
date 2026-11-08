(() => {
  "use strict";

  /* ---------------- konstanta ---------------- */
  const USER_KEY  = "scheduler.user";
  const eventsKey = (email) => "scheduler.events." + email;
  const calendarsKey = (email) => "scheduler.calendars." + email;
  const notifiedEventsKey = (email) => "scheduler.notified." + email;
  const soundKey = (email) => "scheduler.sound." + email;
  const sakuraKey = (email) => "scheduler.sakura." + email;
  const budgetKey = (email) => "scheduler.budget." + email;
  const weatherKey = (email) => "scheduler.weather." + email;
  const DEFAULT_CALENDAR = { id: "default", name: "Pribadi", color: "#D98AA6" };
  const CATEGORY_COLORS = [
    "#D98AA6", "#7A9E9F", "#E0A458", "#8A83B8", "#65A989",
    "#D2765F", "#5F8FC2", "#B17AB5", "#9B9B52", "#C07888",
  ];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const NAME_RE  = /^[a-zA-Z0-9 _.-]{2,24}$/;

  const LOKAL = "id-ID";
  const monthFmt = new Intl.DateTimeFormat(LOKAL, { month: "long", year: "numeric" });
  const dayFmt   = new Intl.DateTimeFormat(LOKAL, {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  /* ---------------- cache elemen ---------------- */
  const $ = (id) => document.getElementById(id);
  const els = {
    signinScreen: $("signin-screen"),
    subscriptionScreen: $("subscription-screen"),
    selectProPlan: $("selectProPlan"),
    selectAlphaPlan: $("selectAlphaPlan"),
    subscriptionSelectionStatus: $("subscriptionSelectionStatus"),
    appScreen:    $("app-screen"),
    signinForm:   $("signin-form"),
    nameInput:    $("shortName"),
    emailInput:   $("email"),
    nameError:    $("nameError"),
    emailError:   $("emailError"),
    userName:     $("userName"),
    userEmail:    $("userEmail"),
    signOutBtn:   $("signOutBtn"),
    accountMenuBtn: $("accountMenuBtn"),
    accountMenu:  $("accountMenu"),
    calendarView: $("calendar-view"),
    trackerView:  $("tracker-view"),
    settingsView: $("settings-view"),
    categoryMenuBtn: $("categoryMenuBtn"),
    categoryMenu: $("categoryMenu"),
    activeCategoryName: $("activeCategoryName"),
    createCalendarBtn: $("createCalendarBtn"),
    calendarForm: $("calendar-form"),
    calendarName: $("calendarName"),
    calendarColor: $("calendarColor"),
    saveCategoryBtn: $("saveCategoryBtn"),
    cancelCategoryEditBtn: $("cancelCategoryEditBtn"),
    calendarError: $("calendarError"),
    calendarList: $("calendarList"),
    trackerCalendarName: $("trackerCalendarName"),
    trackerTotal: $("trackerTotal"),
    trackerUpcoming: $("trackerUpcoming"),
    trackerDays: $("trackerDays"),
    trackerDuration: $("trackerDuration"),
    trackerList: $("trackerList"),
    trackerEmpty: $("trackerEmpty"),
    trackerChart: $("trackerChart"),
    trackerLegend: $("trackerLegend"),
    nextEventCountdown: $("nextEventCountdown"),
    prevMonth:    $("prevMonth"),
    nextMonth:    $("nextMonth"),
    todayBtn:     $("todayBtn"),
    yearViewBtn:  $("yearViewBtn"),
    monthLabel:   $("monthLabel"),
    calWeekdays:  $("calWeekdays"),
    calGrid:      $("cal-grid"),
    eventSearch: $("eventSearch"),
    eventSearchStatus: $("eventSearchStatus"),
    eventSearchResults: $("eventSearchResults"),
    toggleSearchBtn: $("toggleSearchBtn"),
    toggleQuickAddBtn: $("toggleQuickAddBtn"),
    calendarSearchPanel: $("calendarSearchPanel"),
    dateTimeWidget: $("dateTimeWidget"),
    currentLocationBtn: $("currentLocationBtn"),
    currentLocationLabel: $("currentLocationLabel"),
    quickAddForm: $("quickAddForm"),
    quickAddInput: $("quickAddInput"),
    quickAddSubmit: $("quickAddSubmit"),
    quickAddStatus: $("quickAddStatus"),
    aiChatLauncher: $("aiChatLauncher"),
    aiChatPanel: $("aiChatPanel"),
    aiChatClose: $("aiChatClose"),
    aiChatClear: $("aiChatClear"),
    aiChatMessages: $("aiChatMessages"),
    aiChatForm: $("aiChatForm"),
    aiChatInput: $("aiChatInput"),
    aiChatSend: $("aiChatSend"),
    scheduleList: $("scheduleList"),
    eventChecklistInput: $("eventChecklistInput"),
    eventStatus: $("eventStatus"),
    habitHeatmap: $("habitHeatmap"),
    heatmapYear: $("heatmapYear"),
    weeklyReport: $("weeklyReport"),
    timeBudgetSummary: $("timeBudgetSummary"),
    sakuraCount: $("sakuraCount"),
    sakuraCountValue: $("sakuraCountValue"),
    sakuraSize: $("sakuraSize"),
    sakuraSizeValue: $("sakuraSizeValue"),
    sakuraSpeed: $("sakuraSpeed"),
    sakuraSpeedValue: $("sakuraSpeedValue"),
    timeBudgetSettings: $("timeBudgetSettings"),
    budgetStatus: $("budgetStatus"),
    installAppPrompt: $("installAppPrompt"),
    installAppBtn: $("installAppBtn"),
    installAppStatus: $("installAppStatus"),
    weatherEnableBtn: $("weatherEnableBtn"),
    weatherStatus: $("weatherStatus"),
    notificationStatus: $("notificationStatus"),
    soundEnabled: $("soundEnabled"),
    soundStatus: $("soundStatus"),
    modal:        $("day-modal"),
    modalTitle:   $("modalTitle"),
    eventForm:    $("event-form"),
    cancelEventEditBtn: $("cancelEventEditBtn"),
    titleInput:   $("title"),
    eventDate: $("eventDate"),
    eventRecurrence: $("eventRecurrence"),
    recurrenceHelp: $("recurrenceHelp"),
    startHour:    $("startHour"),
    startMinute:  $("startMinute"),
    endHour:      $("endHour"),
    endMinute:    $("endMinute"),
    eventFormError: $("eventFormError"),
    eventList:    $("event-list"),
    emptyMsg:     $("empty"),
  };

  let deferredInstallPrompt = null;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  if (isStandalone) {
    els.installAppStatus.textContent = "FUWME sudah terpasang di perangkat ini.";
  } else if (isIOS) {
    els.installAppPrompt.hidden = false;
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installAppPrompt.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    els.installAppPrompt.hidden = true;
    els.installAppStatus.textContent = "FUWME berhasil ditambahkan ke layar utama.";
  });
  els.installAppBtn.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (outcome === "accepted") {
        els.installAppPrompt.hidden = true;
        els.installAppStatus.textContent = "FUWME sedang dipasang di perangkat.";
      }
      return;
    }
    els.installAppStatus.textContent = isIOS
      ? "Di Safari, tekan Bagikan lalu pilih Tambahkan ke Layar Utama."
      : "Di Chrome, buka menu â‹® lalu pilih Instal aplikasi atau Tambahkan ke layar utama.";
  });

  document.querySelectorAll(".cat-hop-button").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.remove("is-hopping");
      void button.offsetWidth;
      button.classList.add("is-hopping");
      playSound("cat");
    });
    button.addEventListener("animationend", () => {
      button.classList.remove("is-hopping");
    });
  });

  els.eventSearch.addEventListener("input", () => {
    searchFocus = null;
    updateSearchStatus();
    renderCalendar();
    renderSearchResults();
    if (!els.modal.hidden) renderModal();
  });

  [
    [els.toggleSearchBtn, els.calendarSearchPanel, els.eventSearch],
    [els.toggleQuickAddBtn, els.quickAddForm, els.quickAddInput],
  ].forEach(([button, panel, input]) => {
    button.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
      button.setAttribute("aria-label", `${panel.hidden ? "Buka" : "Tutup"} ${panel === els.calendarSearchPanel ? "pencarian kegiatan" : "tambah cepat"}`);
      if (!panel.hidden) input.focus();
    });
  });
  els.currentLocationBtn.addEventListener("click", refreshLocationAndWeather);
  els.aiChatLauncher.addEventListener("click", toggleAIChat);
  els.aiChatClose.addEventListener("click", closeAIChat);
  els.aiChatClear.addEventListener("click", resetAIChat);
  els.aiChatForm.addEventListener("submit", sendAIChatMessage);
  els.aiChatPanel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAIChat();
  });
  els.aiChatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      els.aiChatForm.requestSubmit();
    }
  });

  els.quickAddForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const raw = els.quickAddInput.value.trim();
    if (!raw) return;
    if (!["pro", "alpha"].includes(ambilTierLanggananFuwme())) {
      els.quickAddStatus.textContent = "Fitur AI ini khusus untuk member Pro atau Alpha. Silakan tingkatkan akun Anda di menu Pengaturan.";
      return;
    }

    let parsed = null;
    let aiUnavailable = false;
    els.quickAddSubmit.disabled = true;
    els.quickAddSubmit.textContent = "AI memproses...";
    els.quickAddStatus.textContent = "FUWME AI sedang membaca jadwal...";
    try {
      parsed = await parseQuickAddWithAI(raw);
    } catch (error) {
      console.error("FUWME AI online tidak dapat digunakan:", error);
      aiUnavailable = true;
      parsed = parseQuickAdd(raw);
    } finally {
      els.quickAddSubmit.disabled = false;
      els.quickAddSubmit.textContent = "Buat dengan AI";
    }

    if (!parsed) {
      els.quickAddStatus.textContent = aiUnavailable
        ? "AI Groq belum terhubung dan jadwal belum dikenali. Periksa konfigurasi GROQ_API_KEY di server, atau tulis kegiatan, tanggal, dan jam (contoh: Rapat besok jam 3 sore)."
        : "Jadwal belum dikenali. Coba tulis kegiatan, tanggal, dan jam dengan lebih jelas.";
      els.quickAddInput.focus();
      return;
    }
    selectedDate = parsed.date;
    const date = new Date(`${parsed.date}T00:00`);
    viewYear = date.getFullYear();
    viewMonth = date.getMonth();
    calendarMode = "month";
    showView("calendar");
    renderCalendar();
    openModal(parsed.date);
    els.titleInput.value = parsed.title;
    setTime("start", parsed.time);
    const [hour, minute] = parsed.time.split(":").map(Number);
    const end = (hour * 60 + minute + 60) % (24 * 60);
    setTime("end", `${pad2(Math.floor(end / 60))}:${pad2(end % 60)}`);
    els.quickAddStatus.textContent = aiUnavailable
      ? "AI online tidak tersedia; jadwal dikenali dengan parser biasa. Tinjau lalu simpan."
      : "Jadwal berhasil dibaca AI; tinjau lalu simpan.";
    els.quickAddInput.value = "";
  });

  document.querySelector(".calendar-view-switch").addEventListener("click", (event) => {
    const button = event.target.closest("[data-calendar-mode]");
    if (!button) return;
    calendarMode = button.dataset.calendarMode === "list" ? "list" : "month";
    document.querySelectorAll("[data-calendar-mode]").forEach((item) =>
      item.setAttribute("aria-pressed", String(item.dataset.calendarMode === calendarMode))
    );
    renderCalendar();
  });

  [els.sakuraCount, els.sakuraSize, els.sakuraSpeed].forEach((input) => {
    input.addEventListener("input", updateSakuraSettings);
  });
  els.weatherEnableBtn.addEventListener("click", refreshLocationAndWeather);

  els.soundEnabled.addEventListener("change", () => {
    soundEnabled = els.soundEnabled.checked;
    els.soundStatus.textContent = "";
    if (!currentUser) return;
    try {
      localStorage.setItem(soundKey(currentUser.email), String(soundEnabled));
    } catch {
      els.soundStatus.textContent = "Preferensi suara tidak dapat disimpan di browser ini.";
    }
  });

  /* ---------------- state ---------------- */
  let currentUser  = null;
  let aiChatHistory = [];
  let events       = [];
  let calendars    = [{ ...DEFAULT_CALENDAR }];
  let activeCalendarId = DEFAULT_CALENDAR.id;
  let viewYear     = 0;
  let viewMonth    = 0;
  let calendarMode = "month";
  let selectedDate = "";
  let searchFocus = null;
  const notificationSettings = { leadMinutes: 5, message: "{title} dimulai pukul {time}" };
  let notifiedEvents = new Set();
  let notificationTimer = null;
  let clockDrag = null;
  let editingEventId = null;
  let trackerChartMode = "circle";
  let soundEnabled = false;
  let dateTimeTimer = null;
  let cleanupTimer = null;
  let weatherForecast = {};
  let pendingSharedEvent = null;
  let printRestoreMode = null;

  /* ---------------- utilitas tanggal ---------------- */
  const pad2 = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const todayISO = () => toISO(new Date());
  const byDateThenTime = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

  function parseQuickAdd(raw) {
    let text = raw.trim();
    if (!text) return null;
    const now = new Date();
    let date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateMatch = text.match(/\b(hari ini|besok|lusa)\b/i);
    if (dateMatch) {
      date.setDate(date.getDate() + ({ "hari ini": 0, besok: 1, lusa: 2 }[dateMatch[1].toLocaleLowerCase(LOKAL)]));
      text = text.replace(dateMatch[0], " ");
    } else {
      const weekdayMatch = text.match(/\b(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b/i);
      if (weekdayMatch) {
        const weekdays = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
        const target = weekdays.indexOf(weekdayMatch[1].toLocaleLowerCase(LOKAL));
        date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7 || 7));
        text = text.replace(weekdayMatch[0], " ");
      }
    }

    let hours = 9;
    let minutes = 0;
    const timeMatch = text.match(/\b(?:jam|pukul)?\s*(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?\b/i);
    if (!timeMatch) return null;
    hours = Number(timeMatch[1]);
    minutes = Number(timeMatch[2] || 0);
    const period = (timeMatch[3] || "").toLocaleLowerCase(LOKAL);
    if (minutes > 59 || hours > 23) return null;
    if (period === "pagi" && hours === 12) hours = 0;
    if ((period === "siang" || period === "sore" || period === "malam") && hours < 12) hours += 12;
    if (hours > 23) return null;
    text = text.replace(timeMatch[0], " ").trim();
    const title = text.replace(/^(jadwalkan|buat|tambah|catat)\s+/i, "").trim();
    return title ? { title, date: toISO(date), time: `${pad2(hours)}:${pad2(minutes)}` } : null;
  }

  function toggleAIChat() {
    els.aiChatPanel.hidden = !els.aiChatPanel.hidden;
    els.aiChatLauncher.setAttribute("aria-expanded", String(!els.aiChatPanel.hidden));
    if (!els.aiChatPanel.hidden) els.aiChatInput.focus();
  }

  function closeAIChat() {
    els.aiChatPanel.hidden = true;
    els.aiChatLauncher.setAttribute("aria-expanded", "false");
    els.aiChatLauncher.focus();
  }

  function addAIChatMessage(role, text) {
    const message = document.createElement("article");
    message.className = `ai-chat-message ai-chat-${role}`;
    if (role === "assistant") {
      const avatar = document.createElement("span");
      avatar.className = "ai-chat-message-avatar";
      const image = document.createElement("img");
      image.src = "./assets/images/kaisar-mascot.png";
      image.alt = "";
      avatar.appendChild(image);
      message.appendChild(avatar);
    }

    const content = document.createElement("p");
    content.textContent = text;
    message.appendChild(content);
    els.aiChatMessages.appendChild(message);
    els.aiChatMessages.scrollTop = els.aiChatMessages.scrollHeight;
    return message;
  }

  function resetAIChat() {
    aiChatHistory = [];
    els.aiChatMessages.replaceChildren();
    const greeting = currentUser
      ? `Hai, ${currentUser.name}! Aku Kaisar dari FUWME Circle. Mau ngobrol atau merencanakan harimu?`
      : "Hai! Aku Kaisar dari FUWME Circle. Aku siap menemani dan membantu merencanakan harimu.";
    addAIChatMessage("assistant", greeting);
    if (!els.aiChatPanel.hidden) els.aiChatInput.focus();
  }

  function getAIChatScheduleContext() {
    const upcoming = events
      .filter((event) => event.date >= todayISO() && event.calendarId === activeCalendarId)
      .sort(byDateThenTime)
      .slice(0, 10);
    if (!upcoming.length) return "Tidak ada jadwal mendatang di kalender yang sedang dipilih.";
    return upcoming.map((event) =>
      `- ${event.date} ${event.time || "09:00"}: ${event.title} (${event.status || "todo"})`
    ).join("\n");
  }

  async function sendAIChatMessage(event) {
    event.preventDefault();
    const text = els.aiChatInput.value.trim();
    if (!text || els.aiChatSend.disabled || !currentUser) return;

    aiChatHistory.push({ role: "user", content: text });
    addAIChatMessage("user", text);
    els.aiChatInput.value = "";
    els.aiChatSend.disabled = true;
    els.aiChatPanel.setAttribute("aria-busy", "true");
    const typing = document.createElement("article");
    typing.className = "ai-chat-message ai-chat-assistant ai-chat-typing";
    typing.setAttribute("aria-label", "FUWME sedang mengetik");
    typing.innerHTML = '<span class="ai-chat-message-avatar"><img src="./assets/images/kaisar-mascot.png" alt="" /></span><span class="ai-chat-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    els.aiChatMessages.appendChild(typing);
    els.aiChatMessages.scrollTop = els.aiChatMessages.scrollHeight;

    try {
      const messages = [
        {
          role: "system",
          content: [
            "Kamu adalah Kaisar, maskot FUWME Circle yang ramah, hangat, dan membantu pengguna mengatur jadwal.",
            `Sapa pengguna dengan nama ${currentUser.name}. Jawab menggunakan Bahasa Indonesia kecuali pengguna memakai bahasa lain.`,
            "Bantu menjawab pertanyaan dan memberi saran praktis berdasarkan jadwal jika relevan. Kamu tidak bisa mengubah atau menyimpan jadwal; arahkan pengguna ke kalender untuk itu.",
            `Tanggal hari ini: ${todayISO()}. Jadwal mendatang pada kalender aktif:\n${getAIChatScheduleContext()}`,
          ].join("\n"),
        },
        ...aiChatHistory.slice(-12),
      ];
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error(`Layanan AI merespons dengan status ${response.status}.`);
      const result = await response.json();
      const reply = result.message && result.message.content;
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Respons FUWME AI kosong atau tidak sesuai format.");
      }

      typing.remove();
      aiChatHistory.push({ role: "assistant", content: reply.trim() });
      aiChatHistory = aiChatHistory.slice(-12);
      addAIChatMessage("assistant", reply.trim());
    } catch (error) {
      console.error("FUWME AI chat gagal:", error);
      typing.remove();
      addAIChatMessage(
        "assistant",
        "Maaf, aku belum bisa terhubung ke Groq Cloud. Pastikan GROQ_API_KEY dan GROQ_MODEL sudah dikonfigurasi di Hostinger, lalu coba lagi."
      );
    } finally {
      els.aiChatSend.disabled = false;
      els.aiChatPanel.removeAttribute("aria-busy");
      if (!els.aiChatPanel.hidden) els.aiChatInput.focus();
    }
  }

  async function parseQuickAddWithAI(raw) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          format: "json",
          stream: false,
          options: { temperature: 0.1 },
          prompt: [
            "Kamu adalah asisten penjadwalan FUWME.",
            `Tanggal hari ini: ${todayISO()}.`,
            "Ubah permintaan pengguna menjadi satu objek JSON dengan properti title, date, dan time.",
            "title hanya nama kegiatan; jangan masukkan kata tanggal atau waktu seperti besok, Senin, atau pukul 3. Contoh: 'Rapat besok jam 3 sore' menjadi title 'Rapat'.",
            "date harus YYYY-MM-DD dan time harus format 24 jam HH:MM.",
            "Gunakan tanggal hari ini bila tanggal tidak disebutkan dan 09:00 bila jam tidak disebutkan.",
            "Jangan sertakan markdown atau teks di luar objek JSON.",
            `Permintaan pengguna: ${JSON.stringify(raw)}`,
          ].join("\n"),
        }),
      });
      if (!response.ok) throw new Error(`Layanan AI merespons dengan status ${response.status}.`);

      const result = await response.json();
      const parsed = JSON.parse(result.response);
      if (
        !parsed || typeof parsed.title !== "string" ||
        typeof parsed.date !== "string" || typeof parsed.time !== "string"
      ) {
        throw new Error("Respons AI tidak memiliki format jadwal yang benar.");
      }

      const date = new Date(`${parsed.date}T00:00:00`);
      if (
        !parsed.title.trim() || parsed.title.trim().length > 120 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ||
        Number.isNaN(date.getTime()) || toISO(date) !== parsed.date ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.time)
      ) {
        throw new Error("Respons AI berisi tanggal, jam, atau nama kegiatan yang tidak valid.");
      }

      return { title: parsed.title.trim(), date: parsed.date, time: parsed.time };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function renderDateTimeWidget() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat(LOKAL, {
      weekday: "short", day: "numeric", month: "short",
    }).formatToParts(now).reduce((result, part) => {
      result[part.type] = part.value.replace(/\./g, "");
      return result;
    }, {});
    els.dateTimeWidget.textContent =
      `${parts.weekday}, ${parts.day} ${parts.month} | ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  }

  function getCurrentPosition() {
    if (!navigator.geolocation) {
      return Promise.reject(new Error("Browser ini tidak mendukung lokasi."));
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        maximumAge: 600000,
        timeout: 20000,
      });
    });
  }

  function locationErrorMessage(error) {
    if (error && typeof error.code === "number") {
      return ({
        1: "Izin lokasi ditolak. Izinkan akses lokasi di pengaturan browser.",
        2: "Lokasi tidak tersedia. Periksa GPS atau jaringan perangkat.",
        3: "Pencarian lokasi melewati batas waktu. Coba lagi.",
      })[error.code] || "Lokasi GPS gagal diperoleh.";
    }
    return error.message || "Lokasi GPS gagal diperoleh.";
  }

  async function updateLocationName(coords) {
    const { latitude, longitude, accuracy } = coords;
    const coordinates = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=14&accept-language=id`
    );
    if (!response.ok) throw new Error("Layanan nama lokasi tidak merespons.");
    const place = await response.json();
    const address = place.address || {};
    const name = address.suburb || address.neighbourhood || address.city_district ||
      address.city || address.town || address.village || address.county;
    els.currentLocationLabel.textContent = name || coordinates;
    els.currentLocationBtn.title = `${coordinates} (akurasi Â±${Math.round(accuracy)} m)`;
    els.currentLocationBtn.setAttribute(
      "aria-label",
      `Lokasi saat ini: ${els.currentLocationLabel.textContent}. Perbarui lokasi dan cuaca`
    );
  }

  function startDateTimeClock() {
    renderDateTimeWidget();
    if (dateTimeTimer !== null) window.clearInterval(dateTimeTimer);
    dateTimeTimer = window.setInterval(renderDateTimeWidget, 1000);
  }

  function startAutomaticCleanup() {
    if (cleanupTimer !== null) window.clearInterval(cleanupTimer);
    cleanupTimer = window.setInterval(cleanUpPastEvents, 60000);
  }

  function cleanUpPastEvents() {
    if (!currentUser) return;
    const knownIds = new Set(events.map((event) => event.id));
    const retained = [...notifiedEvents].filter((id) =>
      [...knownIds].some((eventId) => id === eventId || id.startsWith(`${eventId}@`))
    );
    if (retained.length !== notifiedEvents.size) {
      notifiedEvents = new Set(retained);
      saveNotifiedEvents();
    }
    renderCountdown();
  }

  function getSakuraPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(sakuraKey(currentUser.email)) || "null");
      return {
        count: Math.max(0, Math.min(20, Number.isFinite(Number(saved?.count)) ? Number(saved.count) : 10)),
        size: Math.max(6, Math.min(24, Number(saved?.size) || 14)),
        speed: Math.max(8, Math.min(40, Number(saved?.speed) || 20)),
      };
    } catch {
      return { count: 10, size: 14, speed: 20 };
    }
  }

  function updateSakuraSettings() {
    const count = Number(els.sakuraCount.value);
    const size = Number(els.sakuraSize.value);
    const speed = Number(els.sakuraSpeed.value);
    els.sakuraCountValue.value = String(count);
    els.sakuraSizeValue.value = `${size} px`;
    els.sakuraSpeedValue.value = `${speed} dtk`;
    const container = $("sakuraPetals");
    container.hidden = count === 0;
    container.style.setProperty("--sakura-size", `${size}px`);
    container.style.setProperty("--sakura-duration", `${speed}s`);
    [...container.children].forEach((petal, index) => {
      petal.hidden = index >= count;
      petal.style.setProperty("--left", `${((index * 37) % 100)}%`);
      petal.style.setProperty("--size", `${Math.max(6, size + (index % 5) - 2)}px`);
      petal.style.setProperty("--duration", `${Math.max(8, speed + (index % 7) - 3)}s`);
    });
    if (currentUser) {
      try {
        localStorage.setItem(sakuraKey(currentUser.email), JSON.stringify({ count, size, speed }));
      } catch {
        els.soundStatus.textContent = "Preferensi animasi tidak dapat disimpan di browser ini.";
      }
    }
  }

  function loadSakuraSettings() {
    const saved = getSakuraPreferences();
    els.sakuraCount.value = String(saved.count);
    els.sakuraSize.value = String(saved.size);
    els.sakuraSpeed.value = String(saved.speed);
    updateSakuraSettings();
  }

  function loadWeatherForecast() {
    weatherForecast = {};
    if (!currentUser) return;
    try {
      weatherForecast = JSON.parse(localStorage.getItem(weatherKey(currentUser.email)) || "{}");
      if (!weatherForecast || typeof weatherForecast !== "object" || Array.isArray(weatherForecast)) {
        weatherForecast = {};
      }
    } catch {
      weatherForecast = {};
      els.weatherStatus.textContent = "Data prakiraan tersimpan tidak dapat dibaca.";
    }
  }

  function weatherLabel(code) {
    if (code === 0 || code === 1) return ["â˜€ï¸", "Cerah"];
    if (code === 2 || code === 3 || (code >= 45 && code <= 48)) return ["â˜ï¸", "Berawan"];
    return ["ðŸŒ§ï¸", "Hujan"];
  }

  async function updateWeatherForecast(coords, email) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
      daily: "weather_code",
      timezone: "auto",
      forecast_days: "7",
    }).toString();
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Layanan cuaca merespons ${response.status}.`);
    const data = await response.json();
    if (
      !Array.isArray(data.daily?.time) ||
      !Array.isArray(data.daily?.weather_code) ||
      data.daily.time.length !== data.daily.weather_code.length
    ) {
      throw new Error("Format data prakiraan cuaca tidak valid.");
    }
    const forecast = Object.fromEntries(data.daily.time.map((date, index) =>
      [date, Number(data.daily.weather_code[index])]
    ));
    if (Object.values(forecast).some((code) => !Number.isFinite(code))) {
      throw new Error("Data kode cuaca tidak valid.");
    }
    if (!currentUser || currentUser.email !== email) return;
    weatherForecast = forecast;
    try {
      localStorage.setItem(weatherKey(email), JSON.stringify(weatherForecast));
      els.weatherStatus.textContent = "Prakiraan 7 hari berhasil diperbarui.";
    } catch {
      els.weatherStatus.textContent = "Prakiraan tersedia, tetapi tidak dapat disimpan untuk offline.";
    }
    renderCalendar();
  }

  async function refreshLocationAndWeather() {
    if (!currentUser) return;
    const email = currentUser.email;
    els.currentLocationBtn.disabled = true;
    els.weatherEnableBtn.disabled = true;
    els.currentLocationLabel.textContent = "Mencari...";
    els.weatherStatus.textContent = "Meminta izin lokasi untuk memperbarui prakiraan cuacaâ€¦";
    try {
      const { coords } = await getCurrentPosition();
      if (!currentUser || currentUser.email !== email) return;
      const results = await Promise.allSettled([
        updateLocationName(coords),
        updateWeatherForecast(coords, email),
      ]);
      if (results[0].status === "rejected") {
        els.currentLocationLabel.textContent = "Lokasi tersedia";
        els.currentLocationBtn.title = `Nama tempat gagal dimuat. ${results[0].reason.message}`;
      }
      if (results[1].status === "rejected") {
        els.weatherStatus.textContent = `Prakiraan gagal dimuat: ${results[1].reason.message}`;
      }
    } catch (error) {
      const message = locationErrorMessage(error);
      els.currentLocationLabel.textContent = "Lokasi gagal";
      els.currentLocationBtn.title = message;
      els.weatherStatus.textContent = message;
    } finally {
      els.currentLocationBtn.disabled = false;
      els.weatherEnableBtn.disabled = false;
    }
  }

  function loadBudgets() {
    if (!currentUser) return {};
    try {
      const value = JSON.parse(localStorage.getItem(budgetKey(currentUser.email)) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      els.budgetStatus.textContent = "Goals kategori tersimpan tidak dapat dibaca.";
      return {};
    }
  }

  function renderBudgetSettings() {
    const budgets = loadBudgets();
    els.timeBudgetSettings.textContent = "";
    for (const calendar of calendars) {
      const row = document.createElement("div");
      row.className = "budget-setting-row";
      const name = document.createElement("strong");
      name.textContent = calendar.name;
      const min = document.createElement("input");
      min.type = "number";
      min.min = "0";
      min.max = "168";
      min.step = "0.5";
      min.placeholder = "0";
      min.setAttribute("aria-label", `Minimum jam per minggu untuk ${calendar.name}`);
      min.value = budgets[calendar.id]?.min || "";
      const minLabel = document.createElement("label");
      minLabel.className = "budget-field-label";
      minLabel.append("Min jam/minggu", min);
      const max = document.createElement("input");
      max.type = "number";
      max.min = "0";
      max.max = "168";
      max.step = "0.5";
      max.placeholder = "0";
      max.setAttribute("aria-label", `Maksimum jam per minggu untuk ${calendar.name}`);
      max.value = budgets[calendar.id]?.max || "";
      const maxLabel = document.createElement("label");
      maxLabel.className = "budget-field-label";
      maxLabel.append("Maks jam/minggu", max);
      [min, max].forEach((input) => input.addEventListener("change", () => {
        if (min.value && max.value && Number(min.value) > Number(max.value)) {
          els.budgetStatus.textContent = "Goals minimum tidak boleh melebihi goals maksimum.";
          return;
        }
        const next = loadBudgets();
        next[calendar.id] = { min: Number(min.value) || 0, max: Number(max.value) || 0 };
        try {
          localStorage.setItem(budgetKey(currentUser.email), JSON.stringify(next));
          els.budgetStatus.textContent = "Goals kategori disimpan.";
          renderTracker();
        } catch {
          els.budgetStatus.textContent = "Goals tidak dapat disimpan di browser ini.";
        }
      }));
      row.append(name, minLabel, maxLabel);
      els.timeBudgetSettings.appendChild(row);
    }
  }

  function startEventEdit(event, occurrenceDate = event.date) {
    editingEventId = event.id;
    selectedDate = occurrenceDate;
    els.eventDate.value = event.date;
    els.titleInput.value = event.title;
    els.eventChecklistInput.value = (event.checklist || []).map((task) => task.text).join("\n");
    els.eventStatus.value = event.status || "todo";
    els.eventRecurrence.value = event.recurrence || "none";
    els.recurrenceHelp.textContent = event.recurrence && event.recurrence !== "none"
      ? "Perubahan berlaku untuk seluruh rangkaian jadwal."
      : "Jadwal berulang mengikuti tanggal mulai dan terus berjalan hingga dihapus.";
    setTime("start", event.time || "09:00");
    setTime("end", event.endTime || "10:00");
    els.eventForm.querySelector('button[type="submit"]').textContent = "Simpan perubahan";
    els.cancelEventEditBtn.hidden = false;
    els.eventFormError.textContent = "";
    els.titleInput.focus();
  }

  function resetEventForm() {
    editingEventId = null;
    els.eventForm.reset();
    els.eventDate.value = selectedDate || todayISO();
    els.eventRecurrence.value = "none";
    els.eventChecklistInput.value = "";
    els.eventStatus.value = "todo";
    els.recurrenceHelp.textContent = "Jadwal berulang mengikuti tanggal mulai dan terus berjalan hingga dihapus.";
    setTime("start", "09:00");
    setTime("end", "10:00");
    els.eventForm.querySelector('button[type="submit"]').textContent = "Tambah jadwal";
    els.cancelEventEditBtn.hidden = true;
    els.eventFormError.textContent = "";
  }

  els.accountMenuBtn.addEventListener("click", () => {
    const opening = els.accountMenu.hidden;
    els.accountMenu.hidden = !opening;
    els.accountMenuBtn.setAttribute("aria-expanded", String(opening));
  });

  document.querySelector(".primary-nav").addEventListener("click", (e) => {
    const button = e.target.closest("button[data-view]");
    if (button) showView(button.dataset.view);
  });

  els.categoryMenuBtn.addEventListener("click", () => {
    const opening = els.categoryMenu.hidden;
    els.categoryMenu.hidden = !opening;
    els.categoryMenuBtn.setAttribute("aria-expanded", String(opening));
    if (!opening) resetCategoryForm();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".account-menu")) {
      els.accountMenu.hidden = true;
      els.accountMenuBtn.setAttribute("aria-expanded", "false");
    }
    if (!e.target.closest(".category-menu")) closeCategoryMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.accountMenu.hidden) {
      els.accountMenu.hidden = true;
      els.accountMenuBtn.setAttribute("aria-expanded", "false");
      els.accountMenuBtn.focus();
    }
    if (e.key === "Escape" && !els.categoryMenu.hidden) {
      closeCategoryMenu();
      els.categoryMenuBtn.focus();
    }
  });

  els.createCalendarBtn.addEventListener("click", () => {
    resetCategoryForm();
    els.categoryMenu.hidden = false;
    els.categoryMenuBtn.setAttribute("aria-expanded", "true");
    els.calendarForm.hidden = false;
    els.calendarName.focus();
  });

  els.cancelCategoryEditBtn.addEventListener("click", cancelCategoryEdit);

  els.calendarForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = els.calendarName.value.trim();
    if (!name) {
      els.calendarName.focus();
      return;
    }
    const editingId = els.calendarForm.dataset.editId;
    if (calendars.some((calendar) =>
      calendar.id !== editingId && calendar.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    )) {
      els.calendarError.textContent = "Nama kategori sudah digunakan.";
      els.calendarName.focus();
      return;
    }
    const color = els.calendarColor.value.toUpperCase();
    if (calendars.some((calendar) =>
      calendar.id !== editingId && calendar.color.toUpperCase() === color
    )) {
      els.calendarError.textContent = "Warna kategori harus berbeda dari kategori lain.";
      els.calendarColor.focus();
      return;
    }
    els.calendarError.textContent = "";
    if (editingId) {
      const calendar = calendars.find((item) => item.id === editingId);
      if (!calendar) return;
      calendar.name = name;
      calendar.color = color;
      saveCalendars();
      cancelCategoryEdit();
      closeCategoryMenu();
      renderAll();
    } else {
      createCalendar(name, color);
      resetCategoryForm();
      closeCategoryMenu();
    }
  });

  function getTime(clock) {
    const prefix = clock === "end" ? "end" : "start";
    return `${pad2(Number(els[`${prefix}Hour`].value))}:${pad2(Number(els[`${prefix}Minute`].value))}`;
  }

  function setTime(clock, hhmm) {
    const prefix = clock === "end" ? "end" : "start";
    const fallback = clock === "end" ? "10:00" : "09:00";
    const [hour = "09", minute = "00"] = (hhmm || fallback).split(":");
    els[`${prefix}Hour`].value = String(Number(hour));
    els[`${prefix}Minute`].value = String(Number(minute));
    renderClock(clock);
  }

  function renderClock(clock) {
    const root = document.querySelector(`[data-clock="${clock}"]`);
    if (!root) return;
    const hour = Number(els[`${clock}Hour`].value) || 0;
    const minute = Number(els[`${clock}Minute`].value) || 0;
    const hourAngle = ((hour % 12) + minute / 60) * 30;
    const minuteAngle = minute * 6;
    const position = (angle, length) => {
      const radians = (angle - 90) * Math.PI / 180;
      return { x: 60 + Math.cos(radians) * length, y: 60 + Math.sin(radians) * length };
    };
    for (const [type, angle, length] of [
      ["hour", hourAngle, 27],
      ["minute", minuteAngle, 40],
    ]) {
      const hand = root.querySelector(`.clock-${type}-hand`);
      const point = position(angle, length);
      hand.setAttribute("x2", String(point.x));
      hand.setAttribute("y2", String(point.y));
      const hitArea = root.querySelector(`.clock-hand-hit[data-hand="${type}"]`);
      hitArea.setAttribute("x2", String(point.x));
      hitArea.setAttribute("y2", String(point.y));
    }
    const labels = root.querySelector(".clock-labels");
    if (!labels.childElementCount) {
      for (let number = 1; number <= 12; number++) {
        const point = position(number * 30, 43);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(point.x));
        text.setAttribute("y", String(point.y + 3.5));
        text.setAttribute("class", "clock-number");
        text.textContent = String(number);
        labels.appendChild(text);
      }
    }
  }

  function setClockFromPoint(clock, face, clientX, clientY, hand) {
    const rect = face.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * 120 - 60;
    const y = (clientY - rect.top) / rect.height * 120 - 60;
    const angle = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360;
    if (hand === "hour") {
      const value = Math.round(angle / 30) % 12;
      const oldHour = Number(els[`${clock}Hour`].value) || 0;
      const hour = value + (oldHour >= 12 ? 12 : 0);
      els[`${clock}Hour`].value = String(hour);
    } else {
      els[`${clock}Minute`].value = String(Math.round(angle / 6) % 60);
    }
    renderClock(clock);
  }

  for (const clock of ["start", "end"]) {
    const root = document.querySelector(`[data-clock="${clock}"]`);
    const face = root.querySelector(".clock-face");
    for (const field of [els[`${clock}Hour`], els[`${clock}Minute`]]) {
      field.addEventListener("input", () => {
        const max = field === els[`${clock}Hour`] ? 23 : 59;
        const value = Number(field.value);
        if (field.value !== "" && (!Number.isInteger(value) || value < 0 || value > max)) {
          field.setCustomValidity(`Masukkan angka antara 0 dan ${max}.`);
        } else {
          field.setCustomValidity("");
        }
        renderClock(clock);
      });
    }
    face.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const clickedHand = e.target.closest("[data-hand]")?.dataset.hand;
      const rect = face.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 120;
      const y = (e.clientY - rect.top) / rect.height * 120;
      let hand = clickedHand;
      if (!hand) {
        const hourHand = root.querySelector(".clock-hour-hand");
        const minuteHand = root.querySelector(".clock-minute-hand");
        const hourDistance = Math.hypot(x - Number(hourHand.getAttribute("x2")), y - Number(hourHand.getAttribute("y2")));
        const minuteDistance = Math.hypot(x - Number(minuteHand.getAttribute("x2")), y - Number(minuteHand.getAttribute("y2")));
        hand = hourDistance < minuteDistance ? "hour" : "minute";
      }
      clockDrag = { clock, hand, pointerId: e.pointerId };
      face.setPointerCapture(e.pointerId);
      setClockFromPoint(clock, face, e.clientX, e.clientY, hand);
      e.preventDefault();
    });
    face.addEventListener("pointermove", (e) => {
      if (!clockDrag || clockDrag.clock !== clock || clockDrag.pointerId !== e.pointerId) return;
      setClockFromPoint(clock, face, e.clientX, e.clientY, clockDrag.hand);
    });
    const stopClockDrag = () => { clockDrag = null; };
    face.addEventListener("pointerup", stopClockDrag);
    face.addEventListener("pointercancel", stopClockDrag);
    renderClock(clock);
  }

  /* ---------------- validasi masuk ---------------- */
  const validators = {
    name:  (v) => !v ? "Silakan masukkan nama panggilan."
                 : !NAME_RE.test(v)  ? "2â€“24 karakter: huruf, angka, spasi, . _ -"
                 : "",
    email: (v) => !v ? "Silakan masukkan email."
                 : !EMAIL_RE.test(v) ? "Format email tidak valid."
                 : "",
  };

  const fields = [
    { input: els.nameInput,  error: els.nameError,  validate: validators.name  },
    { input: els.emailInput, error: els.emailError, validate: validators.email },
  ];

  function setFieldError({ input, error }, msg) {
    input.classList.toggle("invalid", !!msg);
    error.textContent = msg;
  }

  function validateSignIn() {
    let ok = true;
    for (const f of fields) {
      const msg = f.validate(f.input.value.trim());
      setFieldError(f, msg);
      if (msg) ok = false;
    }
    return ok;
  }

  for (const f of fields) {
    f.input.addEventListener("input", () => {
      if (f.input.classList.contains("invalid")) setFieldError(f, "");
    });
  }

  /* ---------------- penyimpanan ---------------- */
  function loadEvents(email) {
    try {
      const raw = localStorage.getItem(eventsKey(email));
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }

  function loadCalendars(email) {
    try {
      const raw = localStorage.getItem(calendarsKey(email));
      const saved = raw ? JSON.parse(raw) : null;
      if (!saved || !Array.isArray(saved.calendars)) {
        calendars = [{ ...DEFAULT_CALENDAR }];
        activeCalendarId = DEFAULT_CALENDAR.id;
        return;
      }
      const valid = saved.calendars.filter((calendar) =>
        calendar && typeof calendar.id === "string" &&
        typeof calendar.name === "string" && calendar.name.trim() &&
        /^#[0-9a-f]{6}$/i.test(calendar.color)
      );
      const entries = valid.some((calendar) => calendar.id === DEFAULT_CALENDAR.id)
        ? valid
        : [{ ...DEFAULT_CALENDAR }, ...valid];
      calendars = [];
      for (const calendar of entries) {
        const normalized = { ...calendar, color: calendar.color.toUpperCase() };
        if (calendars.some((item) => item.color === normalized.color)) {
          normalized.color = nextCategoryColor(calendars.map((item) => item.color));
        }
        calendars.push(normalized);
      }
      activeCalendarId = calendars.some((calendar) => calendar.id === saved.activeCalendarId)
        ? saved.activeCalendarId
        : DEFAULT_CALENDAR.id;
    } catch {
      calendars = [{ ...DEFAULT_CALENDAR }];
      activeCalendarId = DEFAULT_CALENDAR.id;
    }
  }

  function nextCategoryColor(usedColors = calendars.map((calendar) => calendar.color)) {
    const used = new Set(usedColors.map((color) => color.toUpperCase()));
    const preferred = CATEGORY_COLORS.find((color) => !used.has(color));
    if (preferred) return preferred;
    for (let step = 0; step < 360; step++) {
      const hue = (step * 137.508) % 360;
      const saturation = 0.46;
      const lightness = 0.68;
      const amplitude = saturation * Math.min(lightness, 1 - lightness);
      const channel = (offset) => {
        const k = (offset + hue / 30) % 12;
        const value = lightness - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(value * 255).toString(16).padStart(2, "0").toUpperCase();
      };
      const color = `#${channel(0)}${channel(8)}${channel(4)}`;
      if (!used.has(color)) return color;
    }
    for (let value = 0; value <= 0xFFFFFF; value++) {
      const color = `#${value.toString(16).padStart(6, "0").toUpperCase()}`;
      if (!used.has(color)) return color;
    }
    throw new Error("Tidak ada warna kategori yang tersedia.");
  }

  function saveCalendars() {
    if (!currentUser) return;
    try {
      localStorage.setItem(calendarsKey(currentUser.email), JSON.stringify({
        calendars,
        activeCalendarId,
      }));
    } catch {}
  }

  function saveEvents() {
    if (!currentUser) return;
    try { localStorage.setItem(eventsKey(currentUser.email), JSON.stringify(events)); }
    catch {}
  }

  function playSound(kind) {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      els.soundStatus.textContent = "Browser ini tidak mendukung efek suara.";
      return;
    }
    try {
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(kind === "cat" ? 660 : 523, start);
      oscillator.frequency.exponentialRampToValueAtTime(kind === "cat" ? 880 : 784, start + .12);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.08, start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + .21);
      oscillator.addEventListener("ended", () => context.close(), { once: true });
    } catch {
      els.soundStatus.textContent = "Efek suara tidak dapat diputar.";
    }
  }

  function loadSoundPreference(email) {
    try {
      soundEnabled = localStorage.getItem(soundKey(email)) !== "false";
    } catch {
      soundEnabled = true;
      els.soundStatus.textContent = "Preferensi suara tidak dapat dibaca dari browser.";
    }
    els.soundEnabled.checked = soundEnabled;
  }

  function eventOccursOnDate(event, dateString) {
    if (dateString < event.date) return false;
    const recurrence = event.recurrence || "none";
    if (recurrence === "none") return dateString === event.date;
    const eventDate = new Date(`${event.date}T00:00`);
    const occurrenceDate = new Date(`${dateString}T00:00`);
    if (recurrence === "weekly") return eventDate.getDay() === occurrenceDate.getDay();
    if (recurrence === "monthly") {
      const dayOfMonth = Math.min(
        eventDate.getDate(),
        new Date(occurrenceDate.getFullYear(), occurrenceDate.getMonth() + 1, 0).getDate()
      );
      return occurrenceDate.getDate() === dayOfMonth;
    }
    return dateString === event.date;
  }

  function getOccurrencesForDate(dateString, sourceEvents = getActiveEvents()) {
    return sourceEvents
      .filter((event) => eventOccursOnDate(event, dateString))
      .map((event) => ({ ...event, date: dateString, occurrenceDate: dateString }));
  }

  function getOccurrencesInRange(sourceEvents, startDate, endDate) {
    const occurrences = [];
    const cursor = new Date(`${startDate}T00:00`);
    const end = new Date(`${endDate}T00:00`);
    for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const dateString = toISO(cursor);
      occurrences.push(...getOccurrencesForDate(dateString, sourceEvents));
    }
    return occurrences;
  }

  function matchesEventSearch(event) {
    const query = els.eventSearch.value.trim().toLocaleLowerCase(LOKAL);
    if (!query) return true;
    const category = calendars.find((item) => item.id === event.calendarId);
    return `${event.title} ${category ? category.name : ""}`.toLocaleLowerCase(LOKAL).includes(query);
  }

  function updateSearchStatus() {
    const query = els.eventSearch.value.trim();
    if (!query) {
      els.eventSearchStatus.textContent = "";
      return;
    }
    const count = events.filter(matchesEventSearch).length;
    els.eventSearchStatus.textContent = count
      ? `${count} jadwal cocok. Pilih hasil untuk menuju tanggal kegiatannya.`
      : "Tidak ada jadwal yang cocok.";
  }

  function renderSearchResults() {
    const query = els.eventSearch.value.trim();
    els.eventSearchResults.textContent = "";
    els.eventSearchResults.hidden = !query;
    if (!query) return;
    const matches = events.filter(matchesEventSearch).slice(0, 8);
    for (const event of matches) {
      const occurrence = getNextOccurrence(event) || { occurrenceDate: event.date };
      const calendar = calendars.find((item) => item.id === event.calendarId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      button.dataset.searchEventId = event.id;
      button.dataset.searchDate = occurrence.occurrenceDate;
      const title = document.createElement("strong");
      title.textContent = event.title;
      const detail = document.createElement("span");
      detail.textContent = `${calendar?.name || "Kategori"} Â· ${dayFmt.format(new Date(`${occurrence.occurrenceDate}T00:00`))}`;
      button.append(title, detail);
      els.eventSearchResults.appendChild(button);
    }
    if (!matches.length) {
      const empty = document.createElement("span");
      empty.className = "search-result-empty";
      empty.textContent = "Tidak ditemukan.";
      els.eventSearchResults.appendChild(empty);
    }
  }

  els.eventSearchResults.addEventListener("click", (event) => {
    const result = event.target.closest("[data-search-event-id]");
    if (!result) return;
    const scheduled = events.find((item) => item.id === result.dataset.searchEventId);
    if (!scheduled) return;
    activeCalendarId = scheduled.calendarId;
    saveCalendars();
    const date = result.dataset.searchDate;
    const target = new Date(`${date}T00:00`);
    viewYear = target.getFullYear();
    viewMonth = target.getMonth();
    calendarMode = "month";
    selectedDate = date;
    searchFocus = { id: scheduled.id, date };
    showView("calendar");
    renderAll();
    requestAnimationFrame(() => {
      const day = els.calGrid.querySelector(`.day[data-date="${date}"]`);
      const chip = [...els.calGrid.querySelectorAll(".chip")].find((item) =>
        item.dataset.eventId === scheduled.id && item.dataset.eventDate === date
      );
      (chip || day)?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (chip) chip.focus({ preventScroll: true });
    });
  });

  function getNextOccurrence(event, after = new Date()) {
    const time = event.time || "00:00";
    const earliest = after.getTime() - 60000;
    const recurrence = event.recurrence || "none";
    if (recurrence === "none") {
      const timestamp = new Date(`${event.date}T${time}`).getTime();
      return Number.isFinite(timestamp) && timestamp >= earliest
        ? { ...event, occurrenceDate: event.date, timestamp }
        : null;
    }

    const baseDate = new Date(`${event.date}T00:00`);
    const startDate = new Date(after.getFullYear(), after.getMonth(), after.getDate());
    if (recurrence === "weekly") {
      const firstDate = startDate < baseDate ? baseDate : startDate;
      for (let offset = 0; offset <= 7; offset++) {
        const candidateDate = new Date(firstDate);
        candidateDate.setDate(candidateDate.getDate() + offset);
        const dateString = toISO(candidateDate);
        if (dateString < event.date || !eventOccursOnDate(event, dateString)) continue;
        const timestamp = new Date(`${dateString}T${time}`).getTime();
        if (timestamp >= earliest) return { ...event, occurrenceDate: dateString, date: dateString, timestamp };
      }
      return null;
    }

    const monthStart = new Date(
      Math.max(startDate.getFullYear(), baseDate.getFullYear()),
      startDate.getFullYear() > baseDate.getFullYear() ||
        (startDate.getFullYear() === baseDate.getFullYear() && startDate.getMonth() > baseDate.getMonth())
        ? startDate.getMonth()
        : baseDate.getMonth(),
      1
    );
    for (let offset = 0; offset <= 24; offset++) {
      const month = new Date(monthStart.getFullYear(), monthStart.getMonth() + offset, 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const candidateDate = new Date(month.getFullYear(), month.getMonth(), Math.min(baseDate.getDate(), lastDay));
      const dateString = toISO(candidateDate);
      if (dateString < event.date) continue;
      const timestamp = new Date(`${dateString}T${time}`).getTime();
      if (timestamp >= earliest) return { ...event, occurrenceDate: dateString, date: dateString, timestamp };
    }
    return null;
  }

  function renderCountdown() {
    const upcoming = events
      .map((event) => getNextOccurrence(event))
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    if (!upcoming) {
      els.nextEventCountdown.hidden = true;
      els.nextEventCountdown.textContent = "";
      return;
    }
    const now = new Date();
    const target = new Date(upcoming.timestamp);
    let months = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
    const addMonths = (date, count) => {
      const result = new Date(date);
      const day = result.getDate();
      result.setDate(1);
      result.setMonth(result.getMonth() + count);
      result.setDate(Math.min(day, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
      return result;
    };
    while (months > 0 && addMonths(now, months) > target) months--;
    const afterMonths = addMonths(now, months);
    const remaining = Math.max(0, target.getTime() - afterMonths.getTime());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor(remaining % 86400000 / 3600000);
    const minutes = Math.floor(remaining % 3600000 / 60000);
    els.nextEventCountdown.textContent =
      `Berikutnya: ${upcoming.title} Â· ${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit lagi`;
    els.nextEventCountdown.hidden = false;
  }

  async function requestNotificationPermissionOnEntry() {
    if (!("Notification" in window)) {
      els.notificationStatus.textContent = "Browser ini tidak mendukung notifikasi.";
      return;
    }
    if (!window.isSecureContext) {
      els.notificationStatus.textContent = "Notifikasi perlu alamat HTTPS atau localhost.";
      return;
    }
    if (Notification.permission === "granted") {
      return;
    }
    if (Notification.permission === "denied") {
      els.notificationStatus.textContent = "Izin diblokir di browser. Notifikasi tidak dapat ditampilkan.";
      return;
    }
    els.notificationStatus.textContent = "Meminta izin notifikasi...";
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        els.notificationStatus.textContent = "";
        checkUpcomingNotifications();
      } else {
        els.notificationStatus.textContent = "Izin tidak diberikan. Ubah izin situs di browser untuk menerima notifikasi.";
      }
    } catch {
      els.notificationStatus.textContent = "Izin notifikasi tidak dapat diminta.";
    }
  }

  function loadNotifiedEvents(email) {
    try {
      const saved = JSON.parse(localStorage.getItem(notifiedEventsKey(email)) || "[]");
      notifiedEvents = new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
    } catch {
      notifiedEvents = new Set();
    }
  }

  function saveNotifiedEvents() {
    if (!currentUser) return;
    try {
      localStorage.setItem(notifiedEventsKey(currentUser.email), JSON.stringify([...notifiedEvents]));
    } catch {
      els.notificationStatus.textContent = "Status notifikasi tidak dapat disimpan di browser ini.";
    }
  }

  function checkUpcomingNotifications() {
    if (!currentUser || !("Notification" in window) ||
        Notification.permission !== "granted") return;
    const now = Date.now();
    const leadMs = notificationSettings.leadMinutes * 60 * 1000;
    const candidates = events
      .map((event) => getNextOccurrence(event))
      .filter((event) =>
        event &&
        !notifiedEvents.has(event.recurrence && event.recurrence !== "none"
          ? `${event.id}@${event.occurrenceDate}`
          : event.id) &&
        event.timestamp >= now - 60000 &&
        event.timestamp - now <= leadMs
      );
    for (const event of candidates) {
      const calendar = calendars.find((item) => item.id === event.calendarId);
      try {
        const notice = new Notification("Jadwal FUWME", {
          body: notificationSettings.message
            .replaceAll("{title}", event.title)
            .replaceAll("{time}", event.time || "00:00")
            .replaceAll("{category}", calendar ? calendar.name : ""),
          tag: `fuwme-${event.id}`,
        });
        notice.onclick = () => {
          window.focus();
          const date = new Date(`${event.occurrenceDate}T00:00`);
          viewYear = date.getFullYear();
          viewMonth = date.getMonth();
          calendarMode = "month";
          showView("calendar");
          openModal(event.occurrenceDate);
          notice.close();
        };
        notifiedEvents.add(event.recurrence && event.recurrence !== "none"
          ? `${event.id}@${event.occurrenceDate}`
          : event.id);
      } catch {
        els.notificationStatus.textContent = "Notifikasi gagal ditampilkan. Periksa izin browser.";
      }
    }
    if (candidates.length) saveNotifiedEvents();
  }

  function startNotificationChecks() {
    if (notificationTimer !== null) window.clearInterval(notificationTimer);
    checkUpcomingNotifications();
    renderCountdown();
    notificationTimer = window.setInterval(() => {
      checkUpcomingNotifications();
      renderCountdown();
    }, 15000);
  }

  function resetCategoryForm() {
    els.calendarForm.reset();
    delete els.calendarForm.dataset.editId;
    els.calendarColor.value = nextCategoryColor();
    els.saveCategoryBtn.textContent = "Tambah kategori";
    els.cancelCategoryEditBtn.hidden = true;
    els.calendarError.textContent = "";
    els.calendarForm.hidden = true;
  }

  function cancelCategoryEdit() {
    resetCategoryForm();
  }

  function closeCategoryMenu() {
    if (!els.categoryMenu) return;
    els.categoryMenu.hidden = true;
    els.categoryMenuBtn.setAttribute("aria-expanded", "false");
    resetCategoryForm();
  }

  function loadUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u && u.name && u.email ? u : null;
    } catch { return null; }
  }

  /* ---------------- render kalender ---------------- */
  function renderCalendar() {
    document.querySelectorAll("[data-calendar-mode]").forEach((button) =>
      button.setAttribute("aria-pressed", String(
        button.dataset.calendarMode === (calendarMode === "list" ? "list" : "month")
      ))
    );
    if (calendarMode === "list") {
      els.calWeekdays.hidden = true;
      els.calGrid.hidden = true;
      els.scheduleList.hidden = false;
      els.yearViewBtn.hidden = true;
      els.scheduleList.textContent = "";
      renderScheduleList();
      return;
    }
    els.calGrid.hidden = false;
    els.scheduleList.hidden = true;
    els.yearViewBtn.hidden = false;
    if (calendarMode === "year") {
      renderYearCalendar();
      return;
    }
    els.prevMonth.setAttribute("aria-label", "Bulan sebelumnya");
    els.nextMonth.setAttribute("aria-label", "Bulan berikutnya");
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    els.monthLabel.textContent = monthFmt.format(firstOfMonth);
    els.calWeekdays.hidden = false;
    els.calGrid.classList.remove("year-grid");
    els.yearViewBtn.textContent = "Tahun";
    els.yearViewBtn.setAttribute("aria-pressed", "false");

    const offset = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(viewYear, viewMonth, 1 - offset);
    const todayStr = todayISO();

    const activeEvents = getActiveEvents().filter(matchesEventSearch);
    const dayMap = new Map();
    for (let offset = 0; offset < 42; offset++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + offset);
      const dateString = toISO(date);
      const occurrences = getOccurrencesForDate(dateString, activeEvents);
      if (occurrences.length) dayMap.set(dateString, occurrences);
    }

    const frag = document.createDocumentFragment();

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const iso = toISO(d);
      const isOtherMonth = d.getMonth() !== viewMonth;

      const btn = document.createElement("div");
      btn.className = "day";
      btn.dataset.date = iso;
      btn.setAttribute("role", "group");
      btn.tabIndex = 0;
      if (searchFocus?.date === iso) btn.classList.add("search-date-focus");

      if (isOtherMonth)     btn.classList.add("other-month");
      if (iso === todayStr) btn.classList.add("today");
      if (iso === selectedDate) btn.classList.add("selected");

      const num = document.createElement("span");
      num.className = "day-num";
      num.textContent = d.getDate();
      btn.appendChild(num);
      if (weatherForecast[iso] !== undefined) {
        const [icon, description] = weatherLabel(weatherForecast[iso]);
        const weather = document.createElement("span");
        weather.className = "day-weather";
        weather.textContent = icon;
        weather.title = description;
        weather.setAttribute("aria-label", `Cuaca: ${description}`);
        btn.appendChild(weather);
      }

      const dayEvents = isOtherMonth ? null : dayMap.get(iso);
      if (dayEvents && dayEvents.length) {
        btn.setAttribute("aria-label",
          `${dayFmt.format(d)}, ${dayEvents.length} jadwal`);

        const wrap = document.createElement("div");
        wrap.className = "day-events";

        let shown = dayEvents.slice(0, 2);
        if (searchFocus?.date === iso) {
          const focusIndex = dayEvents.findIndex((event) => event.id === searchFocus.id);
          if (focusIndex >= 2) shown = [...shown.slice(0, 1), dayEvents[focusIndex]];
        }
        for (const ev of shown) {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "chip";
          chip.dataset.eventId = ev.id;
          chip.dataset.eventDate = ev.occurrenceDate;
          if (searchFocus?.id === ev.id && searchFocus.date === iso) {
            chip.classList.add("is-search-focus");
          }
          chip.draggable = true;
          chip.style.setProperty("--calendar-color", getActiveCalendar().color);
          const interval = ev.endTime ? `${ev.time || "00:00"}â€“${ev.endTime}` : (ev.time || "00:00");
          chip.textContent = `${interval} ${ev.title}`;
          chip.title = `${interval} â€” ${ev.title}. Pilih untuk edit, seret untuk pindahkan, tarik pegangan untuk ubah durasi.`;
          chip.setAttribute("aria-label", `Edit jadwal ${ev.title}, ${interval}`);
          if (ev.status === "done") chip.classList.add("is-done");
          const resize = document.createElement("span");
          resize.className = "chip-resize-handle";
          resize.dataset.resizeEventId = ev.id;
          resize.setAttribute("aria-hidden", "true");
          chip.appendChild(resize);
          wrap.appendChild(chip);
        }
        if (dayEvents.length > shown.length) {
          const more = document.createElement("span");
          more.className = "more";
          more.textContent = `+${dayEvents.length - shown.length} lagi`;
          wrap.appendChild(more);
        }
        btn.appendChild(wrap);
      } else {
        btn.setAttribute("aria-label", dayFmt.format(d));
      }

      frag.appendChild(btn);
    }

    els.calGrid.textContent = "";
    els.calGrid.appendChild(frag);
  }

  function renderScheduleList() {
    const items = getActiveEvents()
      .filter(matchesEventSearch)
      .map((event) => ({
        event,
        date: getNextOccurrence(event)?.occurrenceDate || event.date,
      }))
      .sort((a, b) => `${a.date}T${a.event.time || "00:00"}`.localeCompare(`${b.date}T${b.event.time || "00:00"}`));
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty schedule-list-empty";
      empty.textContent = els.eventSearch.value.trim()
        ? "Tidak ada jadwal yang cocok."
        : "Belum ada jadwal di kategori ini.";
      els.scheduleList.appendChild(empty);
      return;
    }

    for (const { event, date } of items) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "schedule-list-item";
      row.dataset.scheduleEventId = event.id;
      row.dataset.scheduleDate = date;
      row.style.setProperty("--calendar-color", calendars.find((item) => item.id === event.calendarId)?.color || DEFAULT_CALENDAR.color);
      const main = document.createElement("span");
      main.className = "schedule-list-main";
      const title = document.createElement("strong");
      title.textContent = event.title;
      const details = document.createElement("span");
      details.className = "schedule-list-details";
      details.textContent = `${dayFmt.format(new Date(`${date}T00:00`))} Â· ${event.time || "00:00"}${event.endTime ? `â€“${event.endTime}` : ""}`;
      main.append(title, details);

      const status = document.createElement("span");
      const eventStatus = event.status || "todo";
      status.className = `schedule-list-status status-${eventStatus}`;
      status.textContent = eventStatus === "done" ? "Selesai" : eventStatus === "progress" ? "Berlangsung" : "To-do";
      const checklist = event.checklist || [];
      if (checklist.length) {
        const checklistCount = document.createElement("span");
        checklistCount.className = "schedule-list-checklist";
        checklistCount.textContent = `${checklist.filter((task) => task.done).length}/${checklist.length} checklist`;
        row.append(main, checklistCount, status);
      } else {
        row.append(main, status);
      }
      els.scheduleList.appendChild(row);
    }
  }

  els.scheduleList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-schedule-event-id]");
    if (!row) return;
    const scheduled = events.find((item) => item.id === row.dataset.scheduleEventId);
    if (!scheduled) return;
    const date = row.dataset.scheduleDate || scheduled.date;
    const target = new Date(`${date}T00:00`);
    viewYear = target.getFullYear();
    viewMonth = target.getMonth();
    calendarMode = "month";
    openModal(date, scheduled.id);
  });

  function renderYearCalendar() {
    els.monthLabel.textContent = String(viewYear);
    els.calWeekdays.hidden = true;
    els.yearViewBtn.textContent = "Bulan";
    els.yearViewBtn.setAttribute("aria-pressed", "true");
    els.prevMonth.setAttribute("aria-label", "Tahun sebelumnya");
    els.nextMonth.setAttribute("aria-label", "Tahun berikutnya");
    els.calGrid.classList.add("year-grid");
    const fragment = document.createDocumentFragment();
    for (let month = 0; month < 12; month++) {
      const monthEvents = getActiveEvents().filter(matchesEventSearch);
      const rangeStart = toISO(new Date(viewYear, month, 1));
      const rangeEnd = toISO(new Date(viewYear, month + 1, 0));
      const occurrenceCount = getOccurrencesInRange(monthEvents, rangeStart, rangeEnd).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "month-tile";
      button.dataset.month = String(month);
      if (month === new Date().getMonth() && viewYear === new Date().getFullYear()) {
        button.classList.add("current-month");
      }
      const title = document.createElement("strong");
      title.textContent = new Intl.DateTimeFormat(LOKAL, { month: "long" }).format(new Date(viewYear, month, 1));
      const details = document.createElement("span");
      details.textContent = `${occurrenceCount} kegiatan`;
      button.append(title, details);
      fragment.appendChild(button);
    }
    els.calGrid.textContent = "";
    els.calGrid.appendChild(fragment);
  }

  /* ---------------- popup ---------------- */
  function openModal(iso, eventId = "") {
    selectedDate = iso;
    renderCalendar();
    renderModal();
    els.modal.hidden = false;
    if (eventId) {
      const event = events.find((item) => item.id === eventId && item.calendarId === activeCalendarId);
      if (event) startEventEdit(event, iso);
    } else {
      resetEventForm();
    }
    els.titleInput.focus();
  }

  function closeModal() {
    els.modal.hidden = true;
  }

  function renderModal() {
    if (!selectedDate) return;

    const d = new Date(selectedDate + "T00:00");
    els.modalTitle.textContent = dayFmt.format(d);

    const list = getOccurrencesForDate(
      selectedDate,
      getActiveEvents().filter(matchesEventSearch)
    )
      .sort((a, b) => a.time.localeCompare(b.time));

    els.eventList.textContent = "";
    els.emptyMsg.hidden = list.length > 0;
    if (els.eventSearch.value.trim() && !list.length) {
      els.emptyMsg.textContent = "Tidak ada jadwal yang cocok pada tanggal ini.";
    } else {
      els.emptyMsg.textContent = "Belum ada jadwal untuk hari ini.";
    }
    if (!list.length) return;

    const now = Date.now();
    const frag = document.createDocumentFragment();

    for (const ev of list) {
      const when = new Date(ev.date + "T" + (ev.time || "00:00")).getTime();

      const li = document.createElement("li");
      li.className = (!isNaN(when) && when < now) ? "event past" : "event";

      const time = document.createElement("span");
      time.className = "event-time";
      time.textContent = ev.endTime
        ? `${ev.time || "00:00"}â€“${ev.endTime}`
        : (ev.time || "00:00");

      const main = document.createElement("div");
      main.className = "event-main";
      const title = document.createElement("p");
      title.className = "event-title";
      title.textContent = ev.title;
      main.appendChild(title);
      if (ev.checklist?.length) {
        const tasks = document.createElement("ul");
        tasks.className = "event-checklist";
        ev.checklist.forEach((task, index) => {
          const taskRow = document.createElement("li");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = Boolean(task.done);
          checkbox.dataset.checklistEventId = ev.id;
          checkbox.dataset.checklistIndex = String(index);
          checkbox.setAttribute("aria-label", task.text);
          const label = document.createElement("span");
          label.textContent = task.text;
          if (task.done) label.classList.add("task-done");
          taskRow.append(checkbox, label);
          tasks.appendChild(taskRow);
        });
        main.appendChild(tasks);
      }

      const status = document.createElement("button");
      status.type = "button";
      status.className = "event-status-btn ghost";
      status.dataset.toggleStatusId = ev.id;
      status.textContent = (ev.status || "todo") === "done" ? "âœ“ Selesai" : "Tandai selesai";
      status.setAttribute("aria-pressed", String((ev.status || "todo") === "done"));

      const share = document.createElement("button");
      share.type = "button";
      share.className = "icon-btn event-share-btn";
      share.dataset.shareEventId = ev.id;
      share.textContent = "â†—";
      share.title = "Salin tautan untuk dibagikan";
      share.setAttribute("aria-label", `Bagikan jadwal ${ev.title}`);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn";
      del.dataset.id = ev.id;
      del.setAttribute("aria-label", "Hapus " + ev.title);
      del.textContent = "âœ•";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "icon-btn event-edit-btn";
      edit.dataset.editId = ev.id;
      edit.dataset.occurrenceDate = ev.occurrenceDate;
      edit.setAttribute("aria-label", "Edit " + ev.title);
      edit.textContent = "âœŽ";

      li.append(time, main, status, share, edit, del);
      frag.appendChild(li);
    }
    els.eventList.appendChild(frag);
  }

  function getActiveCalendar() {
    return calendars.find((calendar) => calendar.id === activeCalendarId) || calendars[0];
  }

  function getActiveEvents() {
    return events.filter((event) => event.calendarId === activeCalendarId);
  }

  function renderCalendarOptions() {
    els.calendarList.textContent = "";
    const activeCalendar = getActiveCalendar();
    els.activeCategoryName.textContent = activeCalendar.name;
    els.categoryMenuBtn.style.setProperty("--active-category-color", activeCalendar.color);
    for (const calendar of calendars) {
      const item = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "calendar-color";
      dot.style.backgroundColor = calendar.color;
      const name = document.createElement("span");
      name.textContent = calendar.name;
      const select = document.createElement("button");
      select.type = "button";
      select.className = "category-select-btn";
      select.dataset.selectCalendar = calendar.id;
      select.setAttribute("aria-pressed", String(calendar.id === activeCalendarId));
      select.append(dot, name);
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "ghost category-edit-btn";
      edit.dataset.editCalendar = calendar.id;
      edit.textContent = "âœŽ";
      edit.setAttribute("aria-label", `Edit kategori ${calendar.name}`);
      item.append(select, edit);
      els.calendarList.appendChild(item);
    }
  }

  els.calendarList.addEventListener("click", (e) => {
    const editButton = e.target.closest("button[data-edit-calendar]");
    if (!editButton) {
      const selectButton = e.target.closest("button[data-select-calendar]");
      if (!selectButton || !calendars.some((item) => item.id === selectButton.dataset.selectCalendar)) return;
      activeCalendarId = selectButton.dataset.selectCalendar;
      saveCalendars();
      closeCategoryMenu();
      renderAll();
      return;
    }
    const calendar = calendars.find((item) => item.id === editButton.dataset.editCalendar);
    if (!calendar) return;
    els.calendarForm.dataset.editId = calendar.id;
    els.calendarName.value = calendar.name;
    els.calendarColor.value = calendar.color;
    els.saveCategoryBtn.textContent = "Simpan perubahan";
    els.cancelCategoryEditBtn.hidden = false;
    els.calendarForm.hidden = false;
    els.categoryMenu.hidden = false;
    els.categoryMenuBtn.setAttribute("aria-expanded", "true");
    els.calendarError.textContent = "";
    els.calendarName.focus();
  });

  function selectTrackerCalendar(id) {
    if (!calendars.some((calendar) => calendar.id === id)) return;
    activeCalendarId = id;
    saveCalendars();
    renderAll();
  }

  function eventDurationMinutes(event) {
    if (!event.time || !event.endTime) return 0;
    const [startHour, startMinute] = event.time.split(":").map(Number);
    const [endHour, endMinute] = event.endTime.split(":").map(Number);
    const duration = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    if (!hours) return `${remaining} mnt`;
    return remaining ? `${hours} j ${remaining} mnt` : `${hours} jam`;
  }

  function getCategoryStats() {
    const now = new Date();
    const startDate = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const endDate = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return calendars.map((calendar) => {
      const categoryEvents = events.filter((event) => event.calendarId === calendar.id);
      const occurrences = getOccurrencesInRange(categoryEvents, startDate, endDate);
      return {
        calendar,
        count: occurrences.length,
        minutes: occurrences.reduce((total, event) => total + eventDurationMinutes(event), 0),
      };
    });
  }

  function renderTrackerChart() {
    const stats = getCategoryStats();
    const countTotal = stats.reduce((sum, item) => sum + item.count, 0);
    const durationTotal = stats.reduce((sum, item) => sum + item.minutes, 0);
    els.trackerLegend.hidden = trackerChartMode !== "circle";
    els.trackerChart.classList.toggle("tracker-chart-wide", trackerChartMode !== "circle");
    els.trackerChart.textContent = "";
    els.trackerLegend.textContent = "";
    if (trackerChartMode === "circle") {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 120 120");
      svg.setAttribute("class", "tracker-chart-svg");
      svg.setAttribute("aria-label", `Diagram lingkaran, ${countTotal} jadwal`);
      const circumference = 2 * Math.PI * 43;
      let offset = 0;
      if (!countTotal) {
        const emptyCircle = document.createElementNS(svgNS, "circle");
        emptyCircle.setAttribute("cx", "60");
        emptyCircle.setAttribute("cy", "60");
        emptyCircle.setAttribute("r", "43");
        emptyCircle.setAttribute("class", "chart-empty-ring");
        svg.appendChild(emptyCircle);
      } else {
        for (const item of stats) {
          if (!item.count) continue;
          const segment = circumference * item.count / countTotal;
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", "60");
          circle.setAttribute("cy", "60");
          circle.setAttribute("r", "43");
          circle.setAttribute("fill", "none");
          circle.setAttribute("stroke", item.calendar.color);
          circle.setAttribute("stroke-width", "18");
          circle.setAttribute("stroke-dasharray", `${segment} ${circumference - segment}`);
          circle.setAttribute("stroke-dashoffset", String(-offset));
          circle.setAttribute("transform", "rotate(-90 60 60)");
          circle.setAttribute("class", "chart-segment");
          circle.setAttribute("role", "button");
          circle.setAttribute("tabindex", "0");
          circle.dataset.calendarId = item.calendar.id;
          circle.setAttribute("aria-label", `${item.calendar.name}: ${item.count} jadwal, ${formatDuration(item.minutes)}.`);
          circle.addEventListener("click", () => selectTrackerCalendar(item.calendar.id));
          circle.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              selectTrackerCalendar(item.calendar.id);
            }
          });
          svg.appendChild(circle);
          offset += segment;
        }
      }
      const totalText = document.createElementNS(svgNS, "text");
      totalText.setAttribute("x", "60");
      totalText.setAttribute("y", "57");
      totalText.setAttribute("class", "chart-total");
      totalText.textContent = String(countTotal);
      const caption = document.createElementNS(svgNS, "text");
      caption.setAttribute("x", "60");
      caption.setAttribute("y", "72");
      caption.setAttribute("class", "chart-caption");
      caption.textContent = "jadwal";
      svg.append(totalText, caption);
      els.trackerChart.appendChild(svg);
      for (const item of stats) {
        const row = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tracker-legend-button";
        button.dataset.calendarId = item.calendar.id;
        button.setAttribute("aria-pressed", String(item.calendar.id === activeCalendarId));
        const dot = document.createElement("span");
        dot.className = "calendar-color";
        dot.style.backgroundColor = item.calendar.color;
        const label = document.createElement("span");
        label.textContent = item.calendar.name;
        const count = document.createElement("strong");
        count.textContent = `${item.count} Â· ${formatDuration(item.minutes)}`;
        button.append(dot, label, count);
        row.appendChild(button);
        els.trackerLegend.appendChild(row);
      }
    } else if (trackerChartMode === "bars") {
      const maximum = Math.max(1, ...stats.map((item) => item.minutes));
      const bars = document.createElement("div");
      bars.className = "tracker-bars";
      for (const item of stats) {
        const row = document.createElement("div");
        row.className = "tracker-bar-row";
        const heading = document.createElement("div");
        heading.className = "tracker-bar-heading";
        const name = document.createElement("span");
        name.textContent = item.calendar.name;
        const value = document.createElement("strong");
        value.textContent = `${formatDuration(item.minutes)} Â· ${item.count} jadwal`;
        heading.append(name, value);
        const track = document.createElement("div");
        track.className = "tracker-bar-track";
        const fill = document.createElement("span");
        fill.className = "tracker-bar-fill";
        fill.style.width = `${item.minutes ? Math.max(2, item.minutes / maximum * 100) : 0}%`;
        fill.style.backgroundColor = item.calendar.color;
        track.appendChild(fill);
        row.append(heading, track);
        bars.appendChild(row);
      }
      const total = document.createElement("p");
      total.className = "tracker-chart-total";
      total.textContent = `Total waktu terjadwal: ${formatDuration(durationTotal)}`;
      els.trackerChart.append(bars, total);
    } else {
      const table = document.createElement("table");
      table.className = "tracker-data-table";
      const head = document.createElement("thead");
      const headingRow = document.createElement("tr");
      for (const label of ["Kategori", "Jadwal", "Durasi"]) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        headingRow.appendChild(cell);
      }
      head.appendChild(headingRow);
      const body = document.createElement("tbody");
      for (const item of stats) {
        const row = document.createElement("tr");
        const name = document.createElement("th");
        name.scope = "row";
        name.textContent = item.calendar.name;
        const count = document.createElement("td");
        count.textContent = String(item.count);
        count.dataset.label = "Jadwal";
        const duration = document.createElement("td");
        duration.textContent = formatDuration(item.minutes);
        duration.dataset.label = "Durasi";
        row.append(name, count, duration);
        body.appendChild(row);
      }
      const footer = document.createElement("tfoot");
      const total = document.createElement("tr");
      const totalLabel = document.createElement("th");
      totalLabel.scope = "row";
      totalLabel.textContent = "Total";
      const totalCount = document.createElement("td");
      totalCount.textContent = String(countTotal);
      totalCount.dataset.label = "Jadwal";
      const totalDuration = document.createElement("td");
      totalDuration.textContent = formatDuration(durationTotal);
      totalDuration.dataset.label = "Durasi";
      total.append(totalLabel, totalCount, totalDuration);
      footer.appendChild(total);
      table.append(head, body, footer);
      els.trackerChart.appendChild(table);
    }
    document.querySelectorAll("[data-tracker-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.trackerMode === trackerChartMode));
    });
  }

  document.querySelector(".tracker-view-switch").addEventListener("click", (e) => {
    const button = e.target.closest("button[data-tracker-mode]");
    if (!button) return;
    trackerChartMode = button.dataset.trackerMode;
    renderTracker();
  });

  els.trackerLegend.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-calendar-id]");
    if (button) selectTrackerCalendar(button.dataset.calendarId);
  });

  function renderTracker() {
    const calendar = getActiveCalendar();
    const activeEvents = getActiveEvents();
    const now = new Date();
    const nowTime = now.getTime();
    const upcoming = activeEvents
      .map((event) => getNextOccurrence(event, now))
      .filter((event) => event && event.timestamp >= nowTime)
      .sort((a, b) => a.timestamp - b.timestamp);
    const monthStart = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const monthOccurrences = getOccurrencesInRange(activeEvents, monthStart, monthEnd);
    const scheduledDays = new Set(monthOccurrences.map((event) => event.date));

    els.trackerCalendarName.textContent = calendar.name;
    els.trackerCalendarName.style.borderColor = calendar.color;
    els.trackerTotal.textContent = String(monthOccurrences.length);
    els.trackerUpcoming.textContent = String(upcoming.length);
    els.trackerDays.textContent = String(scheduledDays.size);
    els.trackerDuration.textContent = formatDuration(
      monthOccurrences.reduce((total, event) => total + eventDurationMinutes(event), 0)
    );
    els.trackerList.textContent = "";
    els.trackerEmpty.hidden = upcoming.length > 0;
    renderTrackerChart();
    renderWeeklyReport();
    renderHabitHeatmap();
    renderTimeBudgetSummary();

    const frag = document.createDocumentFragment();
    for (const item of upcoming.slice(0, 5)) {
      const li = document.createElement("li");
      li.className = "event";
      const time = document.createElement("span");
      time.className = "event-time";
      time.textContent = item.endTime
        ? `${item.time || "00:00"}â€“${item.endTime}`
        : (item.time || "00:00");
      const main = document.createElement("div");
      main.className = "event-main";
      const title = document.createElement("p");
      title.className = "event-title";
      title.textContent = item.title;
      const date = document.createElement("small");
      date.className = "tracker-date";
      date.textContent = dayFmt.format(new Date(`${item.occurrenceDate}T00:00`));
      main.append(title, date);
      li.append(time, main);
      frag.appendChild(li);
    }
    els.trackerList.appendChild(frag);
  }

  function getWeekRange(offsetWeeks = 0) {
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offsetWeeks * 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { start: toISO(monday), end: toISO(sunday) };
  }

  function renderWeeklyReport() {
    const range = getWeekRange(-1);
    const completed = getOccurrencesInRange(getActiveEvents(), range.start, range.end)
      .filter((event) => event.status === "done");
    const minutes = completed.reduce((total, event) => total + eventDurationMinutes(event), 0);
    els.weeklyReport.hidden = false;
    els.weeklyReport.textContent = `Minggu lalu kamu menyelesaikan ${completed.length} jadwal dan menghabiskan ${formatDuration(minutes)} produktif.`;
  }

  function renderHabitHeatmap() {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const counts = new Map();
    for (const event of getOccurrencesInRange(getActiveEvents(), toISO(start), toISO(end))) {
      if (event.status === "done") counts.set(event.date, (counts.get(event.date) || 0) + 1);
    }
    els.heatmapYear.textContent = String(year);
    els.habitHeatmap.textContent = "";
    const dayCount = Math.round((end - start) / 86400000) + 1;
    els.habitHeatmap.style.setProperty("--heatmap-columns", String(Math.ceil(dayCount / 7)));
    const fragment = document.createDocumentFragment();
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const iso = toISO(date);
      const count = counts.get(iso) || 0;
      const cell = document.createElement("span");
      cell.className = "heatmap-day";
      cell.dataset.level = count === 0 ? "0" : count === 1 ? "1" : count === 2 ? "2" : count <= 4 ? "3" : "4";
      cell.title = `${iso}: ${count} jadwal selesai`;
      cell.setAttribute("aria-label", cell.title);
      fragment.appendChild(cell);
    }
    els.habitHeatmap.appendChild(fragment);
  }

  function renderTimeBudgetSummary() {
    const budgets = loadBudgets();
    const range = getWeekRange();
    els.timeBudgetSummary.textContent = "";
    for (const calendar of calendars) {
      const target = budgets[calendar.id];
      if (!target || (!target.min && !target.max)) continue;
      const hours = getOccurrencesInRange(events.filter((event) => event.calendarId === calendar.id), range.start, range.end)
        .reduce((total, event) => total + eventDurationMinutes(event), 0) / 60;
      const item = document.createElement("p");
      item.className = "budget-indicator";
      const isOver = target.max && hours > target.max;
      const isUnder = target.min && hours < target.min;
      item.classList.toggle("budget-warning", Boolean(isOver || isUnder));
      item.textContent = `${calendar.name}: ${hours.toFixed(1)} jam` +
        (target.min ? ` Â· min ${target.min}j` : "") +
        (target.max ? ` Â· maks ${target.max}j` : "") +
        (isOver ? " Â· melewati batas" : isUnder ? " Â· belum mencapai target" : " Â· sesuai target");
      els.timeBudgetSummary.appendChild(item);
    }
    if (!els.timeBudgetSummary.childElementCount) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Atur Goals kategori di Pengaturan untuk melihat ringkasan pekanan.";
      els.timeBudgetSummary.appendChild(empty);
    }
  }

  function renderAll() {
    renderCalendarOptions();
    renderCalendar();
    renderModal();
    renderTracker();
    updateSearchStatus();
    renderSearchResults();
    renderCountdown();
    renderBudgetSettings();
  }

  window.addEventListener("beforeprint", () => {
    if (calendarMode !== "month") {
      printRestoreMode = calendarMode;
      calendarMode = "month";
      renderCalendar();
    }
  });
  window.addEventListener("afterprint", () => {
    if (!printRestoreMode) return;
    calendarMode = printRestoreMode;
    printRestoreMode = null;
    renderCalendar();
  });

  function showView(name) {
    const views = {
      calendar: els.calendarView,
      tracker: els.trackerView,
      settings: els.settingsView,
    };
    if (!Object.hasOwn(views, name)) return;
    for (const [viewName, view] of Object.entries(views)) {
      view.hidden = viewName !== name;
    }
    document.querySelectorAll(".primary-nav [data-view]").forEach((button) => {
      if (button.dataset.view === name) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    els.accountMenu.hidden = true;
    els.accountMenuBtn.setAttribute("aria-expanded", "false");
    if (name === "tracker") renderTracker();
    if (name === "settings") renderCalendarOptions();
  }

  function createCalendar(name, color) {
    const calendar = {
      id: `calendar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      color,
    };
    calendars.push(calendar);
    activeCalendarId = calendar.id;
    saveCalendars();
    renderAll();
    showView("calendar");
  }

  /* ---------------- navigasi ---------------- */
  function shiftMonth(delta) {
    const d = calendarMode === "year"
      ? new Date(viewYear + delta, 0, 1)
      : new Date(viewYear, viewMonth + delta, 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
    renderCalendar();
  }

  els.prevMonth.addEventListener("click", () => shiftMonth(-1));
  els.nextMonth.addEventListener("click", () => shiftMonth(1));

  els.todayBtn.addEventListener("click", () => {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    calendarMode = "month";
    renderCalendar();
  });

  els.yearViewBtn.addEventListener("click", () => {
    calendarMode = calendarMode === "month" ? "year" : "month";
    renderCalendar();
  });
  /* ---------------- klik kalender ---------------- */
  els.calGrid.addEventListener("click", (e) => {
    const monthButton = e.target.closest("button.month-tile");
    if (monthButton) {
      viewMonth = Number(monthButton.dataset.month);
      calendarMode = "month";
      renderCalendar();
      return;
    }
    const chip = e.target.closest("button[data-event-id]");
    if (chip) {
      if (e.target.closest("[data-resize-event-id]")) return;
      const event = events.find((item) => item.id === chip.dataset.eventId);
      if (event) openModal(chip.dataset.eventDate || event.date, event.id);
      return;
    }
    const btn = e.target.closest(".day");
    if (!btn) return;

    const iso = btn.dataset.date;
    const d = new Date(iso + "T00:00");

    if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) {
      viewYear = d.getFullYear();
      viewMonth = d.getMonth();
      renderCalendar();
    }
    openModal(iso);
  });

  let resizeDrag = null;
  els.calGrid.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-resize-event-id]");
    if (!handle) return;
    const scheduled = events.find((item) => item.id === handle.dataset.resizeEventId);
    if (!scheduled) return;
    event.preventDefault();
    event.stopPropagation();
    const chip = handle.closest(".chip");
    chip.draggable = false;
    resizeDrag = {
      id: scheduled.id,
      startX: event.clientX,
      startY: event.clientY,
      originalEnd: (Number((scheduled.endTime || "10:00").slice(0, 2)) * 60) +
        Number((scheduled.endTime || "10:00").slice(3, 5)),
      start: scheduled.time || "09:00",
      chip,
    };
    handle.setPointerCapture(event.pointerId);
  });
  document.addEventListener("pointermove", (event) => {
    if (!resizeDrag) return;
    const delta = Math.round(((event.clientY - resizeDrag.startY) + (event.clientX - resizeDrag.startX)) / 24) * 15;
    const startMinutes = Number(resizeDrag.start.slice(0, 2)) * 60 + Number(resizeDrag.start.slice(3, 5));
    const endMinutes = Math.max(startMinutes + 15, Math.min(1439, resizeDrag.originalEnd + delta));
    resizeDrag.chip.dataset.previewEnd = `${pad2(Math.floor(endMinutes / 60))}:${pad2(endMinutes % 60)}`;
    resizeDrag.chip.title = `Durasi baru sampai ${resizeDrag.chip.dataset.previewEnd}`;
  });
  document.addEventListener("pointerup", () => {
    if (!resizeDrag) return;
    const scheduled = events.find((item) => item.id === resizeDrag.id);
    if (scheduled) {
      const endTime = resizeDrag.chip.dataset.previewEnd;
      if (endTime) scheduled.endTime = endTime;
      resizeDrag.chip.draggable = true;
      saveEvents();
      renderAll();
    }
    resizeDrag = null;
  });
  document.addEventListener("pointercancel", () => {
    if (!resizeDrag) return;
    resizeDrag.chip.draggable = true;
    resizeDrag = null;
  });

  els.calGrid.addEventListener("keydown", (e) => {
    const day = e.target.closest(".day");
    if (!day || e.target !== day || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    const date = new Date(`${day.dataset.date}T00:00`);
    viewYear = date.getFullYear();
    viewMonth = date.getMonth();
    calendarMode = "month";
    openModal(day.dataset.date);
  });

  els.calGrid.addEventListener("dragstart", (e) => {
    const chip = e.target.closest("button[data-event-id]");
    if (!chip || !e.dataTransfer) return;
    e.dataTransfer.setData("text/plain", chip.dataset.eventId);
    e.dataTransfer.effectAllowed = "move";
    chip.classList.add("dragging");
  });

  els.calGrid.addEventListener("dragend", (e) => {
    const chip = e.target.closest("button[data-event-id]");
    if (chip) chip.classList.remove("dragging");
    els.calGrid.querySelectorAll(".drop-target").forEach((day) => day.classList.remove("drop-target"));
  });

  els.calGrid.addEventListener("dragover", (e) => {
    const day = e.target.closest(".day");
    if (!day || !e.dataTransfer) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    day.classList.add("drop-target");
  });

  els.calGrid.addEventListener("dragleave", (e) => {
    const day = e.target.closest(".day");
    if (day && !day.contains(e.relatedTarget)) day.classList.remove("drop-target");
  });

  els.calGrid.addEventListener("drop", (e) => {
    const day = e.target.closest(".day");
    const eventId = e.dataTransfer?.getData("text/plain");
    if (!day || !eventId) return;
    e.preventDefault();
    const event = events.find((item) => item.id === eventId && item.calendarId === activeCalendarId);
    if (!event || event.date === day.dataset.date) return;
    event.date = day.dataset.date;
    const newDate = new Date(`${event.date}T00:00`);
    viewYear = newDate.getFullYear();
    viewMonth = newDate.getMonth();
    calendarMode = "month";
    selectedDate = event.date;
    notifiedEvents.delete(event.id);
    saveNotifiedEvents();
    events.sort(byDateThenTime);
    saveEvents();
    renderAll();
  });

  els.eventList.addEventListener("change", (e) => {
    const checkbox = e.target.closest("[data-checklist-event-id]");
    if (!checkbox) return;
    const event = events.find((item) => item.id === checkbox.dataset.checklistEventId);
    const task = event?.checklist?.[Number(checkbox.dataset.checklistIndex)];
    if (!task) return;
    task.done = checkbox.checked;
    saveEvents();
    renderAll();
  });

  async function shareEvent(event) {
    const shared = {
      title: event.title,
      date: event.date,
      time: event.time || "09:00",
      endTime: event.endTime || "10:00",
      recurrence: event.recurrence || "none",
      calendarName: calendars.find((calendar) => calendar.id === event.calendarId)?.name || "",
      checklist: (event.checklist || []).map((task) => task.text),
    };
    const link = new URL(window.location.href);
    link.searchParams.set("sharedEvent", JSON.stringify(shared));
    try {
      await navigator.clipboard.writeText(link.toString());
      els.notificationStatus.textContent = "Tautan jadwal tersalin. Siapa pun yang membukanya dapat menyimpannya ke perangkat.";
    } catch (error) {
      els.notificationStatus.textContent = `Tautan siap dibagikan: ${link.toString()}`;
    }
  }

  function readSharedEvent() {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get("sharedEvent");
    if (!encoded) return;
    try {
      const shared = JSON.parse(encoded);
      const validTime = (time) => typeof time === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
      const dateValid = typeof shared.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(shared.date) &&
        toISO(new Date(`${shared.date}T00:00`)) === shared.date;
      if (typeof shared.title === "string" && shared.title.trim() &&
          dateValid && validTime(shared.time) &&
          (!shared.endTime || (validTime(shared.endTime) && shared.endTime > shared.time))) {
        pendingSharedEvent = shared;
      }
    } catch {
      els.notificationStatus.textContent = "Tautan jadwal tidak valid atau rusak.";
    }
    url.searchParams.delete("sharedEvent");
    history.replaceState(null, "", url.toString());
  }

  /* ---------------- tutup popup ---------------- */
  els.modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.modal.hidden) closeModal();
  });

  /* ---------------- tambah jadwal ---------------- */
  els.eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser || !selectedDate) return;

    const title = els.titleInput.value.trim();
    if (!title) { els.titleInput.focus(); return; }
    const eventDate = els.eventDate.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
        toISO(new Date(`${eventDate}T00:00`)) !== eventDate) {
      els.eventFormError.textContent = "Pilih tanggal kegiatan yang valid.";
      els.eventDate.focus();
      return;
    }
    if (!els.startHour.reportValidity() || !els.startMinute.reportValidity() ||
        !els.endHour.reportValidity() || !els.endMinute.reportValidity()) return;
    const time = getTime("start");
    const endTime = getTime("end");
    if (endTime <= time) {
      els.eventFormError.textContent = "Waktu selesai harus setelah waktu mulai pada hari yang sama.";
      els.endHour.focus();
      return;
    }
    els.eventFormError.textContent = "";

    const recurrence = ["weekly", "monthly"].includes(els.eventRecurrence.value)
      ? els.eventRecurrence.value
      : "none";
    const checklistText = els.eventChecklistInput.value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 30);
    const checklist = checklistText.map((text) => ({
      text,
      done: events.find((event) => event.id === editingEventId)?.checklist
        ?.find((task) => task.text === text)?.done || false,
    }));
    const existing = events.find((event) => event.id === editingEventId);
    if (existing) {
      for (const notificationId of notifiedEvents) {
        if (notificationId === existing.id || notificationId.startsWith(`${existing.id}@`)) {
          notifiedEvents.delete(notificationId);
        }
      }
      saveNotifiedEvents();
      existing.title = title;
      existing.date = eventDate;
      existing.time = time;
      existing.endTime = endTime;
      existing.recurrence = recurrence;
      existing.checklist = checklist;
      existing.status = els.eventStatus.value;
    } else {
      events.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title,
        date: eventDate,
        time,
        endTime,
        recurrence,
        calendarId: activeCalendarId,
        checklist,
        status: els.eventStatus.value,
      });
      playSound("event");
    }
    events.sort(byDateThenTime);
    selectedDate = eventDate;
    const eventDateObject = new Date(`${eventDate}T00:00`);
    viewYear = eventDateObject.getFullYear();
    viewMonth = eventDateObject.getMonth();
    calendarMode = "month";
    saveEvents();

    resetEventForm();
    els.titleInput.focus();

    renderAll();
    checkUpcomingNotifications();
  });

  /* ---------------- hapus jadwal ---------------- */
  els.cancelEventEditBtn.addEventListener("click", resetEventForm);

  els.eventList.addEventListener("click", (e) => {
    const statusButton = e.target.closest("[data-toggle-status-id]");
    if (statusButton) {
      const event = events.find((item) => item.id === statusButton.dataset.toggleStatusId);
      if (!event) return;
      event.status = event.status === "done" ? "todo" : "done";
      saveEvents();
      renderAll();
      return;
    }
    const shareButton = e.target.closest("[data-share-event-id]");
    if (shareButton) {
      const event = events.find((item) => item.id === shareButton.dataset.shareEventId);
      if (event) shareEvent(event);
      return;
    }
    const editButton = e.target.closest("button[data-edit-id]");
    if (editButton) {
      const event = events.find((item) => item.id === editButton.dataset.editId);
      if (event) startEventEdit(event, editButton.dataset.occurrenceDate || selectedDate);
      return;
    }
    const btn = e.target.closest("button[data-id]");
    if (!btn || !currentUser) return;

    if (editingEventId === btn.dataset.id) resetEventForm();
    notifiedEvents.delete(btn.dataset.id);
    saveNotifiedEvents();
    events = events.filter((ev) => ev.id !== btn.dataset.id);
    saveEvents();

    renderAll();
  });

  /* ---------------- perpindahan layar ---------------- */
  function getSubscriptionTier(user) {
    const key = subscriptionTierKey(user.email);
    const savedTier = localStorage.getItem(key);
    if (savedTier === "pro" || savedTier === "alpha") return savedTier;
    return null;
  }

  function showSubscriptionSelection(user) {
    currentUser = user;
    els.appScreen.classList.remove("active");
    els.signinScreen.classList.remove("active");
    els.subscriptionScreen.hidden = false;
    els.subscriptionScreen.classList.add("active");
    els.subscriptionSelectionStatus.textContent = "";
    els.selectProPlan.focus();
  }

  function selectSubscriptionPlan(tier) {
    if (!currentUser || (tier !== "pro" && tier !== "alpha")) return;
    try {
      localStorage.setItem(subscriptionTierKey(currentUser.email), tier);
    } catch (error) {
      console.error("Paket FUWME tidak dapat disimpan:", error);
      els.subscriptionSelectionStatus.textContent = "Pilihan paket tidak dapat disimpan. Periksa ruang penyimpanan browser lalu coba lagi.";
      return;
    }
    sinkronisasiTampilanLangganan();
    els.subscriptionScreen.classList.remove("active");
    els.subscriptionScreen.hidden = true;
    enterApp(currentUser);
  }

  els.selectProPlan.addEventListener("click", () => selectSubscriptionPlan("pro"));
  els.selectAlphaPlan.addEventListener("click", () => selectSubscriptionPlan("alpha"));

  function enterApp(user) {
    currentUser = user;
    resetAIChat();
    els.subscriptionScreen.classList.remove("active");
    els.subscriptionScreen.hidden = true;
    els.notificationStatus.textContent = "";
    loadCalendars(user.email);
    events = loadEvents(user.email).map((event) => ({
      ...event,
      recurrence: ["weekly", "monthly"].includes(event.recurrence) ? event.recurrence : "none",
      status: ["todo", "progress", "done"].includes(event.status) ? event.status : "todo",
      checklist: Array.isArray(event.checklist)
        ? event.checklist.filter((task) => task && typeof task.text === "string")
          .map((task) => ({ text: task.text, done: Boolean(task.done) }))
        : [],
      calendarId: calendars.some((calendar) => calendar.id === event.calendarId)
        ? event.calendarId
        : DEFAULT_CALENDAR.id,
    })).sort(byDateThenTime);
    if (pendingSharedEvent) {
      const shared = pendingSharedEvent;
      const sharedCalendar = calendars.find((calendar) => calendar.name === shared.calendarName) || getActiveCalendar();
      if (!events.some((event) => event.title === shared.title && event.date === shared.date && event.time === shared.time)) {
        events.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          title: shared.title.slice(0, 120),
          date: shared.date,
          time: shared.time,
          endTime: /^\d{2}:\d{2}$/.test(shared.endTime) ? shared.endTime : "10:00",
          recurrence: ["weekly", "monthly"].includes(shared.recurrence) ? shared.recurrence : "none",
          calendarId: sharedCalendar.id,
          checklist: Array.isArray(shared.checklist)
            ? shared.checklist.filter((item) => typeof item === "string").slice(0, 30)
              .map((text) => ({ text: text.slice(0, 120), done: false }))
            : [],
          status: "todo",
        });
        saveEvents();
        els.notificationStatus.textContent = "Jadwal dari tautan berhasil disimpan.";
      }
      pendingSharedEvent = null;
    }
    saveEvents();
    saveCalendars();
    loadNotifiedEvents(user.email);
    loadSoundPreference(user.email);
    loadSakuraSettings();
    loadWeatherForecast();
    renderBudgetSettings();
    startNotificationChecks();
    startAutomaticCleanup();
    startDateTimeClock();

    els.userName.textContent  = user.name;
    els.userEmail.textContent = user.email;

    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    selectedDate = ""; 

    els.signinScreen.classList.remove("active");
    els.appScreen.classList.add("active");

    showView("calendar");
    renderAll();
    requestNotificationPermissionOnEntry();
    refreshLocationAndWeather();
  }

  function showSignIn() {
    if (notificationTimer !== null) {
      window.clearInterval(notificationTimer);
      notificationTimer = null;
    }
    if (cleanupTimer !== null) {
      window.clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
    if (dateTimeTimer !== null) {
      window.clearInterval(dateTimeTimer);
      dateTimeTimer = null;
    }
    currentUser = null;
    els.subscriptionScreen.classList.remove("active");
    els.subscriptionScreen.hidden = true;
    els.aiChatPanel.hidden = true;
    els.aiChatLauncher.setAttribute("aria-expanded", "false");
    resetAIChat();
    events = [];
    soundEnabled = false;
    els.soundEnabled.checked = false;
    els.soundStatus.textContent = "";
    selectedDate = "";    
    closeModal();
    els.appScreen.classList.remove("active");
    els.signinScreen.classList.add("active");
    els.nameInput.focus();
  }

  /* ---------------- masuk / keluar ---------------- */
  els.signinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    const user = {
      name:  els.nameInput.value.trim(),
      email: els.emailInput.value.trim().toLowerCase(),
    };

    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Akun FUWME tidak dapat disimpan:", error);
      els.emailError.textContent = "Akun tidak dapat disimpan di browser ini. Periksa ruang penyimpanan lalu coba lagi.";
      return;
    }
    if (getSubscriptionTier(user) === null) {
      showSubscriptionSelection(user);
      return;
    }
    enterApp(user);
  });

  els.signOutBtn.addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    els.signinForm.reset();
    resetEventForm();
    for (const f of fields) setFieldError(f, "");
    showSignIn();
  });

  /* ---------------- mulai ---------------- */
  const user = loadUser();
  readSharedEvent();
  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
      els.notificationStatus.textContent = "PWA offline gagal diaktifkan. Coba muat ulang melalui HTTPS atau localhost.";
    });
  }
  if (!user) {
    showSignIn();
  } else if (getSubscriptionTier(user) === null) {
    showSubscriptionSelection(user);
  } else {
    enterApp(user);
  }
})();
// ==========================================
// LOGIKA SUBSCRIPTION SYSTEM AKUN FUWME
// ==========================================

function subscriptionTierKey(email) {
  return `fuwme_tier.${encodeURIComponent(email.trim().toLowerCase())}`;
}

function getSubscriptionEmail() {
  try {
    const user = JSON.parse(localStorage.getItem("scheduler.user") || "null");
    return typeof user?.email === "string" ? user.email : "";
  } catch (error) {
    console.error("Data akun FUWME tidak dapat dibaca:", error);
    return "";
  }
}

function simpanTierLanggananFuwme(tier) {
  const email = getSubscriptionEmail();
  if (!email || (tier !== "pro" && tier !== "alpha")) {
    console.error("Paket FUWME tidak dapat disimpan tanpa akun dan paket yang valid.");
    return false;
  }
  try {
    localStorage.setItem(subscriptionTierKey(email), tier);
    return true;
  } catch (error) {
    console.error("Paket FUWME tidak dapat disimpan:", error);
    return false;
  }
}

const labelStatusPaket = document.getElementById("statusPaketLabel");
const deskripsiPaketAI = document.getElementById("deskripsiPaketAI");
const cardBorder = document.getElementById("statusCardBorder");
const btnPro = document.getElementById("btnUpgradePro");
const btnAlpha = document.getElementById("btnUpgradeAlpha");

function ambilTierLanggananFuwme() {
  const email = getSubscriptionEmail();
  if (!email) return null;
  const tier = localStorage.getItem(subscriptionTierKey(email));
  return tier === "pro" || tier === "alpha" ? tier : null;
}

function sinkronisasiTampilanLangganan() {
  const tierAktif = ambilTierLanggananFuwme();
  if (!labelStatusPaket || !deskripsiPaketAI || !cardBorder) return;

  if (tierAktif === "pro") {
    labelStatusPaket.innerText = "PRO MEMBER âœ¨";
    labelStatusPaket.style.color = "#D98AA6";
    cardBorder.style.borderLeft = "4px solid #D98AA6";
    deskripsiPaketAI.innerText = "Aktif (Rp 10.000/minggu). Anda memiliki akses ke asisten AI penjadwalan dasar.";
  } else if (tierAktif === "alpha") {
    labelStatusPaket.innerText = "ALPHA MEMBER ðŸ‘‘";
    labelStatusPaket.style.color = "#eccc68";
    cardBorder.style.borderLeft = "4px solid #eccc68";
    deskripsiPaketAI.innerText = "Aktif (Rp 25.000/minggu). Akses penuh AI premium dan tracker analisis otomatis.";
  } else {
    labelStatusPaket.innerText = "Belum dipilih";
    labelStatusPaket.style.color = "#a0aec0";
    cardBorder.style.borderLeft = "4px solid #a0aec0";
    deskripsiPaketAI.innerText = "Pilih paket Pro atau Alpha untuk mengaktifkan fitur AI.";
  }
}

if (btnPro) {
  btnPro.addEventListener("click", () => {
    if (!simpanTierLanggananFuwme("pro")) {
      deskripsiPaketAI.textContent = "Paket tidak dapat disimpan. Periksa ruang penyimpanan browser lalu coba lagi.";
      return;
    }
    sinkronisasiTampilanLangganan();
  });
}

if (btnAlpha) {
  btnAlpha.addEventListener("click", () => {
    if (!simpanTierLanggananFuwme("alpha")) {
      deskripsiPaketAI.textContent = "Paket tidak dapat disimpan. Periksa ruang penyimpanan browser lalu coba lagi.";
      return;
    }
    sinkronisasiTampilanLangganan();
  });
}

// Jalankan saat aplikasi pertama kali dimuat di browser
sinkronisasiTampilanLangganan();
{
// ========================================================
// INTEGRASI GERBANG PEMBAYARAN MIDTRANS (SANDBOX MODE)
// ========================================================

const btnPro = document.getElementById("btnUpgradePro");
const btnAlpha = document.getElementById("btnUpgradeAlpha");

const MIDTRANS_PRO_LINK = "https://app.sandbox.midtrans.com/payment-links/ca70d978-9429-4335-9cb4-f74c5d4056b2-MSExfQOB";
const MIDTRANS_ALPHA_LINK = "https://app.sandbox.midtrans.com/payment-links/6607b1ca-dc46-4349-917d-bca64f1b9d2a-rlbe7MEd";

if (btnPro) {
  btnPro.addEventListener("click", () => {
    alert("Membuka gerbang pembayaran aman Midtrans... Silakan selesaikan pembayaran simulasi Anda.");
    window.location.href = MIDTRANS_PRO_LINK;
  });
}

if (btnAlpha) {
  btnAlpha.addEventListener("click", () => {
    alert("Membuka gerbang pembayaran aman Midtrans... Silakan selesaikan pembayaran simulasi Anda.");
    window.location.href = MIDTRANS_ALPHA_LINK;
  });
}

// ========================================================
// FUNGSI OTOMATISASI AKTIVASI FITUR PREMIUM SETELAH BAYAR
// ========================================================
function periksaKembalianPembayaran() {
  const urlParams = new URLSearchParams(window.location.search);
  const statusPembayaran = urlParams.get("payment");
  const tierDilewati = urlParams.get("tier");

  if (statusPembayaran === "success" && (tierDilewati === "pro" || tierDilewati === "alpha")) {
    // Simpan status keanggotaan ke dalam browser pembeli
    localStorage.setItem("fuwme_tier", tierDilewati);
    
    alert(`Selamat! Pembayaran simulasi berhasil diterima. Paket FUWME ${tierDilewati.toUpperCase()} Anda telah aktif.`);
    
    // Bersihkan parameter URL agar alert tidak muncul berulang kali saat di-refresh
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Sinkronisasi ulang tampilan dashboard agar fitur AI langsung terbuka
    if (typeof sinkronisasiTampilanLangganan === "function") {
      sinkronisasiTampilanLangganan();
    }
  }
}

// Jalankan otomatis setiap kali aplikasi FUWME dimuat di browser
periksaKembalianPembayaran();
}
