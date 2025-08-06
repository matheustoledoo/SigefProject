// src/toast.js
export function showToast(message, duration = 1600) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "16px";
  toast.style.right = "16px";
  toast.style.background = "#222";
  toast.style.color = "#fff";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 14px rgba(0,0,0,0.3)";
  toast.style.zIndex = 9999;
  toast.style.fontSize = "14px";
  toast.style.maxWidth = "320px";
  toast.style.wordBreak = "break-word";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    };
  }, duration);
}
