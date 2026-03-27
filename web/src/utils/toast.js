import { toast } from "react-toastify";

export default function showToast(message, type = "default", opts = {}) {
  if (opts.clear) toast.dismiss();
  if (type === "success") toast.success(message);
  else if (type === "error") toast.error(message);
  else toast(message);
}
