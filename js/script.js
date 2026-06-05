document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("#year");
  const themeToggle = document.querySelector("#themeToggle");
  const themeIcon = document.querySelector(".theme-icon");
  const themeLabel = document.querySelector("#themeLabel");
  const menuToggle = document.querySelector("#menuToggle");
  const savedTheme = localStorage.getItem("portfolio-theme");
  const savedMenu = localStorage.getItem("portfolio-menu");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio-theme", theme);

    if (themeIcon) {
      themeIcon.textContent = theme === "dark" ? "\u263E" : "\u2600";
    }

    if (themeLabel) {
      themeLabel.textContent = theme === "dark" ? "Modo oscuro" : "Modo claro";
    }

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "dark");
    }
  };

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  setTheme(savedTheme || (prefersDark ? "dark" : "light"));

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      setTheme(currentTheme === "dark" ? "light" : "dark");
    });
  }

  if (savedMenu === "collapsed") {
    document.body.classList.add("menu-collapsed");
    menuToggle?.setAttribute("aria-pressed", "true");
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const isCollapsed = document.body.classList.toggle("menu-collapsed");
      localStorage.setItem("portfolio-menu", isCollapsed ? "collapsed" : "expanded");
      menuToggle.setAttribute("aria-pressed", String(isCollapsed));
    });
  }

  setupGroupsMultiItemCarousel();
  setupRevealBlocks();
  setupGearCanvas();
});

function setupRevealBlocks() {
  const blocks = document.querySelectorAll(
    ".section-heading, .info-card, .project-card, .paper-card, .group-card, .timeline-item, .repo-panel, .chips span, .goals-list article, .contact-panel, .profile-panel"
  );

  blocks.forEach((block, index) => {
    block.classList.add("reveal-block");
    block.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 70}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  blocks.forEach((block) => observer.observe(block));
}

function setupGroupsMultiItemCarousel() {
  const carousel = document.querySelector("#groupsCarousel");

  if (!carousel) {
    return;
  }

  const items = [...carousel.querySelectorAll(".carousel-item")];
  const visibleCards = () => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      return 1;
    }

    if (window.matchMedia("(max-width: 1180px)").matches) {
      return 2;
    }

    return 3;
  };

  const rebuildSlides = () => {
    const count = visibleCards();

    items.forEach((item, index) => {
      const originalCard = item.querySelector(".group-card");

      if (!originalCard) {
        return;
      }

      const content = document.createElement("div");
      content.className = "carousel-item-content";
      content.appendChild(originalCard.cloneNode(true));

      for (let offset = 1; offset < count; offset += 1) {
        const nextItem = items[(index + offset) % items.length];
        const nextCard = nextItem.querySelector(".group-card");

        if (nextCard) {
          const clone = nextCard.cloneNode(true);
          clone.classList.add("group-card-clone");
          content.appendChild(clone);
        }
      }

      item.replaceChildren(content);
    });
  };

  rebuildSlides();
  window.addEventListener("resize", rebuildSlides);
}

