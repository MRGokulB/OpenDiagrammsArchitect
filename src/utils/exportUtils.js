const replaceForeignObjectsWithText = (clonedSvg, liveSvg) => {
  const clonedFOs = Array.from(clonedSvg.querySelectorAll("foreignObject"));
  const liveFOs = Array.from(liveSvg.querySelectorAll("foreignObject"));
  const ns = "http://www.w3.org/2000/svg";

  clonedFOs.forEach((fo, idx) => {
    const liveFO = liveFOs[idx];
    const x = parseFloat(fo.getAttribute("x")) || 0;
    const y = parseFloat(fo.getAttribute("y")) || 0;
    const w = parseFloat(fo.getAttribute("width")) || 100;
    const h = parseFloat(fo.getAttribute("height")) || 30;

    const rawHtml = fo.innerHTML || "";
    const lines = rawHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      fo.remove();
      return;
    }

    let fillColor = "#333333";
    let fontFamily = "arial, helvetica, sans-serif";
    let fontSize = 14;
    let fontWeight = "normal";

    if (liveFO) {
      const innerEl =
        liveFO.querySelector(".nodeLabel") ||
        liveFO.querySelector(".edgeLabel") ||
        liveFO.querySelector("span") ||
        liveFO.querySelector("div") ||
        liveFO;
      try {
        const computed = window.getComputedStyle(innerEl);
        fillColor = computed.color || fillColor;
        fontFamily = computed.fontFamily || fontFamily;
        const parsedSize = parseFloat(computed.fontSize);
        if (parsedSize > 0) fontSize = parsedSize;
        fontWeight = computed.fontWeight || fontWeight;
      } catch {}
    }

    const lineHeight = fontSize * 1.35;
    const totalTextHeight = lines.length * lineHeight;
    const textStartY = y + (h - totalTextHeight) / 2 + fontSize * 0.85;

    const textEl = document.createElementNS(ns, "text");
    textEl.setAttribute("x", String(x + w / 2));
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute(
      "style",
      `fill:${fillColor};font-family:${fontFamily};font-size:${fontSize}px;font-weight:${fontWeight};`
    );

    lines.forEach((line, lineIdx) => {
      const tspan = document.createElementNS(ns, "tspan");
      tspan.setAttribute("x", String(x + w / 2));
      tspan.setAttribute("y", String(textStartY + lineIdx * lineHeight));
      tspan.textContent = line;
      textEl.appendChild(tspan);
    });

    fo.parentNode.replaceChild(textEl, fo);
  });
};

