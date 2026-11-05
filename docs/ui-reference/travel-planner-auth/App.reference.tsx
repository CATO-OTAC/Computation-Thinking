import { FormEvent, ReactNode, useState } from "react"

type Screen = "login" | "register" | "forgot" | "reset"
type FormErrors = Record<string, string>

const travelPhoto =
  "https://images.unsplash.com/photo-1504681869696-d977211a5f4c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1600"

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  )
}

function PlaneMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="m4 13.5 16-9-6.8 15-2.1-5.2L4 13.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="m11.1 14.3 3.6-4.4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  )
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="brand"
      aria-label="Travel Planner - Đăng nhập"
      onClick={onClick}
    >
      <PlaneMark />
      <span>
        Travel <strong>Planner</strong>
      </span>
    </button>
  )
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16 10H4m0 0 5-5m-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="m5 10 3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      {hidden && (
        <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.7" />
      )}
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6.5v4M10 13.5h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6v4.3l2.8 1.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === "password"

  return (
    <div className={`field-group ${error ? "has-error" : ""}`}>
      <label htmlFor={name}>{label}</label>
      <div className="input-wrap">
        <input
          id={name}
          name={name}
          type={isPassword && visible ? "text" : type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="eye-button"
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() => setVisible(!visible)}
          >
            <EyeIcon hidden={visible} />
          </button>
        )}
      </div>
      {error && (
        <p className="field-error" id={`${name}-error`}>
          <AlertIcon /> {error}
        </p>
      )}
    </div>
  )
}

function PrimaryButton({
  children,
  loading,
}: {
  children: ReactNode
  loading?: boolean
}) {
  return (
    <button className="primary-button" type="submit" disabled={loading}>
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          Đang xử lý...
        </>
      ) : (
        children
      )}
    </button>
  )
}

function SuccessNotice({ children }: { children: ReactNode }) {
  return (
    <div className="notice success-notice" role="status">
      <span className="notice-icon">
        <CheckIcon />
      </span>
      <div>{children}</div>
    </div>
  )
}

function AuthShell({
  children,
  screen,
  onNavigate,
}: {
  children: ReactNode
  screen: Screen
  onNavigate: (screen: Screen) => void
}) {
  return (
    <main className="app-shell" data-frame-name={`Authentication / ${screen}`}>
      <section className="auth-panel" aria-label="Biểu mẫu xác thực">
        <header className="mobile-header">
          <Brand onClick={() => onNavigate("login")} />
        </header>
        <div className="form-container">{children}</div>
        <p className="footer-copy">
          © 2025 Travel Planner · Bảo mật &amp; riêng tư
        </p>
      </section>

      <aside className="visual-panel" aria-label="Cảm hứng du lịch">
        <img
          src={travelPhoto}
          alt="Bờ biển xanh nhìn từ trên cao"
          fetchPriority="high"
        />
        <div className="image-wash" />
        <div className="visual-top">
          <Brand onClick={() => onNavigate("login")} />
        </div>
        <div className="visual-copy">
          <p className="eyebrow">HÀNH TRÌNH BẮT ĐẦU TỪ ĐÂY</p>
          <h2>
            Lên kế hoạch dễ dàng.
            <br />
            Tận hưởng trọn vẹn.
          </h2>
          <p>
            Từ lịch trình đến những trải nghiệm đáng nhớ — mọi chuyến đi của bạn
            đều được chuẩn bị chu đáo.
          </p>
          <div className="trust-note">
            <span>
              <CheckIcon />
            </span>
            <p>
              <strong>Hơn 25.000 hành trình</strong>
              <br />
              đã được tạo cùng Travel Planner
            </p>
          </div>
        </div>
      </aside>
    </main>
  )
}

function LoginForm({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!email.includes("@"))
      nextErrors.email = "Vui lòng nhập địa chỉ email hợp lệ."
    if (!password) nextErrors.password = "Vui lòng nhập mật khẩu của bạn."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1300)
  }

  return (
    <div className="form-view" data-frame-name="01 / Đăng nhập">
      <div className="heading-block">
        <span className="mini-kicker">TRAVEL PLANNER</span>
        <h1>Chào mừng trở lại</h1>
        <p>Đăng nhập để tiếp tục hành trình của bạn.</p>
      </div>
      <form onSubmit={submit} noValidate>
        <Field
          label="Email"
          name="login-email"
          type="email"
          placeholder="ban@example.com"
          autoComplete="email"
          value={email}
          onChange={(value) => {
            setEmail(value)
            setErrors({ ...errors, email: "" })
          }}
          error={errors.email}
        />
        <Field
          label="Mật khẩu"
          name="login-password"
          type="password"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setErrors({ ...errors, password: "" })
          }}
          error={errors.password}
        />
        <div className="form-options">
          <label className="check-label">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="custom-check">
              <CheckIcon />
            </span>
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            className="text-link"
            onClick={() => onNavigate("forgot")}
          >
            Quên mật khẩu?
          </button>
        </div>
        <PrimaryButton loading={loading}>Đăng nhập</PrimaryButton>
      </form>
      <p className="switch-copy">
        Chưa có tài khoản?{" "}
        <button
          type="button"
          className="text-link"
          onClick={() => onNavigate("register")}
        >
          Đăng ký ngay
        </button>
      </p>
    </div>
  )
}

