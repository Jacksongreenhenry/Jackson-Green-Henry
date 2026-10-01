(() => {
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    const nav = document.querySelector("[data-nav-root]");
    const panel = document.querySelector("[data-nav-panel]");
    const toggle = document.querySelector("[data-nav-toggle]");
    const toggleLabel = document.querySelector("[data-nav-toggle-label]");
    const backdrop = document.querySelector("[data-nav-backdrop]");
    const toTop = document.querySelector("[data-to-top]");
    const form = document.querySelector("#contact-form");
    const formStatus = document.querySelector("[data-form-status]");
    const year = document.querySelector("[data-year]");

    const mounts = {};
    document.querySelectorAll("[data-scene-mount]").forEach((element) => {
        mounts[element.dataset.sceneMount] = element;
    });

    const motion = {
        get reducedMotion() {
            return reducedQuery.matches;
        },
        mounts,
        activate(name) {
            const root = mounts[name];
            if (!root) return;
            root.dataset.sceneReady = "true";
        },
        deactivate(name) {
            const root = mounts[name];
            if (!root) return;
            delete root.dataset.sceneReady;
        }
    };

    window.PortfolioMotion = motion;

    if (year) {
        year.textContent = String(new Date().getFullYear());
    }

    const mobileQuery = window.matchMedia("(max-width: 860px)");

    const setMenu = (open) => {
        if (!nav || !toggle) return;
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (toggleLabel) {
            toggleLabel.textContent = open ? "Close menu" : "Open menu";
        }
        document.body.style.overflow = open ? "hidden" : "";
        if (backdrop) {
            backdrop.hidden = !open;
        }
        if (panel) {
            const conceal = mobileQuery.matches && !open;
            if (conceal) {
                panel.setAttribute("inert", "");
                panel.setAttribute("aria-hidden", "true");
            } else {
                panel.removeAttribute("inert");
                panel.removeAttribute("aria-hidden");
            }
            if (open) {
                panel.setAttribute("role", "dialog");
                panel.setAttribute("aria-modal", "true");
                panel.setAttribute("aria-label", "Primary");
            } else {
                panel.removeAttribute("role");
                panel.removeAttribute("aria-modal");
            }
        }
    };

    setMenu(false);

    const menuOpen = () => nav?.classList.contains("is-open");

    toggle?.addEventListener("click", () => {
        const next = !menuOpen();
        setMenu(next);
        if (next) {
            panel?.querySelector("a")?.focus();
        }
    });

    backdrop?.addEventListener("click", () => setMenu(false));

    mobileQuery.addEventListener("change", () => setMenu(false));

    panel?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuOpen()) {
            setMenu(false);
            toggle?.focus();
        }

        if (event.key !== "Tab" || !menuOpen() || !panel || !toggle) return;

        const items = [toggle, ...panel.querySelectorAll("a")];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    const onScroll = () => {
        nav?.classList.toggle("is-scrolled", window.scrollY > 12);
        if (toTop) toTop.hidden = window.scrollY < 700;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    toTop?.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: reducedQuery.matches ? "auto" : "smooth"
        });
    });

    const navLinks = [...document.querySelectorAll("[data-nav]")];
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((link) => {
                    const current = link.getAttribute("href") === `#${entry.target.id}`;
                    if (current) link.setAttribute("aria-current", "true");
                    else link.removeAttribute("aria-current");
                });
            });
        }, {
            rootMargin: "-40% 0px -50% 0px",
            threshold: 0
        });

        sections.forEach((section) => observer.observe(section));
    }

    let tiltAbort = new AbortController();

    const bindTilt = () => {
        tiltAbort.abort();
        tiltAbort = new AbortController();
        const { signal } = tiltAbort;

        document.querySelectorAll("[data-tilt-target]").forEach((element) => {
            element.style.transform = "";
        });

        if (reducedQuery.matches || !finePointerQuery.matches) return;

        document.querySelectorAll("[data-tilt-target]").forEach((element) => {
            const parent = element.closest(".hero-stage, .project") || element;

            parent.addEventListener("pointermove", (event) => {
                if (event.pointerType !== "mouse") return;
                const bounds = parent.getBoundingClientRect();
                const px = (event.clientX - bounds.left) / bounds.width - 0.5;
                const py = (event.clientY - bounds.top) / bounds.height - 0.5;
                const distance = parent.classList.contains("hero-stage") ? 5 : 3.5;
                element.style.transform = `rotateX(${(-py * distance).toFixed(2)}deg) rotateY(${(px * distance).toFixed(2)}deg)`;
            }, { signal });

            parent.addEventListener("pointerleave", () => {
                element.style.transform = "";
            }, { signal });
        });
    };

    bindTilt();
    reducedQuery.addEventListener("change", bindTilt);

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const name = String(data.get("name") || "").trim();
        const email = String(data.get("email") || "").trim();
        const message = String(data.get("message") || "").trim();

        if (!name || !email || !message) {
            if (formStatus) formStatus.textContent = "Add your name, email, and a message.";
            return;
        }

        const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
        const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
        if (formStatus) formStatus.textContent = "Opening your email app.";
        window.location.href = `mailto:jacksongreenh@gmail.com?subject=${subject}&body=${body}`;
    });
})();
