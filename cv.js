/* ==========================================================================
   Thái Thiên Duy · Website CV — cv.js
   1) giao diện sáng/tối  2) thanh đầu trang, thanh tiến độ, menu  3) hiệu ứng khi cuộn
   4) ảnh  5) sao chép / in / năm  6) cửa sổ chi tiết kỹ năng
   JavaScript thuần, không dùng thư viện, không cần build.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function readSaved(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function writeSaved(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* chế độ riêng tư: bỏ qua */ } }

  /* ---------- 1. Giao diện sáng / tối ---------- */
  var themeButton = $("#theme-toggle");
  var themeMetas = $$('meta[name="theme-color"]');

  function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  function applyTheme(theme, remember) {
    var dark = theme === "dark";
    root.setAttribute("data-theme", theme);
    themeMetas.forEach(function (meta) { meta.setAttribute("content", dark ? "#070f1d" : "#f4f7fb"); });
    if (themeButton) {
      themeButton.setAttribute("aria-pressed", String(dark));
      themeButton.setAttribute("aria-label", dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối");
    }
    if (remember) writeSaved("td-theme", theme);
  }

  applyTheme(currentTheme(), false);

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  // Theo giao diện của thiết bị, miễn là người xem chưa tự chọn
  if (window.matchMedia) {
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    var followSystem = function (event) {
      if (!readSaved("td-theme")) applyTheme(event.matches ? "dark" : "light", false);
    };
    if (systemDark.addEventListener) systemDark.addEventListener("change", followSystem);
    else if (systemDark.addListener) systemDark.addListener(followSystem);
  }

  /* ---------- 2. Bóng đổ thanh đầu trang, thanh tiến độ đọc, menu trên điện thoại ---------- */
  var header = $(".site-header");
  var progressBar = $(".progress span");
  var scrollTicking = false;

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () {
      var y = window.pageYOffset || root.scrollTop || 0;
      var max = Math.max(1, root.scrollHeight - window.innerHeight);
      if (progressBar) progressBar.style.setProperty("--progress", Math.min(1, y / max).toFixed(4));
      if (header) header.classList.toggle("is-scrolled", y > 8);
      scrollTicking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  var menuButton = $("#nav-toggle");
  var menu = $("#site-nav");

  function setMenu(open) {
    if (!menuButton || !menu) return;
    menu.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  }

  if (menuButton && menu) {
    menuButton.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (event) { if (event.target.closest("a")) setMenu(false); });
    document.addEventListener("click", function (event) {
      if (menu.classList.contains("open") && !event.target.closest(".site-header")) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.classList.contains("open")) { setMenu(false); menuButton.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1040) setMenu(false); });
  }

  /* ---------- 3. Hiệu ứng khi cuộn: tô sáng mục đang xem, hiện dần nội dung ---------- */
  var navLinks = $$(".site-nav a[href^='#']");
  var linkById = {};
  navLinks.forEach(function (link) { linkById[link.getAttribute("href").slice(1)] = link; });
  var watched = Object.keys(linkById).map(function (id) { return document.getElementById(id); }).filter(Boolean);

  function markActive(id) {
    navLinks.forEach(function (link) {
      var on = link === linkById[id];
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window && watched.length) {
    var inBand = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { inBand[entry.target.id] = entry.isIntersecting; });
      var active = null;
      watched.forEach(function (section) { if (inBand[section.id]) active = section.id; });
      markActive(active);
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    watched.forEach(function (section) { spy.observe(section); });
  }

  // Các phần tử cạnh nhau trong lưới/danh sách hiện lần lượt, cách nhau một chút
  $$(".persona-copy, .skill-grid, .found-grid, .work-list, .mini-grid").forEach(function (group) {
    $$(".reveal", group).forEach(function (el, index) { el.style.setProperty("--d", Math.min(index, 8) * 70 + "ms"); });
  });

  var revealTargets = $$(".reveal").concat($$(".gpa-ring"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealTargets.forEach(function (el) { revealer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 4. Ảnh: dùng ảnh thật nếu có, nếu thiếu thì hiện khung dự phòng gọn gàng ---------- */
  function trackImage(img, box, onResult) {
    if (!img || !box) return;
    function good() { box.classList.add("has-img"); box.classList.remove("no-img"); if (onResult) onResult(true); }
    function bad() { img.classList.add("is-missing"); box.classList.remove("has-img"); box.classList.add("no-img"); if (onResult) onResult(false); }
    if (img.complete) {
      if (img.naturalWidth > 0) good(); else bad();
    } else {
      img.addEventListener("load", good, { once: true });
      img.addEventListener("error", bad, { once: true });
    }
  }

  // Ảnh có vừa khít khung không, hay còn khoảng trống (tall = hai bên, wide = trên và dưới)?
  // Khoảng trống được lấp bằng bản sao mờ của chính ảnh và mép ảnh được làm mờ dần (xem cv.css),
  // nên không lộ đường viền cứng. --f là phần khung mà ảnh phủ theo chiều có khoảng trống.
  function applyFit(box, img, frameRatio) {
    var ratio = img.naturalWidth / (img.naturalHeight || 1);
    var fit = "exact", share = 1;
    if (ratio < frameRatio - 0.04) { fit = "tall"; share = ratio / frameRatio; }
    else if (ratio > frameRatio + 0.04) { fit = "wide"; share = frameRatio / ratio; }
    box.setAttribute("data-fit", fit);
    box.style.setProperty("--f", share.toFixed(4));
  }

  // thẻ kỹ năng: nền mờ phía sau được tạo từ chính tấm ảnh
  $$(".skill-card .skill-media").forEach(function (box) {
    var img = $("img", box);
    trackImage(img, box, function (ok) {
      if (!ok) return;
      box.style.setProperty("--img", 'url("' + (img.currentSrc || img.src) + '")');
      applyFit(box, img, 1.5);
    });
  });
  trackImage($(".portrait-frame img"), $(".portrait-frame"));
  trackImage($(".visual-photo"), $(".project-visual"));

  /* ---------- 5. Nút sao chép, nút in, năm ở chân trang ---------- */
  var toast = $("#toast");
  var toastTimer = 0;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      try {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(area);
        area.select();
        var done = document.execCommand("copy");
        document.body.removeChild(area);
        if (done) resolve(); else reject(new Error("copy failed"));
      } catch (error) { reject(error); }
    });
  }

  $$(".copy-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var label = button.getAttribute("data-label") || "nội dung";
      copyText(button.getAttribute("data-copy") || "").then(function () {
        button.classList.add("is-done");
        showToast("Đã sao chép " + label);
        window.setTimeout(function () { button.classList.remove("is-done"); }, 1800);
      }, function () { showToast("Hãy chọn nội dung rồi nhấn Ctrl+C để sao chép"); });
    });
  });

  $$("[data-print]").forEach(function (button) {
    button.addEventListener("click", function () { window.print(); });
  });

  var yearSlot = $("#year");
  if (yearSlot) yearSlot.textContent = String(new Date().getFullYear());

  /* ---------- 6. Cửa sổ chi tiết kỹ năng ----------
     Nội dung của mọi kỹ năng nằm trong một đối tượng duy nhất bên dưới.
     Khóa (ví dụ solidworks) phải trùng với data-skill="..." trong cv.html.
     level để trống "" thì không hiện nhãn "Cơ bản". */
  var SKILLS = {
    solidworks: {
      title: "SolidWorks", kind: "Thiết kế cơ khí", level: "",
      what: "SolidWorks là phần mềm thiết kế có sự hỗ trợ của máy tính (CAD). Kỹ sư dùng nó để dựng mô hình 3D cho từng chi tiết, ghép chúng thành bộ lắp ráp và xuất bản vẽ kỹ thuật trước khi chế tạo thật.",
      how: "Dùng SolidWorks để thiết kế cơ khí 3D cho robot và hệ thống tự động hóa, từ mô hình từng chi tiết đến bộ lắp ráp hoàn chỉnh.",
      tags: ["Mô hình 3D", "Bản lắp ráp", "Thiết kế cơ khí"]
    },
    autocad: {
      title: "AutoCAD", kind: "Bản vẽ kỹ thuật", level: "Cơ bản",
      what: "AutoCAD là phần mềm CAD nổi tiếng với khả năng vẽ kỹ thuật 2D chính xác.",
      how: "Có kiến thức cơ bản về AutoCAD. Kỹ năng này bổ trợ cho SolidWorks và phù hợp với định hướng thiết kế cơ khí cho tự động hóa.",
      tags: ["Bản vẽ 2D", "Bản vẽ kỹ thuật"]
    },
    arduino: {
      title: "Arduino · C/C++", kind: "Lập trình nhúng", level: "",
      what: "Arduino là nền tảng vi điều khiển thân thiện với người mới bắt đầu. C/C++ là ngôn ngữ lập trình dùng để chỉ cho vi điều khiển cách đọc cảm biến, điều khiển động cơ và các thiết bị khác.",
      how: "Lập trình vi điều khiển ESP32 bằng C/C++ cho đồ án trang trại mô phỏng, tích hợp cảm biến, quạt và mạch điện tử thành một khối phần cứng hoàn chỉnh. STM32 là vi điều khiển dùng để điều khiển robot 6-DOF trong đồ án học thuật.",
      tags: ["ESP32", "STM32", "C/C++", "Vi điều khiển"]
    },
    matlab: {
      title: "MATLAB/Simulink", kind: "Mô hình hóa & mô phỏng", level: "Cơ bản",
      what: "MATLAB là công cụ tính toán số và phân tích dữ liệu. Simulink chạy bên trong MATLAB, cho phép dựng hệ thống từ các khối nối với nhau và mô phỏng hành vi của nó theo thời gian.",
      how: "Dùng MATLAB/Simulink để mô phỏng robot và các thuật toán điều khiển nâng cao như PID và AFSMC.",
      tags: ["Simulink", "Mô phỏng robot", "Mô phỏng điều khiển"]
    },
    control: {
      title: "Hệ thống điều khiển", kind: "PID & SMC", level: "",
      what: "Hệ thống điều khiển giúp máy móc tự động bám theo mục tiêu. PID hiệu chỉnh sai số giữa giá trị mong muốn và giá trị thực bằng ba thành phần: tỉ lệ, tích phân và vi phân. Điều khiển trượt (SMC) đưa hệ thống về một “mặt trượt” được thiết kế trước và giữ cho hệ bền vững trước nhiễu; AFSMC bổ sung logic mờ để thông số điều khiển tự thích nghi theo trạng thái của hệ thống. GOA (tối ưu châu chấu) và PSO (tối ưu bầy đàn) là các thuật toán cho nhiều “cá thể” cùng dò tìm lời giải tốt nhất, ở đây là bộ thông số của bộ điều khiển.",
      how: "Mô phỏng thuật toán AFSMC cho robot 6-DOF và dùng thuật toán tối ưu châu chấu (GOA) để tìm thông số tối ưu. Ngoài ra còn ứng dụng thuật toán PSO để dò tìm Kp, Ki, Kd cho bộ điều khiển PID.",
      tags: ["PID", "Điều khiển trượt", "AFSMC", "GOA", "PSO"]
    },
    proteus: {
      title: "Proteus", kind: "Mô phỏng mạch điện", level: "Cơ bản",
      what: "Proteus là phần mềm điện tử dùng để vẽ mạch và mô phỏng mạch, kể cả vi điều khiển, trước khi làm phần cứng thật.",
      how: "Dùng Proteus để vẽ và mô phỏng mạch điện tử, như mạch khóa nút thiết kế hoàn toàn bằng IC trong đồ án môn Hệ Thống Số.",
      tags: ["Mô phỏng mạch", "Điện tử", "IC số"]
    },
    hardware: {
      title: "Cảm biến, cơ cấu chấp hành & động cơ", kind: "Tích hợp phần cứng", level: "Cơ bản",
      what: "Cảm biến đo thế giới xung quanh (ví dụ vị trí hoặc khoảng cách), cơ cấu chấp hành và động cơ tạo ra chuyển động, còn bộ điều khiển kết nối hai bên.",
      how: "Ghép nối cảm biến, cơ cấu chấp hành và vi điều khiển thành một khối phần cứng hoàn chỉnh, như cảm biến DHT11, MQ135 và quạt trong đồ án trang trại mô phỏng ESP32. Chú trọng thực hành tích hợp chi tiết cơ khí, cảm biến, cơ cấu chấp hành và bộ điều khiển thành hệ thống cơ điện hoàn chỉnh.",
      tags: ["Cảm biến", "Cơ cấu chấp hành", "Động cơ", "Tích hợp"]
    },
    vision: {
      title: "Machine Vision & Xử lý ảnh", kind: "Xử lý ảnh", level: "Cơ bản",
      what: "Machine Vision (thị giác máy) giúp máy tính hiểu hình ảnh từ camera, ví dụ tìm và nhận dạng vật thể để máy móc tự động đưa ra quyết định.",
      how: "Có kiến thức cơ bản về Machine Vision, từ xử lý ảnh đến nhận dạng vật thể để robot và dây chuyền tự động đưa ra quyết định.",
      tags: ["Xử lý ảnh", "Nhận dạng vật thể"]
    },
    office: {
      title: "MS Office & Báo cáo kỹ thuật", kind: "Tài liệu kỹ thuật", level: "",
      what: "Các công cụ Microsoft Office như Word, Excel và PowerPoint dùng để viết báo cáo, sắp xếp dữ liệu và trình bày công việc kỹ thuật một cách rõ ràng.",
      how: "Dùng chúng để làm báo cáo kỹ thuật, bao gồm biên soạn tài liệu kỹ thuật đầy đủ cho các đồ án.",
      tags: ["Tài liệu kỹ thuật", "Báo cáo"]
    }
  };

  var dialog = $("#skill-dialog");
  var openers = $$(".skill-btn[data-skill]");

  if (dialog && typeof dialog.showModal === "function") {
    var ui = {
      panel: $(".dialog-panel", dialog), media: $("#skill-media"), icon: $("#skill-icon-use"), image: $("#skill-image"),
      kind: $("#skill-kind"), title: $("#skill-title"), level: $("#skill-level"), what: $("#skill-what"), how: $("#skill-how"),
      tags: $("#skill-tags"), prev: $("#skill-prev"), next: $("#skill-next"), count: $("#skill-count"), close: $("#skill-close")
    };
    var index = 0;
    var lastOpener = null;

    var showSkill = function (i) {
      var opener = openers[i];
      var data = opener && SKILLS[opener.getAttribute("data-skill")];
      if (!data) return;
      index = i;

      var cardMedia = $(".skill-media", opener.closest(".skill-card"));
      var cardImage = cardMedia ? $("img", cardMedia) : null;
      var iconId = (cardMedia && cardMedia.getAttribute("data-icon")) || "i-cube";

      ui.kind.textContent = data.kind;
      ui.title.textContent = data.title;
      ui.level.hidden = !data.level;
      ui.level.textContent = data.level;
      ui.what.textContent = data.what;
      ui.how.textContent = data.how;
      ui.tags.textContent = "";
      data.tags.forEach(function (tag) {
        var item = document.createElement("li");
        item.textContent = tag;
        ui.tags.appendChild(item);
      });

      ui.media.setAttribute("data-icon", iconId);
      ui.icon.setAttribute("href", "#" + iconId);
      if (cardMedia && cardImage && cardMedia.classList.contains("has-img")) {
        var src = cardImage.currentSrc || cardImage.src;
        ui.image.src = src;
        ui.image.alt = cardImage.alt;
        ui.image.hidden = false;
        ui.media.style.setProperty("--img", 'url("' + src + '")');
        applyFit(ui.media, cardImage, window.innerWidth <= 600 ? 1.5 : 2);
        ui.media.classList.add("has-img");
      } else {
        ui.image.hidden = true;
        ui.image.removeAttribute("src");
        ui.image.alt = "";
        ui.media.style.removeProperty("--img");
        ui.media.removeAttribute("data-fit");
        ui.media.style.removeProperty("--f");
        ui.media.classList.remove("has-img");
      }

      ui.count.textContent = (i + 1) + " / " + openers.length;
      ui.panel.scrollTop = 0;
    };

    var step = function (direction) { showSkill((index + direction + openers.length) % openers.length); };

    openers.forEach(function (opener, i) {
      opener.addEventListener("click", function () {
        lastOpener = opener;
        showSkill(i);
        if (!dialog.open) dialog.showModal();
        root.classList.add("dialog-open");
      });
    });

    ui.close.addEventListener("click", function () { dialog.close(); });
    ui.prev.addEventListener("click", function () { step(-1); });
    ui.next.addEventListener("click", function () { step(1); });

    // bấm vào nền tối bên ngoài sẽ đóng cửa sổ
    dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    });
    dialog.addEventListener("close", function () {
      root.classList.remove("dialog-open");
      if (lastOpener) lastOpener.focus({ preventScroll: true });
    });
  } else {
    // trình duyệt quá cũ không có <dialog>: ẩn các nút thay vì để lại nút không hoạt động
    openers.forEach(function (opener) { opener.hidden = true; });
  }
})();