function RegisterForm({
  onNavigate,
}: {
  onNavigate: (screen: Screen) => void
}) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function setValue(key: keyof typeof values, value: string) {
    setValues({ ...values, [key]: value })
    setErrors({ ...errors, [key]: "" })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (values.name.trim().length < 2)
      nextErrors.name = "Vui lòng nhập họ và tên."
    if (!values.email.includes("@"))
      nextErrors.email = "Email chưa đúng định dạng."
    if (!isStrongPassword(values.password))
      nextErrors.password =
        "Dùng ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số."
    if (values.confirm !== values.password)
      nextErrors.confirm = "Mật khẩu xác nhận chưa khớp."
    if (!agreed)
      nextErrors.agreed = "Bạn cần đồng ý với điều khoản để tiếp tục."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1200)
  }

  return (
    <div className="form-view compact" data-frame-name="02 / Đăng ký">
      <div className="heading-block">
        <span className="mini-kicker">BẮT ĐẦU HÀNH TRÌNH</span>
        <h1>Tạo tài khoản</h1>
        <p>Lưu trữ và quản lý mọi kế hoạch du lịch của bạn.</p>
      </div>
      {success && (
        <SuccessNotice>
          <strong>Tài khoản đã được tạo!</strong>
          <p>Bạn có thể đăng nhập và bắt đầu lên kế hoạch.</p>
          <button
            type="button"
            className="notice-link"
            onClick={() => onNavigate("login")}
          >
            Đến đăng nhập
          </button>
        </SuccessNotice>
      )}
      <form onSubmit={submit} noValidate>
        <Field
          label="Họ và tên"
          name="name"
          placeholder="Nguyễn Minh Anh"
          autoComplete="name"
          value={values.name}
          onChange={(v) => setValue("name", v)}
          error={errors.name}
        />
        <Field
          label="Email"
          name="register-email"
          type="email"
          placeholder="ban@example.com"
          autoComplete="email"
          value={values.email}
          onChange={(v) => setValue("email", v)}
          error={errors.email}
        />
        <div className="two-fields">
          <Field
            label="Mật khẩu"
            name="register-password"
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            value={values.password}
            onChange={(v) => setValue("password", v)}
            error={errors.password}
          />
          <Field
            label="Xác nhận mật khẩu"
            name="confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            value={values.confirm}
            onChange={(v) => setValue("confirm", v)}
            error={errors.confirm}
          />
        </div>
        <p className="password-hint">
          Dùng ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.
        </p>
        <label
          className={`check-label terms ${errors.agreed ? "check-error" : ""}`}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              setErrors({ ...errors, agreed: "" })
            }}
          />
          <span className="custom-check">
            <CheckIcon />
          </span>
          <span>
            Tôi đồng ý với{" "}
            <span className="terms-reference">Điều khoản sử dụng</span> và{" "}
            <span className="terms-reference">Chính sách quyền riêng tư</span>.
          </span>
        </label>
        {errors.agreed && (
          <p className="field-error terms-error">
            <AlertIcon /> {errors.agreed}
          </p>
        )}
        <PrimaryButton loading={loading}>Tạo tài khoản</PrimaryButton>
      </form>
      <p className="switch-copy">
        Đã có tài khoản?{" "}
        <button
          type="button"
          className="text-link"
          onClick={() => onNavigate("login")}
        >
          Đăng nhập
        </button>
      </p>
    </div>
  )
}

