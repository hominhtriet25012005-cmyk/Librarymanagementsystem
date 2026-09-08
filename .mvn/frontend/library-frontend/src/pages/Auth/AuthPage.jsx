import { useState } from "react";
import { Alert, Button, IconButton, InputAdornment, TextField } from "@mui/material";
import { Visibility, VisibilityOff, MenuBook, ArrowBack } from "@mui/icons-material";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authApi } from "../../api/authApi";
import { getApiErrorMessage } from "../../api/httpClient";

const content = {
  login: ["Chào mừng bạn trở lại", "Đăng nhập để tiếp tục hành trình đọc sách.", "Đăng nhập"],
  signup: ["Tạo tài khoản thư viện", "Một tài khoản để lưu sách và quản lý việc mượn đọc.", "Tạo tài khoản"],
  forgot: ["Bạn quên mật khẩu?", "Nhập email đã đăng ký để nhận đường dẫn đặt lại mật khẩu.", "Gửi đường dẫn"],
  reset: ["Đặt lại mật khẩu", "Chọn mật khẩu mới để bảo vệ tài khoản của bạn.", "Lưu mật khẩu mới"],
};

export default function AuthPage({ mode }) {
  const auth = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [title, description, action] = content[mode];
  const hasPassword = mode !== "forgot";
  const hasConfirm = mode === "signup" || mode === "reset";
  const missingToken = mode === "reset" && !token;
  const update = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy || success || missingToken) return;
    const next = {};
    if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Vui lòng nhập email hợp lệ.";
    if (mode === "signup" && !values.fullName.trim()) next.fullName = "Vui lòng nhập họ và tên.";
    if (hasPassword && !values.password) next.password = "Vui lòng nhập mật khẩu.";
    else if (hasConfirm && values.password.length < 8) next.password = "Mật khẩu cần có ít nhất 8 ký tự.";
    if (hasConfirm && values.confirm !== values.password) next.confirm = "Mật khẩu xác nhận chưa khớp.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login") {
        await auth.login({ email: values.email.trim(), password: values.password });
      } else if (mode === "signup") {
        await auth.signup({
          fullName: values.fullName.trim(), email: values.email.trim(),
          phone: values.phone.trim(), password: values.password,
        });
      } else if (mode === "forgot") {
        await authApi.forgotPassword(values.email.trim());
        setSuccess(true);
      } else {
        await authApi.resetPassword(token, values.password);
        auth.logout();
        setValues((current) => ({ ...current, password: "", confirm: "" }));
        setSuccess(true);
      }
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại."));
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <TextField fullWidth id={name} name={name} label={label} value={values[name]}
      onChange={update(name)} error={!!errors[name]} helperText={errors[name]}
      disabled={busy} {...props} />
  );
  const passwordProps = {
    type: visible ? "text" : "password",
    autoComplete: mode === "login" ? "current-password" : "new-password",
    slotProps: { input: { endAdornment: <InputAdornment position="end">
      <IconButton aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setVisible((value) => !value)}
        edge="end" type="button">{visible ? <VisibilityOff /> : <Visibility />}</IconButton>
    </InputAdornment> } },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link to="/books" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <ArrowBack fontSize="small" /> Khám phá kho sách
        </Link>
        <div className="grid overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl md:grid-cols-2">
          <aside className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-800 p-10 text-white md:flex">
            <div className="flex items-center gap-3 text-xl font-bold"><MenuBook /> Thư viện sách</div>
            <div className="py-16">
              <p className="mb-5 text-sm uppercase tracking-widest text-indigo-200">Cùng bạn mở trang mới</p>
              <h2 className="text-4xl font-bold leading-tight">Mỗi cuốn sách,<br />một thế giới mới.</h2>
              <p className="mt-6 leading-relaxed text-indigo-100">Khám phá kho sách, lưu những tựa yêu thích và theo dõi hành trình đọc của bạn tại một nơi.</p>
            </div>
            <p className="text-sm text-indigo-200">Đọc hôm nay, hiểu thêm ngày mai.</p>
          </aside>
          <section className="p-6 sm:p-10">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-600">Tài khoản bạn đọc</p>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mb-7 mt-3 text-slate-600">{description}</p>
            {mode === "login" && auth.notice && <Alert className="mb-4" severity="info">{auth.notice}</Alert>}
            {message && <Alert className="mb-4" severity="error">{message}</Alert>}
            {missingToken ? (
              <Alert severity="warning">Đường dẫn không có mã đặt lại mật khẩu. Vui lòng yêu cầu đường dẫn mới.</Alert>
            ) : success ? (
              <Alert severity="success">{mode === "forgot"
                ? "Đã gửi đường dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư và thư rác; đường dẫn có hiệu lực trong 5 phút."
                : "Đã đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."}</Alert>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-4" aria-label={title}>
                {mode === "signup" && field("fullName", "Họ và tên", { autoComplete: "name", slotProps: { htmlInput: { maxLength: 150 } } })}
                {mode !== "reset" && field("email", "Email", { type: "email", autoComplete: "email", slotProps: { htmlInput: { maxLength: 150 } } })}
                {mode === "signup" && field("phone", "Số điện thoại (không bắt buộc)", { type: "tel", autoComplete: "tel", slotProps: { htmlInput: { maxLength: 30 } } })}
                {hasPassword && field("password", mode === "reset" ? "Mật khẩu mới" : "Mật khẩu", passwordProps)}
                {hasConfirm && field("confirm", "Xác nhận mật khẩu", { type: visible ? "text" : "password", autoComplete: "new-password" })}
                {mode === "login" && <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-indigo-700">Quên mật khẩu?</Link></div>}
                <Button type="submit" variant="contained" fullWidth size="large" disabled={busy}>
                  {busy ? "Đang xử lý..." : action}
                </Button>
              </form>
            )}
            <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
              {mode === "login" && <p>Chưa có tài khoản? <Link to="/signup" state={location.state} className="font-semibold text-indigo-700">Đăng ký ngay</Link></p>}
              {mode === "signup" && <p>Đã có tài khoản? <Link to="/login" state={location.state} className="font-semibold text-indigo-700">Đăng nhập</Link></p>}
              {(mode === "forgot" || mode === "reset") && <p><Link to="/login" className="font-semibold text-indigo-700">Về trang đăng nhập</Link></p>}
              {mode === "reset" && <p><Link to="/forgot-password" className="font-semibold text-indigo-700">Yêu cầu đường dẫn mới</Link></p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
