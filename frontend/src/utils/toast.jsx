import toast from "react-hot-toast";
import ToastBody from "../components/ToastBody";

const showToast = (type, title, message = "") =>
  toast.custom((toastItem) => (
    <ToastBody
      type={type}
      title={title}
      message={message}
      toastId={toastItem.id}
      visible={toastItem.visible}
    />
  ), {
    duration: type === "success" ? 4800 : 4200,
    position: "top-right",
  });

export const showSuccessToast = (title, message = "") => showToast("success", title, message);

export const showErrorToast = (title, message = "") => showToast("error", title, message);
