export default function VerifyPage() {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "420px" }}>
        <div className="card">
          <h1>Check your email</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            We sent you a sign-in link. Click it to continue.
          </p>
        </div>
      </div>
    </main>
  );
}
