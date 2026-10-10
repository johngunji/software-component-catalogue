/* Password reset and email verification page. */
const $ = (selector) => document.querySelector(selector);
// Return icon markup for the password recovery page.
const icon = (name) => `<i data-lucide="${name}"></i>`;
// Render all Lucide icon placeholders on the page.
const renderIcons = () => window.lucide && lucide.createIcons();
const apiBase =
  localStorage.getItem("componentHub.apiBase") ||
  (["localhost", "127.0.0.1"].includes(location.hostname)
    ? "http://localhost:3000/api"
    : "https://componenthub-backend.onrender.com/api");

document.body.innerHTML = `
  <div class="auth">
    <aside class="auth-side">
      <a class="brand" href="index.html"><span class="logo">${icon("box")}</span><span><b>ComponentHub</b><small>Software Component Catalogue</small></span></a>
      <div>
        <h1>Recover your <em>ComponentHub</em> account.</h1>
        <ul>
          <li>${icon("shield-check")}<span><b>Secure verification</b><br>Confirm your email before changing your password.</span></li>
          <li>${icon("mail")}<span><b>Check your inbox</b><br>We will send a one-time verification code.</span></li>
          <li>${icon("lock-keyhole")}<span><b>Choose a new password</b><br>Get back to your reusable component catalogue.</span></li>
        </ul>
      </div>
      <small>© 2026 ComponentHub · Software Engineering project</small>
    </aside>
    <main class="auth-main">
      <form class="card pad form auth-card" id="resetForm" novalidate>
        <div class="auth-logo"><span class="logo">${icon("box")}</span><b>ComponentHub</b></div>
        <div><h2 class="auth-title">Reset password</h2><p class="muted">Use your registered email to reset your password.</p></div>
        <p class="bad" id="resetError" role="alert" hidden></p>
        <p class="ok" id="resetSuccess" hidden></p>
        <div id="emailStep">
          <label>Email<input id="email" type="email" autocomplete="email" required></label>
          <button class="btn block" id="sendButton" type="submit">Send OTP</button>
        </div>
        <div id="otpStep" hidden>
          <p class="muted">If an account exists, a code was sent to <b id="resetEmail"></b>.</p>
          <label>Verification code<input id="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
          <label>New password<span class="pw"><input id="password" type="password" autocomplete="new-password" required><button type="button" id="passwordEye" aria-label="Show password">${icon("eye")}</button></span></label>
          <label>Confirm password<span class="pw"><input id="confirmPassword" type="password" autocomplete="new-password" required><button type="button" id="confirmEye" aria-label="Show password">${icon("eye")}</button></span></label>
          <button class="btn block" id="resetButton" type="button">Reset Password</button>
          <button class="btn ghost block" id="resendButton" type="button">Resend OTP</button>
        </div>
        <p class="muted" style="text-align:center"><a href="login.html">Return to login</a></p>
      </form>
    </main>
  </div>`;
renderIcons();

// Toggle visibility for a password input and update its accessible label.
const togglePassword = (inputId, buttonId) => {
  const input = $(`#${inputId}`);
  const button = $(`#${buttonId}`);
  button.onclick = () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    button.innerHTML = icon(show ? "eye-off" : "eye");
    renderIcons();
  };
};

togglePassword("password", "passwordEye");
togglePassword("confirmPassword", "confirmEye");

// Display a validation or API error beside the recovery form.
const showError = (message) => {
  $("#resetSuccess").hidden = true;
  $("#resetError").textContent = message;
  $("#resetError").hidden = false;
};

// Send a JSON request to the password recovery API.
const api = async (path, body) => {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
};

$("#resetForm").onsubmit = async (event) => {
  event.preventDefault();
  const email = $("#email").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showError("Enter a valid email address.");
  }

  const button = $("#sendButton");
  button.disabled = true;
  button.textContent = "Sending OTP…";
  try {
    const data = await api("/auth/forgot-password", { email });
    window.resetToken = data.resetToken;
    $("#emailStep").hidden = true;
    $("#otpStep").hidden = false;
    $("#resetEmail").textContent = data.email || email;
    $("#resetSuccess").textContent = data.message;
    $("#resetSuccess").hidden = false;
    $("#otp").focus();
  } catch (error) {
    showError(error instanceof TypeError ? "Cannot reach the server. Please try again." : error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Send OTP";
  }
};

$("#resetButton").onclick = async () => {
  const otp = $("#otp").value.trim();
  const password = $("#password").value;
  const confirmPassword = $("#confirmPassword").value;
  if (!/^\d{6}$/.test(otp)) return showError("Enter the 6-digit verification code.");
  if (password.length < 8) return showError("Password must be at least 8 characters.");
  if (password !== confirmPassword) return showError("Passwords do not match.");

  const button = $("#resetButton");
  button.disabled = true;
  button.textContent = "Resetting password…";
  try {
    await api("/auth/reset-password", {
      resetToken: window.resetToken,
      otp,
      password,
      confirmPassword
    });
    $("#resetSuccess").textContent = "Password reset successfully. Redirecting to login…";
    $("#resetSuccess").hidden = false;
    setTimeout(() => location.replace("login.html"), 1200);
  } catch (error) {
    showError(error instanceof TypeError ? "Cannot reach the server. Please try again." : error.message);
    button.disabled = false;
    button.textContent = "Reset Password";
  }
};

$("#resendButton").onclick = async () => {
  const button = $("#resendButton");
  button.disabled = true;
  try {
    const data = await api("/auth/forgot-password/resend", { resetToken: window.resetToken });
    $("#resetSuccess").textContent = data.message;
    $("#resetSuccess").hidden = false;
  } catch (error) {
    showError(error instanceof TypeError ? "Cannot reach the server. Please try again." : error.message);
  } finally {
    button.disabled = false;
  }
};