function ForgotForm({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function sendLink() {
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 1100)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.")
      return
    }
    sendLink()
  }

  if (sent) {
    return (
      <div
        className="form-view forgot-view forgot-sent-view"
        data-frame-name="03B / Quên mật khẩu - Đã gửi email"
      >
        <button
          type="button"
          className="back-link"
          onClick={() => onNavigate("login")}
        >
          <ArrowLeft /> Quay lại đăng nhập
        </button>

        <div className="forgot-hero-icon success-mail-icon">
          <MailIcon />
          <span className="mail-check">
            <CheckIcon />
          </span>
        </div>

        <div className="forgot-heading">
          <span className="mini-kicker">ĐÃ GỬI THÀNH CÔNG</span>
          <h1>Hãy kiểm tra email</h1>
          <p>Chúng tôi vừa gửi hướng dẫn đặt lại mật khẩu đến địa chỉ:</p>
        </div>

        <div className="email-receipt">
          <MailIcon />
          <strong>{email}</strong>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => onNavigate("reset")}
        >
          Mở liên kết đặt lại
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={loading}
          onClick={sendLink}
        >
          {loading ? (
            <>
              <span className="spinner blue-spinner" aria-hidden="true" />
              Đang gửi lại...
            </>
          ) : (
            "Gửi lại email"
          )}
        </button>

        <div className="delivery-help">
          <ClockIcon />
          <p>
            Liên kết có hiệu lực trong 15 phút. Nếu chưa thấy email, hãy kiểm
            tra thư rác hoặc thử gửi lại.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="form-view forgot-view"
      data-frame-name="03A / Quên mật khẩu"
    >
      <button
        type="button"
        className="back-link"
        onClick={() => onNavigate("login")}
      >
        <ArrowLeft /> Quay lại đăng nhập
      </button>

      <div className="forgot-hero-icon">
        <MailIcon />
        <span className="icon-spark" />
      </div>

      <div className="heading-block forgot-heading">
        <span className="mini-kicker">KHÔI PHỤC TÀI KHOẢN</span>
        <h1>Bạn quên mật khẩu?</h1>
        <p>
          Nhập email đã đăng ký. Chúng tôi sẽ gửi cho bạn một liên kết an toàn
          để tạo mật khẩu mới.
        </p>
      </div>

      <form onSubmit={submit} noValidate>
        <Field
          label="Địa chỉ email"
          name="forgot-email"
          type="email"
          placeholder="ban@example.com"
          autoComplete="email"
          value={email}
          onChange={(v) => {
            setEmail(v)
            setError("")
          }}
          error={error}
        />
        <PrimaryButton loading={loading}>Gửi liên kết đặt lại</PrimaryButton>
      </form>

      <div className="privacy-note">
        <span>
          <CheckIcon />
        </span>
        <p>
          Vì sự an toàn của bạn, chúng tôi sẽ không thông báo email có tồn tại
          trong hệ thống hay không.
        </p>
      </div>
    </div>
  )
}

function ResetForm({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!isStrongPassword(password))
      nextErrors.password =
        "Mật khẩu cần đủ 8 ký tự, chữ hoa, chữ thường và số."
    if (confirm !== password)
      nextErrors.confirm = "Mật khẩu xác nhận chưa khớp."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1200)
  }

  if (success) {
    return (
      <div
        className="form-view success-view"
        data-frame-name="04B / Đặt lại mật khẩu - Thành công"
      >
        <div className="success-badge">
          <CheckIcon />
        </div>
        <span className="mini-kicker">HOÀN TẤT</span>
        <h1>Mật khẩu đã được cập nhật</h1>
        <p>
          Mật khẩu mới của bạn đã được lưu an toàn. Bây giờ bạn có thể đăng nhập
          để tiếp tục hành trình.
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={() => onNavigate("login")}
        >
          Đến đăng nhập
        </button>
      </div>
    )
  }

  const checks = [
    { label: "Ít nhất 8 ký tự", pass: password.length >= 8 },
    {
      label: "Có chữ hoa và chữ thường",
      pass: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    { label: "Có ít nhất một chữ số", pass: /\d/.test(password) },
  ]

  return (
    <div className="form-view" data-frame-name="04A / Đặt lại mật khẩu">
      <div className="heading-block">
        <span className="mini-kicker">BẢO MẬT TÀI KHOẢN</span>
        <h1>Tạo mật khẩu mới</h1>
        <p>Mật khẩu mới cần khác với mật khẩu bạn đã sử dụng trước đây.</p>
      </div>
      <form onSubmit={submit} noValidate>
        <Field
          label="Mật khẩu mới"
          name="new-password"
          type="password"
          placeholder="Nhập mật khẩu mới"
          autoComplete="new-password"
          value={password}
          onChange={(v) => {
            setPassword(v)
            setErrors({ ...errors, password: "" })
          }}
          error={errors.password}
        />
        <div className="requirements">
          <p>Mật khẩu của bạn cần:</p>
          <div className="requirement-grid">
            {checks.map((item) => (
              <span className={item.pass ? "passed" : ""} key={item.label}>
                <CheckIcon /> {item.label}
              </span>
            ))}
          </div>
        </div>
        <Field
          label="Xác nhận mật khẩu mới"
          name="new-password-confirm"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v)
            setErrors({ ...errors, confirm: "" })
          }}
          error={errors.confirm}
        />
        <PrimaryButton loading={loading}>Cập nhật mật khẩu</PrimaryButton>
      </form>
      <button
        type="button"
        className="back-link centered"
        onClick={() => onNavigate("login")}
      >
        <ArrowLeft /> Quay lại đăng nhập
      </button>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login")

  function navigate(next: Screen) {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <AuthShell screen={screen} onNavigate={navigate}>
      {screen === "login" && <LoginForm onNavigate={navigate} />}
      {screen === "register" && <RegisterForm onNavigate={navigate} />}
      {screen === "forgot" && <ForgotForm onNavigate={navigate} />}
      {screen === "reset" && <ResetForm onNavigate={navigate} />}
    </AuthShell>
  )
}
