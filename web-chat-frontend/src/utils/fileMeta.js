import {
  AiFillFilePdf,
  AiFillFileWord,
  AiFillFileExcel,
  AiFillFilePpt,
  AiFillFileZip,
  AiFillFileText,
  AiFillFile,
} from "react-icons/ai";

const getExtension = (name = "") => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const FILE_RULES = [
  {
    label: "PDF",
    match: ({ ext, mime }) => ext === "pdf" || mime.includes("application/pdf"),
    Icon: AiFillFilePdf,
    accent: "text-[#c53030]",
  },
  {
    label: "Excel",
    match: ({ ext, mime }) =>
      ["xls", "xlsx", "xlsm", "csv"].includes(ext) || /spreadsheet|excel/.test(mime),
    Icon: AiFillFileExcel,
    accent: "text-[#1c9a6c]",
  },
  {
    label: "Word",
    match: ({ ext, mime }) =>
      ["doc", "docx"].includes(ext) || /msword|wordprocessingml/.test(mime),
    Icon: AiFillFileWord,
    accent: "text-[#2563eb]",
  },
  {
    label: "PowerPoint",
    match: ({ ext, mime }) =>
      ["ppt", "pptx", "key"].includes(ext) || /presentation/.test(mime),
    Icon: AiFillFilePpt,
    accent: "text-[#d97706]",
  },
  {
    label: "Archive",
    match: ({ ext, mime }) =>
      ["zip", "rar", "7z"].includes(ext) || /zip|x-rar|compressed/.test(mime),
    Icon: AiFillFileZip,
    accent: "text-[#b45309]",
  },
  {
    label: "Text",
    match: ({ ext, mime }) =>
      ["txt", "md", "markdown"].includes(ext) || mime.startsWith("text/"),
    Icon: AiFillFileText,
    accent: "text-[#4b5563]",
  },
];

export const pickFileMeta = (mime = "", name = "") => {
  const context = { ext: getExtension(name), mime: (mime || "").toLowerCase() };
  const rule = FILE_RULES.find((r) => r.match(context));
  return (
    rule || {
      label: context.ext?.toUpperCase() || context.mime.split("/").pop()?.toUpperCase() || "FILE",
      Icon: AiFillFile,
      accent: "text-[#374151]",
    }
  );
};