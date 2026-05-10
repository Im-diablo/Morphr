import React from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import LiquidGlass from "./LiquidGlass";

// ── File type meta ────────────────────────────────────────────────────────────
const FILE_TYPE_META = {
  tex: { label: "LaTeX", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "⟨/⟩" },
  pdf: { label: "PDF",   color: "text-red-400",  bg: "bg-red-500/10",  border: "border-red-500/20",  icon: "⬛" },
  docx:{ label: "DOCX",  color: "text-sky-400",  bg: "bg-sky-500/10",  border: "border-sky-500/20",  icon: "W"  },
};

function getFileMeta(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_TYPE_META[ext] || FILE_TYPE_META.tex;
}

export default function UploadZone({ onUpload, uploadedFile, error }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/x-tex":  [".tex"],
      "application/pdf":    [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted.length > 0) onUpload(accepted[0]);
    },
  });
  const isUploaded = !!uploadedFile;
  const fileMeta = isUploaded ? getFileMeta(uploadedFile.name) : null;

  return (
    <LiquidGlass
      intensity={isDragActive ? "strong" : "medium"}
      shadow
      className="w-full p-0 cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        {...getRootProps()}
        id="upload-zone"
        className={`relative p-8 text-center transition-all duration-500 border-2 border-dashed
          ${
            isUploaded
              ? "border-green-500/40 bg-green-500/[0.03]"
              : isDragActive
                ? "border-gold/50 bg-gold/[0.03]"
                : "border-gold/15 hover:border-gold/30 hover:bg-white/[0.025]"
          }`}
        style={{ minHeight: "180px" }}
      >
        <input {...getInputProps()} />
        {!isUploaded && !isDragActive && (
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        )}

        {isUploaded ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 py-3"
          >
            {/* File type badge */}
            <div className={`w-14 h-14 rounded-2xl ${fileMeta.bg} border ${fileMeta.border} flex items-center justify-center`}>
              <span className={`text-xl font-bold font-mono ${fileMeta.color}`}>
                {fileMeta.icon}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md ${fileMeta.bg} ${fileMeta.color} border ${fileMeta.border}`}>
                  {fileMeta.label}
                </span>
                <span className="text-green-400/60 text-[9px] font-mono">✓ ready</span>
              </div>
              <p className="text-green-400 font-mono text-sm font-semibold">
                {uploadedFile.name}
              </p>
              <p className="text-text-dim text-[10px] mt-1">
                {(uploadedFile.size / 1024).toFixed(1)} KB — Click or drop to replace
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-3 relative z-10">
            {/* Upload icon */}
            <div className="w-16 h-16 rounded-2xl bg-gold/[0.05] border border-gold/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-text-primary font-mono text-sm">
                {isDragActive ? "Release to upload" : "Drop your resume here"}
              </p>
              <p className="text-text-dim text-[10px] mt-1">or click to browse</p>
            </div>
            {/* Accepted formats row */}
            <div className="flex items-center gap-2 mt-1">
              {Object.entries(FILE_TYPE_META).map(([ext, meta]) => (
                <span
                  key={ext}
                  className={`text-[9px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg ${meta.bg} ${meta.color} border ${meta.border}`}
                >
                  .{ext}
                </span>
              ))}
            </div>
          </div>
        )}
        {error && (
          <p className="text-red-400 text-[11px] mt-3 font-mono">{error}</p>
        )}
      </motion.div>
    </LiquidGlass>
  );
}