export const renderSvgToPngBase64 = (svgString, theme = "dark") => {
  return new Promise((resolve, reject) => {
    try {
      const liveContainer = document.querySelector(".preview-container");
      const liveSvg =
        liveContainer?.querySelector('svg[id^="mermaid-svg"]') ||
        liveContainer?.querySelector("svg[aria-roledescription]") ||
        liveContainer?.querySelector('svg[id^="mermaid"]');
      if (!liveSvg) return reject(new Error("No rendered SVG found in preview"));

      const clonedSvg = liveSvg.cloneNode(true);

      replaceForeignObjectsWithText(clonedSvg, liveSvg);

      const svgId = liveSvg.getAttribute("id");
      let externalCSS = "";
      document.querySelectorAll("style").forEach((styleEl) => {
        try {
          if (!styleEl.sheet) return;
          Array.from(styleEl.sheet.cssRules).forEach((rule) => {
            const text = rule.cssText;
            if (svgId && text.includes(`#${svgId}`)) {
              externalCSS += text + "\n";
            }
          });
        } catch {}
      });

      const existingStyles = Array.from(clonedSvg.querySelectorAll("style"));
      let internalCSS = existingStyles.map((s) => s.textContent).join("\n");

      const ns = "http://www.w3.org/2000/svg";
      let defsEl = clonedSvg.querySelector("defs");
      if (!defsEl) {
        defsEl = document.createElementNS(ns, "defs");
        clonedSvg.prepend(defsEl);
      }

      if (externalCSS) {
        const extStyleEl = document.createElementNS(ns, "style");
        extStyleEl.textContent = externalCSS;
        defsEl.appendChild(extStyleEl);
      }

      const markerEls = clonedSvg.querySelectorAll(
        "marker path, marker polygon, marker circle"
      );
      const liveMarkerEls = liveSvg.querySelectorAll(
        "marker path, marker polygon, marker circle"
      );
      const markerCount = Math.min(markerEls.length, liveMarkerEls.length);
      for (let i = 0; i < markerCount; i++) {
        try {
          const computed = window.getComputedStyle(liveMarkerEls[i]);
          const fill = computed.getPropertyValue("fill");
          const stroke = computed.getPropertyValue("stroke");
          let styleStr = "";
          if (fill) styleStr += `fill:${fill};`;
          if (stroke) styleStr += `stroke:${stroke};`;
          if (styleStr) {
            const existing = markerEls[i].getAttribute("style") || "";
            markerEls[i].setAttribute("style", existing + styleStr);
          }
        } catch {}
      }

      const edgePaths = clonedSvg.querySelectorAll(".edge-pattern-dotted, .edge-pattern-dashed, path.path");
      const liveEdgePaths = liveSvg.querySelectorAll(".edge-pattern-dotted, .edge-pattern-dashed, path.path");
      const edgeCount = Math.min(edgePaths.length, liveEdgePaths.length);
      for (let i = 0; i < edgeCount; i++) {
        try {
          const computed = window.getComputedStyle(liveEdgePaths[i]);
          const stroke = computed.getPropertyValue("stroke");
          const strokeWidth = computed.getPropertyValue("stroke-width");
          const strokeDasharray = computed.getPropertyValue("stroke-dasharray");
          let styleStr = "";
          if (stroke) styleStr += `stroke:${stroke};`;
          if (strokeWidth) styleStr += `stroke-width:${strokeWidth};`;
          if (strokeDasharray && strokeDasharray !== "none") styleStr += `stroke-dasharray:${strokeDasharray};`;
          if (styleStr) {
            const existing = liveEdgePaths[i].getAttribute("style") || "";
            edgePaths[i].setAttribute("style", existing + styleStr);
          }
        } catch {}
      }

      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

      let width, height;
      const bbox = liveSvg.getBBox?.();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        const padding = 40;
        width = bbox.width + padding * 2;
        height = bbox.height + padding * 2;
        clonedSvg.setAttribute(
          "viewBox",
          `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`
        );
      } else {
        width = parseFloat(clonedSvg.getAttribute("width")) || 800;
        height = parseFloat(clonedSvg.getAttribute("height")) || 600;
        const viewBox = clonedSvg.getAttribute("viewBox");
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts[2] && parts[3]) {
            width = parts[2];
            height = parts[3];
          }
        }
      }

      const scale = 2;
      const cW = Math.min(Math.round(width * scale), 8192);
      const cH = Math.min(Math.round(height * scale), 8192);
      clonedSvg.setAttribute("width", String(cW));
      clonedSvg.setAttribute("height", String(cH));

      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(clonedSvg);
      const base64Svg = btoa(unescape(encodeURIComponent(svgData)));
      const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

      const canvas = document.createElement("canvas");
      canvas.width = cW;
      canvas.height = cH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = theme === "dark" ? "#121214" : "#ffffff";
      ctx.fillRect(0, 0, cW, cH);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, cW, cH);
        try {
          resolve(canvas.toDataURL("image/png"));
        } catch {
          reject(new Error("PNG export failed — canvas tainted"));
        }
      };
      img.onerror = () => reject(new Error("SVG render to image failed"));
      img.src = dataUri;
    } catch (err) {
      reject(new Error("SVG processing failed: " + err.message));
    }
  });
};