function setupGearCanvas() {
  const canvas = document.querySelector("#gearCanvas");

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero-section");
  const dragSurface = hero || canvas;
  const gears = [];
  const pointer = { x: 0, y: 0, active: false, lastMove: 0 };
  let draggedGear = null;
  let animationId = null;

  const random = (min, max) => Math.random() * (max - min) + min;

  const getThemeColors = () => {
    const styles = getComputedStyle(document.documentElement);

    return {
      primary: styles.getPropertyValue("--color-primary").trim() || "#8b4fd6",
      accent: styles.getPropertyValue("--color-accent").trim() || "#c77dff",
      border: styles.getPropertyValue("--color-border").trim() || "#e7d8f4",
      surface: styles.getPropertyValue("--color-surface").trim() || "#ffffff",
    };
  };

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (gears.length === 0) {
      createGears(rect.width, rect.height);
    }
  };

  const createGears = (width, height) => {
    const amount = width < 700 ? 7 : 11;

    for (let i = 0; i < amount; i += 1) {
      const radius = random(26, 58);

      gears.push({
        x: random(radius, width - radius),
        y: random(radius, height - radius),
        vx: random(-0.35, 0.35),
        vy: random(-0.3, 0.3),
        radius,
        teeth: Math.round(random(9, 15)),
        angle: random(0, Math.PI * 2),
        spin: random(-0.008, 0.008),
      });
    }
  };

  const getPointerPosition = (event) => {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const drawGear = (gear, colors) => {
    const innerRadius = gear.radius * 0.44;
    const rootRadius = gear.radius * 0.78;
    const outerRadius = gear.radius;
    const steps = gear.teeth * 2;

    ctx.save();
    ctx.translate(gear.x, gear.y);
    ctx.rotate(gear.angle);
    ctx.beginPath();

    for (let i = 0; i < steps; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : rootRadius;
      const theta = (Math.PI * 2 * i) / steps;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fillStyle = colors.surface;
    ctx.globalAlpha = 0.48;
    ctx.fill();
    ctx.globalAlpha = 0.86;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.stroke();

    ctx.restore();
  };

  const keepInside = (gear, width, height) => {
    if (gear.x < gear.radius) {
      gear.x = gear.radius;
      gear.vx *= -0.8;
    }

    if (gear.x > width - gear.radius) {
      gear.x = width - gear.radius;
      gear.vx *= -0.8;
    }

    if (gear.y < gear.radius) {
      gear.y = gear.radius;
      gear.vy *= -0.8;
    }

    if (gear.y > height - gear.radius) {
      gear.y = height - gear.radius;
      gear.vy *= -0.8;
    }
  };

  const pushFromPointer = (gear) => {
    if ((!pointer.active && performance.now() - pointer.lastMove > 650) || draggedGear === gear) {
      return;
    }

    const dx = gear.x - pointer.x;
    const dy = gear.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const influence = gear.radius + 145;

    if (distance > 0 && distance < influence) {
      const force = (influence - distance) / influence;
      gear.vx += (dx / distance) * force * 0.34;
      gear.vy += (dy / distance) * force * 0.34;
      gear.spin += force * 0.0007 * Math.sign(dx || 1);
    }
  };

  const separateGears = () => {
    for (let i = 0; i < gears.length; i += 1) {
      for (let j = i + 1; j < gears.length; j += 1) {
        const first = gears[i];
        const second = gears[j];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy) || 1;
        const minimum = (first.radius + second.radius) * 0.72;

        if (distance < minimum) {
          const force = (minimum - distance) / minimum;
          const nx = dx / distance;
          const ny = dy / distance;

          first.vx -= nx * force * 0.08;
          first.vy -= ny * force * 0.08;
          second.vx += nx * force * 0.08;
          second.vy += ny * force * 0.08;
        }
      }
    }
  };

  const animate = () => {
    const rect = canvas.getBoundingClientRect();
    const colors = getThemeColors();

    ctx.clearRect(0, 0, rect.width, rect.height);

    separateGears();

    gears.forEach((gear) => {
      if (draggedGear !== gear) {
        pushFromPointer(gear);
        gear.x += gear.vx;
        gear.y += gear.vy;
        gear.vx *= 0.992;
        gear.vy *= 0.992;
        gear.angle += gear.spin + gear.vx * 0.004;
        keepInside(gear, rect.width, rect.height);
      }

      drawGear(gear, colors);
    });

    animationId = requestAnimationFrame(animate);
  };

  const updatePointer = (event) => {
    const position = getPointerPosition(event);

    pointer.active = true;
    pointer.lastMove = performance.now();
    pointer.x = position.x;
    pointer.y = position.y;

    return position;
  };

  dragSurface.addEventListener("pointerdown", (event) => {
    if (event.target.closest("a, button")) {
      return;
    }

    const position = updatePointer(event);

    draggedGear = gears
      .slice()
      .reverse()
      .find((gear) => Math.hypot(gear.x - position.x, gear.y - position.y) <= gear.radius);

    if (draggedGear) {
      draggedGear.vx = 0;
      draggedGear.vy = 0;
      dragSurface.setPointerCapture?.(event.pointerId);
    }
  });

  hero?.addEventListener("pointermove", (event) => {
    const position = updatePointer(event);

    if (draggedGear) {
      draggedGear.vx = (position.x - draggedGear.x) * 0.12;
      draggedGear.vy = (position.y - draggedGear.y) * 0.12;
      draggedGear.x = position.x;
      draggedGear.y = position.y;
    }
  });

  hero?.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("pointerup", (event) => {
    pointer.active = false;

    if (draggedGear) {
      draggedGear.vx *= 0.5;
      draggedGear.vy *= 0.5;
      draggedGear = null;
      if (dragSurface.hasPointerCapture?.(event.pointerId)) {
        dragSurface.releasePointerCapture(event.pointerId);
      }
    }
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  animate();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    } else if (!document.hidden && !animationId) {
      animate();
    }
  });
}
