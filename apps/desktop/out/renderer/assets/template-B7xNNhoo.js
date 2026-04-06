import { j as jsxRuntimeExports, T as Text, u as useImage, R as Rect, I as Image, G as Group, M as ManaText } from "./index-BoLiqHQy.js";
function TextField({
  x,
  y,
  width,
  height,
  text,
  fontSize = 16,
  fontFamily = "Geist Sans",
  fontStyle = "normal",
  align = "left",
  fill = "#1a1a1a",
  letterSpacing = 0,
  wrap = "word"
}) {
  const textProps = {
    x,
    y,
    width,
    text,
    fontSize,
    fontFamily,
    fontStyle,
    align,
    fill,
    letterSpacing,
    wrap,
    listening: false
  };
  if (height !== void 0) {
    textProps.height = height;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { ...textProps });
}
function ArtBox({ x, y, width, height, src, cropX = 0, cropY = 0, cropWidth = 1, cropHeight = 1 }) {
  const [image] = useImage(src ?? "", "anonymous");
  if (!image) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Rect,
      {
        x,
        y,
        width,
        height,
        fill: "#2a2a2a",
        stroke: "#444",
        strokeWidth: 1,
        listening: false
      }
    );
  }
  const srcX = cropX * image.width;
  const srcY = cropY * image.height;
  const srcW = cropWidth * image.width;
  const srcH = cropHeight * image.height;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Image,
    {
      x,
      y,
      width,
      height,
      image,
      crop: { x: srcX, y: srcY, width: srcW, height: srcH },
      listening: false
    }
  );
}
function RulesBox({
  x,
  y,
  width,
  height,
  rulesText,
  flavorText,
  fontSize = 14,
  symbolBasePath,
  background = "rgba(255,255,255,0.85)"
}) {
  const padding = 8;
  const innerWidth = width - padding * 2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Group, { x, y, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Rect, { width, height, fill: background, cornerRadius: 2, listening: false }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ManaText,
      {
        x: padding,
        y: padding,
        width: innerWidth,
        text: rulesText,
        fontSize,
        symbolBasePath,
        fill: "#111111"
      }
    ),
    flavorText && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ManaText,
      {
        x: padding,
        y: padding + fontSize * 1.4 * Math.max(1, countLines(rulesText, innerWidth, fontSize)) + 8,
        width: innerWidth,
        text: flavorText,
        fontSize: fontSize - 1,
        symbolBasePath,
        fill: "#333333",
        fontStyle: "italic"
      }
    )
  ] });
}
function countLines(text, width, fontSize) {
  const charsPerLine = Math.floor(width / (fontSize * 0.55));
  return Math.ceil(text.length / charsPerLine) || 1;
}
function PtBox({
  x,
  y,
  power,
  toughness,
  background = "rgba(255,255,255,0.9)",
  textColor = "#111111"
}) {
  const text = `${power}/${toughness}`;
  const boxW = 52;
  const boxH = 24;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Group, { x, y, listening: false, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Rect, { width: boxW, height: boxH, fill: background, cornerRadius: 2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Text,
      {
        width: boxW,
        height: boxH,
        text,
        fontSize: 14,
        fontFamily: "Geist Sans",
        fontStyle: "bold",
        align: "center",
        verticalAlign: "middle",
        fill: textColor
      }
    )
  ] });
}
function isCreature(fields) {
  return fields.type.toLowerCase().includes("creature");
}
function isLand(fields) {
  return fields.type.toLowerCase().includes("land");
}
function frameColor(fields) {
  if (fields.color && fields.color !== "colorless") return fields.color;
  if (isLand(fields)) return "land";
  return "colorless";
}
function typeLine(fields) {
  const parts = [];
  if (fields.supertype) parts.push(fields.supertype);
  if (fields.type) parts.push(fields.type);
  const base = parts.join(" ");
  if (fields.subtype) return `${base} — ${fields.subtype}`;
  return base;
}
const FRAME_COLORS = {
  white: "#f0ede0",
  blue: "#b3c9e3",
  black: "#2d2d2d",
  red: "#e3a07a",
  green: "#7db57d",
  gold: "#d4af37",
  colorless: "#b0b0b0",
  land: "#8fbc8f"
};
const RARITY_COLORS = {
  common: "#b0b0b0",
  uncommon: "#9ec0d3",
  rare: "#d4af37",
  mythic: "#e07840"
};
const BORDER = 24;
const CARD_W = 744;
const CARD_H = 1039;
const ART_X = 57;
const ART_Y = 104;
const ART_W = 630;
const ART_H = 462;
const NAME_X = 57;
const NAME_Y = 52;
const NAME_W = 560;
const MANA_X = 620;
const TYPE_X = 57;
const TYPE_Y = 582;
const TYPE_W = 578;
const RARITY_X = 680;
const RARITY_Y = 582;
const TEXTBOX_X = 57;
const TEXTBOX_Y = 614;
const TEXTBOX_W = 630;
const TEXTBOX_H = 322;
const PT_X = 635;
const PT_Y = 960;
const FOOTER_Y = 1e3;
const FOOTER_X = 57;
function M15Template({ fields: rawFields, assetsPath }) {
  const fields = rawFields;
  const color = frameColor(fields);
  const frameHex = FRAME_COLORS[color];
  const rarityColor = RARITY_COLORS[fields.rarity] ?? RARITY_COLORS["common"];
  const creature = isCreature(fields);
  const land = isLand(fields);
  const typeLineText = typeLine(fields);
  const symbolsPath = `${assetsPath}/symbols`;
  const frameSrc = `${assetsPath}/frame-${color}.svg`;
  const [frameImage] = useImage(frameSrc, "anonymous");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Group, { listening: false, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Rect,
      {
        x: 0,
        y: 0,
        width: CARD_W,
        height: CARD_H,
        fill: "#1a1205",
        cornerRadius: 18
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Rect,
      {
        x: BORDER,
        y: BORDER,
        width: CARD_W - BORDER * 2,
        height: CARD_H - BORDER * 2,
        fill: frameHex,
        cornerRadius: 10
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Rect, { x: NAME_X, y: NAME_Y - 8, width: NAME_W + 100, height: 34, fill: frameHex, cornerRadius: 4 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TextField,
      {
        x: NAME_X + 4,
        y: NAME_Y - 4,
        width: NAME_W,
        text: fields.name || "New Card",
        fontSize: 20,
        fontStyle: "bold",
        fill: color === "black" ? "#e5e7eb" : "#1a1a1a"
      }
    ),
    !land && fields.manaCost && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ManaText,
      {
        x: MANA_X,
        y: NAME_Y - 4,
        width: 100,
        text: fields.manaCost,
        fontSize: 16,
        symbolBasePath: symbolsPath
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ArtBox,
      {
        x: ART_X,
        y: ART_Y,
        width: ART_W,
        height: ART_H,
        src: fields.art ?? null
      }
    ),
    frameImage && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Image,
      {
        x: BORDER,
        y: BORDER,
        width: CARD_W - BORDER * 2,
        height: CARD_H - BORDER * 2,
        image: frameImage,
        listening: false
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Rect, { x: TYPE_X, y: TYPE_Y - 4, width: TYPE_W, height: 28, fill: frameHex, cornerRadius: 4 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TextField,
      {
        x: TYPE_X + 4,
        y: TYPE_Y,
        width: TYPE_W - 8,
        text: typeLineText,
        fontSize: 14,
        fontStyle: "bold",
        fill: color === "black" ? "#e5e7eb" : "#1a1a1a"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Rect, { x: RARITY_X, y: RARITY_Y - 4, width: 20, height: 20, fill: rarityColor, cornerRadius: 10 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RulesBox,
      {
        x: TEXTBOX_X,
        y: TEXTBOX_Y,
        width: TEXTBOX_W,
        height: TEXTBOX_H,
        rulesText: fields.rulesText,
        flavorText: fields.flavorText,
        symbolBasePath: symbolsPath,
        fontSize: 14,
        background: color === "black" ? "rgba(30,30,30,0.9)" : "rgba(240,237,224,0.9)"
      }
    ),
    creature && (fields.power || fields.toughness) && /* @__PURE__ */ jsxRuntimeExports.jsx(
      PtBox,
      {
        x: PT_X,
        y: PT_Y,
        power: fields.power,
        toughness: fields.toughness,
        background: frameHex,
        textColor: color === "black" ? "#e5e7eb" : "#1a1a1a"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Text,
      {
        x: FOOTER_X,
        y: FOOTER_Y,
        width: 400,
        text: fields.artist ? `Illus. ${fields.artist}` : "",
        fontSize: 9,
        fontFamily: "Geist Sans",
        fill: color === "black" ? "#9ca3af" : "#4b5563",
        listening: false
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Text,
      {
        x: CARD_W - BORDER - 60,
        y: FOOTER_Y,
        width: 60,
        text: fields.collectorNumber ? `${fields.collectorNumber}` : "",
        fontSize: 9,
        fontFamily: "Geist Sans",
        align: "right",
        fill: color === "black" ? "#9ca3af" : "#4b5563",
        listening: false
      }
    )
  ] });
}
export {
  M15Template as default
};
