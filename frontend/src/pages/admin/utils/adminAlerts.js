import Swal from "sweetalert2";
import { showErrorToast, showSuccessToast } from "../../../utils/toast";

export const showAdminSuccess = (title, text = "") => showSuccessToast(title, text);

export const showAdminError = (title, text = "") => showErrorToast(title, text);

export const confirmAdminAction = ({
  title,
  text,
  confirmButtonText = "Yes, continue",
  confirmButtonColor = "#dc2626",
}) =>
  Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    confirmButtonColor,
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });
