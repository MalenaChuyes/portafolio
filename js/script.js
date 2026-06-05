document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("#year");
  const themeToggle = document.querySelector("#themeToggle");
  const themeIcon = document.querySelector(".theme-icon");
  const themeLabel = document.querySelector("#themeLabel");
  const savedTheme = localStorage.getItem("portfolio-theme");
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

  setupRevealBlocks();
  setupGearCanvas();
});

function setupRevealBlocks() {
  const blocks = document.querySelectorAll(
    ".section-heading, .info-card, .project-card, .paper-card, .timeline-item, .repo-panel, .chips span, .goals-list article, .contact-panel, .profile-panel"
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

function setupGearCanvas() {
  const canvas = document.querySelector("#gearCanvas");

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const gears = [];
  const pointer = { x: 0, y: 0, active: false };
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
    if (!pointer.active || draggedGear === gear) {
      return;
    }

    const dx = gear.x - pointer.x;
    const dy = gear.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const influence = gear.radius + 95;

    if (distance > 0 && distance < influence) {
      const force = (influence - distance) / influence;
      gear.vx += (dx / distance) * force * 0.22;
      gear.vy += (dy / distance) * force * 0.22;
    }
  };

  const animate = () => {
    const rect = canvas.getBoundingClientRect();
    const colors = getThemeColors();

    ctx.clearRect(0, 0, rect.width, rect.height);

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

  canvas.addEventListener("pointerdown", (event) => {
    const position = getPointerPosition(event);

    pointer.active = true;
    pointer.x = position.x;
    pointer.y = position.y;
    draggedGear = gears
      .slice()
      .reverse()
      .find((gear) => Math.hypot(gear.x - position.x, gear.y - position.y) <= gear.radius);

    if (draggedGear) {
      draggedGear.vx = 0;
      draggedGear.vy = 0;
      canvas.setPointerCapture(event.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    const position = getPointerPosition(event);

    pointer.active = true;
    pointer.x = position.x;
    pointer.y = position.y;

    if (draggedGear) {
      draggedGear.vx = (position.x - draggedGear.x) * 0.12;
      draggedGear.vy = (position.y - draggedGear.y) * 0.12;
      draggedGear.x = position.x;
      draggedGear.y = position.y;
    }
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  canvas.addEventListener("pointerup", (event) => {
    pointer.active = false;

    if (draggedGear) {
      draggedGear.vx *= 0.5;
      draggedGear.vy *= 0.5;
      draggedGear = null;
      canvas.releasePointerCapture(event.pointerId);
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
